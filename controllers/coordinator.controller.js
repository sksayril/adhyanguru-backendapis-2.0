const Coordinator = require('../models/coordinator.model');
const WalletTransaction = require('../models/walletTransaction.model');
const FieldManager = require('../models/fieldManager.model');
const DistrictCoordinator = require('../models/districtCoordinator.model');
const Student = require('../models/student.model');
const StudentSubscription = require('../models/studentSubscription.model');
const StudentCoursePurchase = require('../models/studentCoursePurchase.model');
const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const Admin = require('../models/admin.model');
const { encryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');

/**
 * Coordinator Login
 */
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide identifier (email/mobile/userId) and password'
      });
    }

    const coordinator = await Coordinator.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    }).populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!coordinator.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, coordinator.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(coordinator);

    // Ensure wallet exists with default values if not set
    if (!coordinator.wallet) {
      coordinator.wallet = {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      };
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          _id: coordinator._id,
          userId: coordinator.userId,
          email: coordinator.email,
          mobileNumber: coordinator.mobileNumber,
          firstName: coordinator.firstName,
          lastName: coordinator.lastName,
          role: coordinator.role,
          profilePicture: coordinator.profilePicture || null,
          district: coordinator.district,
          districtCoordinator: coordinator.createdBy, // This is the District Coordinator who created this Coordinator
          wallet: coordinator.wallet
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Get Coordinator Profile
 */
const getProfile = async (req, res) => {
  try {
    const coordId = req.user.userId;

    const coordinator = await Coordinator.findById(coordId)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture')
      .populate('taskLevels.taskLevel', 'name description level registrationLimit globalRegistrationCount')
      .populate('taskLevels.assignedBy', 'userId firstName lastName email')
      .populate('assignedDistrictCoordinators', 'userId firstName lastName email mobileNumber profilePicture district districtRef role');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Ensure wallet exists with default values if not set
    if (!coordinator.wallet) {
      coordinator.wallet = {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      };
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...coordinator.toObject(),
        districtCoordinator: coordinator.createdBy,
        taskLevels: coordinator.taskLevels,
        registrationLimits: coordinator.registrationLimits,
        registrationCounts: coordinator.registrationCounts,
        assignedDistrictCoordinators: coordinator.assignedDistrictCoordinators,
        wallet: coordinator.wallet
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile',
      error: error.message
    });
  }
};

/**
 * Update Coordinator Profile
 */
const updateProfile = async (req, res) => {
  try {
    const coordId = req.user.userId;
    const { firstName, lastName, email, mobileNumber, latitude, longitude } = req.body;

    const coordinator = await Coordinator.findById(coordId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Update fields
    if (firstName) coordinator.firstName = firstName;
    if (lastName) coordinator.lastName = lastName;
    if (email) coordinator.email = email;
    if (mobileNumber) coordinator.mobileNumber = mobileNumber;
    if (latitude) coordinator.latitude = parseFloat(latitude);
    if (longitude) coordinator.longitude = parseFloat(longitude);

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `coord-${Date.now()}.${fileExtension}`;
        coordinator.profilePicture = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    await coordinator.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: coordinator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * Create Field Manager (by Coordinator)
 */
const createFieldManager = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, district, registrationLevel, taskLevelId } = req.body;
    const createdBy = req.user.userId;

    // Get coordinator and check registration limits
    const coordinator = await Coordinator.findById(createdBy);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // If taskLevelId is provided, check task-level-specific limits
    if (taskLevelId) {
      const taskLevelAssignment = coordinator.taskLevels.find(
        tl => tl.taskLevel && tl.taskLevel.toString() === taskLevelId
      );

      if (!taskLevelAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Task level not assigned to this coordinator'
        });
      }

      // Get the task level to check global limit
      const TaskLevel = require('../models/taskLevel.model');
      const taskLevel = await TaskLevel.findById(taskLevelId);
      if (!taskLevel) {
        return res.status(404).json({
          success: false,
          message: 'Task level not found'
        });
      }

      // Check coordinator's task-level limit
      const coordinatorLimit = taskLevelAssignment.registrationLimit || taskLevel.registrationLimit;
      if (coordinatorLimit > 0 && taskLevelAssignment.registrationCount >= coordinatorLimit) {
        return res.status(400).json({
          success: false,
          message: `Task level registration limit reached for coordinator. Current: ${taskLevelAssignment.registrationCount}/${coordinatorLimit}`
        });
      }

      // Check global task level limit
      if (taskLevel.registrationLimit > 0 && taskLevel.globalRegistrationCount >= taskLevel.registrationLimit) {
        return res.status(400).json({
          success: false,
          message: `Global task level registration limit reached. Current: ${taskLevel.globalRegistrationCount}/${taskLevel.registrationLimit}`
        });
      }

      // Increment task-level counts
      taskLevelAssignment.registrationCount += 1;
      taskLevel.globalRegistrationCount += 1;
      await taskLevel.save();
    } else {
      // Use legacy level1/level2 limits
      const level = registrationLevel === 2 ? 'level2' : 'level1';
      const currentCount = coordinator.registrationCounts[level];
      const limit = coordinator.registrationLimits[level];

      // Check if registration limit is reached
      if (limit > 0 && currentCount >= limit) {
        return res.status(400).json({
          success: false,
          message: `Registration limit reached for ${level}. Current: ${currentCount}/${limit}`
        });
      }

      // Increment legacy counts
      coordinator.registrationCounts[level] = currentCount + 1;
    }

    const existingUser = await FieldManager.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Field Manager already exists with this email or mobile number'
      });
    }

    const count = await FieldManager.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.FIELD_MANAGER, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const fieldManager = new FieldManager({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district,
      createdBy: coordinator._id
    });

    await fieldManager.save();

    // Save coordinator with updated counts
    await coordinator.save();

    res.status(201).json({
      success: true,
      message: 'Field Manager created successfully',
      data: {
        _id: fieldManager._id,
        userId: fieldManager.userId,
        email: fieldManager.email,
        mobileNumber: fieldManager.mobileNumber,
        firstName: fieldManager.firstName,
        lastName: fieldManager.lastName,
        district: fieldManager.district,
        role: fieldManager.role,
        createdBy: fieldManager.createdBy,
        registrationInfo: taskLevelId ? {
          taskLevelId: taskLevelId,
          coordinatorCount: coordinator.taskLevels.find(tl => tl.taskLevel && tl.taskLevel.toString() === taskLevelId)?.registrationCount || 0,
          coordinatorLimit: coordinator.taskLevels.find(tl => tl.taskLevel && tl.taskLevel.toString() === taskLevelId)?.registrationLimit || 0
        } : {
          level: registrationLevel === 2 ? 'level2' : 'level1',
          currentCount: coordinator.registrationCounts[registrationLevel === 2 ? 'level2' : 'level1'],
          limit: coordinator.registrationLimits[registrationLevel === 2 ? 'level2' : 'level1']
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating field manager',
      error: error.message
    });
  }
};

/**
 * Get users related to coordinator
 * Returns the District Coordinator (parent) and assigned District Coordinators
 */
const getMyUsers = async (req, res) => {
  try {
    const coordId = req.user.userId;
    
    const coordinator = await Coordinator.findById(coordId)
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture district districtRef role')
      .populate('assignedDistrictCoordinators', 'userId firstName lastName email mobileNumber profilePicture district districtRef role')
      .populate('taskLevels.taskLevel', 'name description level registrationLimit globalRegistrationCount')
      .populate('taskLevels.assignedBy', 'userId firstName lastName email');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    const districtCoordinator = coordinator.createdBy;
    const users = [
      {
        _id: districtCoordinator._id,
        userId: districtCoordinator.userId,
        email: districtCoordinator.email,
        mobileNumber: districtCoordinator.mobileNumber,
        firstName: districtCoordinator.firstName,
        lastName: districtCoordinator.lastName,
        role: districtCoordinator.role,
        district: districtCoordinator.district || null,
        profilePicture: districtCoordinator.profilePicture || null
      }
    ];

    // Add assigned district coordinators
    if (coordinator.assignedDistrictCoordinators && coordinator.assignedDistrictCoordinators.length > 0) {
      coordinator.assignedDistrictCoordinators.forEach(dc => {
        users.push({
          _id: dc._id,
          userId: dc.userId,
          email: dc.email,
          mobileNumber: dc.mobileNumber,
          firstName: dc.firstName,
          lastName: dc.lastName,
          role: dc.role,
          district: dc.district || null,
          profilePicture: dc.profilePicture || null
        });
      });
    }

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      coordinatorInfo: {
        taskLevels: coordinator.taskLevels,
        registrationLimits: coordinator.registrationLimits,
        registrationCounts: coordinator.registrationCounts
      },
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving users',
      error: error.message
    });
  }
};

/**
 * Get details of a specific user (Parent District Coordinator)
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    // Coordinators can only view their parent District Coordinator
    const user = await DistrictCoordinator.findOne(searchQuery)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or you don't have permission to view this user"
      });
    }

    res.json({
      success: true,
      message: 'User details retrieved successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving user details',
      error: error.message
    });
  }
};

/**
 * Get Coordinator Dashboard
 * Comprehensive dashboard with sign-ups, subscriptions, growth chart, and performance metrics
 * Optimized for performance using aggregation pipelines and parallel queries
 */
const getDashboard = async (req, res) => {
  try {
    const coordId = req.user.userId;
    const { period = '30' } = req.query; // Period in days (default: 30 days)

    const coordinator = await Coordinator.findById(coordId).lean();
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    // Ensure wallet exists
    if (!coordinator.wallet) {
      coordinator.wallet = {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      };
    }

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const coordinatorId = coordinator._id;

    // Get student IDs first (lean and only _id field for performance)
    const studentIds = await Student.find({
      'referralHierarchy.coordinator': coordinatorId
    }).select('_id').lean();

    const studentIdArray = studentIds.map(s => s._id);

    // Parallel queries for better performance
    const [
      totalSignUps,
      subscriptionStats,
      courseStats,
      revenueStats,
      hierarchyCounts,
      growthChartData,
      recentSignUps,
      recentSubscriptions,
      commissionStats
    ] = await Promise.all([
      // Total sign-ups count
      Student.countDocuments({
        'referralHierarchy.coordinator': coordinatorId
      }),

      // Subscription statistics using aggregation
      StudentSubscription.aggregate([
        {
          $match: {
            student: { $in: studentIdArray },
            paymentStatus: 'COMPLETED',
            isActive: true
          }
        },
        {
          $group: {
            _id: '$student',
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: null,
            uniqueStudents: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]),

      // Course statistics using aggregation
      StudentCoursePurchase.aggregate([
        {
          $match: {
            student: { $in: studentIdArray },
            paymentStatus: 'COMPLETED'
          }
        },
        {
          $group: {
            _id: '$student',
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $group: {
            _id: null,
            uniqueStudents: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      ]),

      // Total revenue aggregation
      Promise.all([
        StudentSubscription.aggregate([
          {
            $match: {
              student: { $in: studentIdArray },
              paymentStatus: 'COMPLETED',
              isActive: true
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]),
        StudentCoursePurchase.aggregate([
          {
            $match: {
              student: { $in: studentIdArray },
              paymentStatus: 'COMPLETED'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
      ]),

      // Hierarchy counts (parallel queries)
      Promise.all([
        DistrictCoordinator.countDocuments({
          assignedByCoordinator: coordinatorId
        }),
        DistrictCoordinator.find({
          assignedByCoordinator: coordinatorId
        }).select('_id').lean().then(dcs => {
          const dcIds = dcs.map(dc => dc._id);
          return Promise.all([
            TeamLeader.countDocuments({
              assignedByDistrictCoordinator: { $in: dcIds }
            }),
            TeamLeader.find({
              assignedByDistrictCoordinator: { $in: dcIds }
            }).select('_id').lean().then(tls => {
              const tlIds = tls.map(tl => tl._id);
              return FieldEmployee.countDocuments({
                assignedByTeamLeader: { $in: tlIds }
              });
            })
          ]);
        })
      ]),

      // Growth chart using aggregation (single query instead of loop)
      Promise.all([
        Student.aggregate([
          {
            $match: {
              'referralHierarchy.coordinator': coordinatorId,
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        StudentSubscription.aggregate([
          {
            $match: {
              student: { $in: studentIdArray },
              paymentStatus: 'COMPLETED',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$createdAt'
                }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]),

      // Recent sign-ups
      Student.find({
        'referralHierarchy.coordinator': coordinatorId
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('userId firstName lastName email mobileNumber createdAt referralHierarchy.referringFieldEmployee')
        .populate('referralHierarchy.referringFieldEmployee', 'userId firstName lastName referralCode')
        .lean(),

      // Recent subscriptions
      StudentSubscription.find({
        student: { $in: studentIdArray },
        paymentStatus: 'COMPLETED'
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('student', 'userId firstName lastName')
        .populate('plan', 'duration amount')
        .populate('subCategory', 'name')
        .lean(),

      // Commission statistics (single query with aggregation)
      WalletTransaction.aggregate([
        {
          $match: {
            user: coordinatorId,
            userModel: 'Coordinator',
            type: 'COMMISSION',
            status: 'COMPLETED'
          }
        },
        {
          $facet: {
            total: [
              {
                $group: {
                  _id: null,
                  total: { $sum: '$amount' }
                }
              }
            ],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: 'students',
                  localField: 'relatedTransaction.student',
                  foreignField: '_id',
                  as: 'studentInfo'
                }
              },
              {
                $project: {
                  amount: 1,
                  description: 1,
                  createdAt: 1,
                  student: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: '$studentInfo',
                          as: 's',
                          in: {
                            userId: '$$s.userId',
                            firstName: '$$s.firstName',
                            lastName: '$$s.lastName'
                          }
                        }
                      },
                      0
                    ]
                  }
                }
              }
            ]
          }
        }
      ])
    ]);

    // Process results
    const subscriptionResult = subscriptionStats[0] || { uniqueStudents: 0, totalRevenue: 0 };
    const courseResult = courseStats[0] || { uniqueStudents: 0, totalRevenue: 0 };
    const [subscriptionRevenue, courseRevenue] = revenueStats;
    const subRev = subscriptionRevenue[0]?.total || 0;
    const courseRev = courseRevenue[0]?.total || 0;
    
    const [dcCount, [tlCount, feCount]] = hierarchyCounts;
    
    // Process growth chart data
    const [signUpsData, subscriptionsData] = growthChartData;
    const signUpsMap = new Map(signUpsData.map(item => [item._id, item.count]));
    const subscriptionsMap = new Map(subscriptionsData.map(item => [item._id, item.count]));
    
    // Generate all dates in range
    const growthChartDataProcessed = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      growthChartDataProcessed.push({
        date: dateStr,
        signUps: signUpsMap.get(dateStr) || 0,
        subscriptions: subscriptionsMap.get(dateStr) || 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const commissionResult = commissionStats[0] || { total: [], recent: [] };
    const totalCommissions = commissionResult.total[0]?.total || 0;
    const recentCommissions = commissionResult.recent || [];

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: {
        coordinator: {
          userId: coordinator.userId,
          firstName: coordinator.firstName,
          lastName: coordinator.lastName,
          email: coordinator.email
        },
        wallet: coordinator.wallet,
        overview: {
          totalSignUps,
          totalSubscriptionUsers: subscriptionResult.uniqueStudents || 0,
          totalCourseUsers: courseResult.uniqueStudents || 0,
          totalRevenue: {
            subscriptions: subRev,
            courses: courseRev,
            total: subRev + courseRev
          },
          totalCommissions,
          hierarchyCounts: {
            districtCoordinators: dcCount || 0,
            teamLeaders: tlCount || 0,
            fieldEmployees: feCount || 0
          }
        },
        growthChart: {
          period: `${periodDays} days`,
          data: growthChartDataProcessed
        },
        recentActivity: {
          signUps: recentSignUps.map(s => ({
            userId: s.userId,
            name: `${s.firstName} ${s.lastName}`,
            email: s.email,
            mobileNumber: s.mobileNumber,
            referredBy: s.referralHierarchy?.referringFieldEmployee ? {
              userId: s.referralHierarchy.referringFieldEmployee.userId,
              name: `${s.referralHierarchy.referringFieldEmployee.firstName} ${s.referralHierarchy.referringFieldEmployee.lastName}`,
              referralCode: s.referralHierarchy.referringFieldEmployee.referralCode
            } : null,
            createdAt: s.createdAt
          })),
          subscriptions: recentSubscriptions.map(sub => ({
            student: {
              userId: sub.student?.userId || '',
              name: sub.student ? `${sub.student.firstName} ${sub.student.lastName}` : ''
            },
            plan: {
              duration: sub.plan?.duration || '',
              amount: sub.plan?.amount || 0
            },
            subCategory: sub.subCategory?.name || '',
            amount: sub.amount || 0,
            createdAt: sub.createdAt
          })),
          commissions: recentCommissions.map(comm => ({
            amount: comm.amount,
            student: comm.student ? {
              userId: comm.student.userId,
              name: `${comm.student.firstName} ${comm.student.lastName}`
            } : null,
            description: comm.description,
            createdAt: comm.createdAt
          }))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
};

/**
 * Get Admin Contact Information
 * Get the admin's contact details (email and mobile number) for support
 */
const getAdminContact = async (req, res) => {
  try {
    const coordId = req.user.userId;

    const coordinator = await Coordinator.findById(coordId)
      .populate({
        path: 'createdBy',
        model: 'DistrictCoordinator',
        select: 'createdBy',
        populate: {
          path: 'createdBy',
          model: 'Admin',
          select: 'userId firstName lastName email mobileNumber'
        }
      })
      .lean();

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    const districtCoordinator = coordinator.createdBy;
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    const admin = districtCoordinator.createdBy;
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found for this coordinator'
      });
    }

    res.json({
      success: true,
      message: 'Admin contact information retrieved successfully',
      data: {
        admin: {
          userId: admin.userId,
          name: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
          mobileNumber: admin.mobileNumber
        },
        supportInfo: {
          email: admin.email,
          contactNumber: admin.mobileNumber,
          message: 'Contact your admin for support and assistance'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving admin contact information',
      error: error.message
    });
  }
};

/**
 * Get Wallet Balance
 */
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const coordinator = await Coordinator.findById(userId).select('userId firstName lastName wallet');

    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    res.json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        userId: coordinator.userId,
        name: `${coordinator.firstName} ${coordinator.lastName}`,
        wallet: coordinator.wallet || {
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving wallet balance',
      error: error.message
    });
  }
};

/**
 * Get Wallet Transactions
 */
const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, type } = req.query;

    const coordinator = await Coordinator.findById(userId);
    if (!coordinator) {
      return res.status(404).json({
        success: false,
        message: 'Coordinator not found'
      });
    }

    const query = {
      user: coordinator._id,
      userModel: 'Coordinator'
    };

    if (type) {
      query.type = type;
    }

    const transactions = await WalletTransaction.find(query)
      .populate('relatedTransaction.student', 'userId firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WalletTransaction.countDocuments(query);

    res.json({
      success: true,
      message: 'Wallet transactions retrieved successfully',
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving wallet transactions',
      error: error.message
    });
  }
};

module.exports = {
  login,
  getProfile,
  updateProfile,
  createFieldManager,
  getMyUsers,
  getUserDetails,
  getDashboard,
  getAdminContact,
  getWalletBalance,
  getWalletTransactions
};

