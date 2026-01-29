const DistrictCoordinator = require('../models/districtCoordinator.model');
const WalletTransaction = require('../models/walletTransaction.model');
const Coordinator = require('../models/coordinator.model');
const TeamLeader = require('../models/teamLeader.model');
const FieldEmployee = require('../models/fieldEmployee.model');
const Student = require('../models/student.model');
const StudentSubscription = require('../models/studentSubscription.model');
const StudentCoursePurchase = require('../models/studentCoursePurchase.model');
const { encryptPassword, decryptPassword, comparePassword } = require('../services/passwordService');
const { generateUserId, getNextSequenceNumber } = require('../services/userIdService');
const { generateToken } = require('../middleware/auth');
const { USER_ROLES } = require('../utils/constants');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3 } = require('../services/awsS3Service');

/**
 * District Coordinator Login
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

    const districtCoordinator = await DistrictCoordinator.findOne({
      $or: [
        { email: identifier },
        { mobileNumber: identifier },
        { userId: identifier }
      ]
    }).populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!districtCoordinator.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    const isPasswordValid = comparePassword(password, districtCoordinator.encryptedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(districtCoordinator);

    // Ensure wallet exists with default values if not set
    if (!districtCoordinator.wallet) {
      districtCoordinator.wallet = {
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
          _id: districtCoordinator._id,
          userId: districtCoordinator.userId,
          email: districtCoordinator.email,
          mobileNumber: districtCoordinator.mobileNumber,
          firstName: districtCoordinator.firstName,
          lastName: districtCoordinator.lastName,
          role: districtCoordinator.role,
          profilePicture: districtCoordinator.profilePicture || null,
          district: districtCoordinator.district,
          admin: districtCoordinator.createdBy, // This is the Admin who created this DC
          wallet: districtCoordinator.wallet
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
 * Get District Coordinator Profile
 */
const getProfile = async (req, res) => {
  try {
    const dcId = req.user.userId;

    const districtCoordinator = await DistrictCoordinator.findById(dcId)
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture')
      .populate('taskLevels', 'name description level registrationLimit globalRegistrationCount')
      .populate('assignedByCoordinator', 'userId firstName lastName email mobileNumber profilePicture')
      .populate('assignedTeamLeaders', 'userId firstName lastName email mobileNumber profilePicture district districtRef role');

    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Ensure wallet exists with default values if not set
    if (!districtCoordinator.wallet) {
      districtCoordinator.wallet = {
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      };
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        ...districtCoordinator.toObject(),
        admin: districtCoordinator.createdBy,
        taskLevels: districtCoordinator.taskLevels,
        assignedByCoordinator: districtCoordinator.assignedByCoordinator,
        assignedTeamLeaders: districtCoordinator.assignedTeamLeaders,
        wallet: districtCoordinator.wallet
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
 * Update District Coordinator Profile
 */
const updateProfile = async (req, res) => {
  try {
    const dcId = req.user.userId;
    const { firstName, lastName, email, mobileNumber, latitude, longitude } = req.body;

    const districtCoordinator = await DistrictCoordinator.findById(dcId);
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Update fields
    if (firstName) districtCoordinator.firstName = firstName;
    if (lastName) districtCoordinator.lastName = lastName;
    if (email) districtCoordinator.email = email;
    if (mobileNumber) districtCoordinator.mobileNumber = mobileNumber;
    if (latitude) districtCoordinator.latitude = parseFloat(latitude);
    if (longitude) districtCoordinator.longitude = parseFloat(longitude);

    // Handle profile picture upload if provided
    if (req.file) {
      try {
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `dc-${Date.now()}.${fileExtension}`;
        districtCoordinator.profilePicture = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing profile picture',
          error: error.message
        });
      }
    }

    await districtCoordinator.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: districtCoordinator
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
 * Create Team Leader (by District Coordinator)
 */
const createTeamLeader = async (req, res) => {
  try {
    const { 
      email, 
      mobileNumber, 
      password, 
      firstName, 
      lastName, 
      district,
      areaRange,
      boundingBox,
      latitude,
      longitude
    } = req.body;
    const createdBy = req.user.userId;

    const existingUser = await TeamLeader.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Team Leader already exists with this email or mobile number'
      });
    }

    const count = await TeamLeader.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.TEAM_LEADER, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const dc = await DistrictCoordinator.findById(createdBy);
    if (!dc) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Parse areaRange and boundingBox if they are strings (from multipart/form-data)
    let parsedAreaRange = areaRange;
    let parsedBoundingBox = boundingBox;

    if (typeof areaRange === 'string') {
      try {
        parsedAreaRange = JSON.parse(areaRange);
      } catch (e) {
        // Keep as is if not valid JSON
      }
    }

    if (typeof boundingBox === 'string') {
      try {
        parsedBoundingBox = JSON.parse(boundingBox);
      } catch (e) {
        // Keep as is if not valid JSON
      }
    }

    const teamLeader = new TeamLeader({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district: district || dc.district,
      districtRef: dc.districtRef || null,
      areaRange: parsedAreaRange || null,
      boundingBox: parsedBoundingBox || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      createdBy: dc._id,
      createdByModel: 'DistrictCoordinator'
    });

    await teamLeader.save();

    // Populate createdBy for response
    await teamLeader.populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');
    await teamLeader.populate('districtRef', 'name description areaRange boundingBox centerPoint');

    res.status(201).json({
      success: true,
      message: 'Team Leader created successfully',
      data: {
        _id: teamLeader._id,
        userId: teamLeader.userId,
        email: teamLeader.email,
        mobileNumber: teamLeader.mobileNumber,
        firstName: teamLeader.firstName,
        lastName: teamLeader.lastName,
        district: teamLeader.district,
        districtRef: teamLeader.districtRef,
        areaRange: teamLeader.areaRange,
        boundingBox: teamLeader.boundingBox,
        latitude: teamLeader.latitude,
        longitude: teamLeader.longitude,
        role: teamLeader.role,
        createdBy: teamLeader.createdBy,
        createdByModel: teamLeader.createdByModel,
        createdAt: teamLeader.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating team leader',
      error: error.message
    });
  }
};

/**
 * Get all Team Leaders created by this District Coordinator
 */
const getTeamLeaders = async (req, res) => {
  try {
    const dcId = req.user.userId;
    const teamLeaders = await TeamLeader.find({ 
      createdBy: dcId, 
      createdByModel: 'DistrictCoordinator' 
    })
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Team Leaders retrieved successfully',
      data: teamLeaders,
      count: teamLeaders.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving team leaders',
      error: error.message
    });
  }
};

/**
 * Get Team Leader details with decrypted password
 * Only returns team leaders created by this district coordinator
 */
const getTeamLeaderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const dcId = req.user.userId; // This is the MongoDB _id of the district coordinator
    const mongoose = require('mongoose');

    // Check if id is a valid MongoDB ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const searchQuery = isValidObjectId 
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    // Add condition to ensure team leader was created by this district coordinator
    const teamLeader = await TeamLeader.findOne({
      ...searchQuery,
      createdBy: dcId,
      createdByModel: 'DistrictCoordinator'
    })
      .populate('districtRef', 'name description areaRange boundingBox centerPoint')
      .populate('createdBy', 'userId firstName lastName email mobileNumber profilePicture');

    if (!teamLeader) {
      return res.status(404).json({
        success: false,
        message: 'Team Leader not found or you don\'t have permission to view this team leader'
      });
    }

    const userData = teamLeader.toObject();

    // Decrypt the password
    try {
      const encryptedPwd = teamLeader.encryptedPassword || teamLeader.password;
      if (encryptedPwd) {
        const decryptedPassword = decryptPassword(encryptedPwd);
        userData.password = decryptedPassword;
      }
    } catch (error) {
      console.error('Password decryption error:', error);
      userData.password = 'Unable to decrypt password';
    }

    res.json({
      success: true,
      message: 'Team Leader details retrieved successfully',
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving team leader details',
      error: error.message
    });
  }
};

/**
 * Create Coordinator (by District Coordinator)
 */
const createCoordinator = async (req, res) => {
  try {
    const { email, mobileNumber, password, firstName, lastName, district } = req.body;
    const createdBy = req.user.userId;

    const existingUser = await Coordinator.findOne({
      $or: [{ email }, { mobileNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Coordinator already exists with this email or mobile number'
      });
    }

    const count = await Coordinator.countDocuments();
    const sequenceNumber = getNextSequenceNumber(count);
    const userId = generateUserId(USER_ROLES.COORDINATOR, sequenceNumber);

    const encryptedPassword = encryptPassword(password);

    const districtCoordinator = await DistrictCoordinator.findById(createdBy);

    const coordinator = new Coordinator({
      userId,
      email,
      mobileNumber,
      password: encryptedPassword,
      encryptedPassword: encryptedPassword,
      firstName,
      lastName,
      district,
      createdBy: districtCoordinator._id
    });

    await coordinator.save();

    res.status(201).json({
      success: true,
      message: 'Coordinator created successfully',
      data: {
        _id: coordinator._id,
        userId: coordinator.userId,
        email: coordinator.email,
        mobileNumber: coordinator.mobileNumber,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        district: coordinator.district,
        role: coordinator.role,
        createdBy: coordinator.createdBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating coordinator',
      error: error.message
    });
  }
};

/**
 * Get users under district coordinator
 * Returns Coordinators and assigned Team Leaders
 */
const getMyUsers = async (req, res) => {
  try {
    const dcId = req.user.userId;
    
    const districtCoordinator = await DistrictCoordinator.findById(dcId)
      .populate('taskLevels', 'name description level registrationLimit globalRegistrationCount')
      .populate('assignedTeamLeaders', 'userId firstName lastName email mobileNumber profilePicture district districtRef role');
    
    const coordinators = await Coordinator.find({ createdBy: dcId });

    const users = coordinators.map(user => ({
      _id: user._id,
      userId: user.userId,
      email: user.email,
      mobileNumber: user.mobileNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      district: user.district || null,
      profilePicture: user.profilePicture || null
    }));

    // Add assigned team leaders
    if (districtCoordinator.assignedTeamLeaders && districtCoordinator.assignedTeamLeaders.length > 0) {
      districtCoordinator.assignedTeamLeaders.forEach(tl => {
        users.push({
          _id: tl._id,
          userId: tl.userId,
          email: tl.email,
          mobileNumber: tl.mobileNumber,
          firstName: tl.firstName,
          lastName: tl.lastName,
          role: tl.role,
          district: tl.district || null,
          profilePicture: tl.profilePicture || null
        });
      });
    }

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      districtCoordinatorInfo: {
        taskLevels: districtCoordinator.taskLevels,
        assignedTeamLeadersCount: districtCoordinator.assignedTeamLeaders ? districtCoordinator.assignedTeamLeaders.length : 0
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
 * Get District Coordinator Dashboard
 * Comprehensive dashboard with sign-ups, subscriptions, growth chart, and performance metrics
 * Optimized for performance using aggregation pipelines and parallel queries
 */
const getDashboard = async (req, res) => {
  try {
    const dcId = req.user.userId;
    const { period = '30' } = req.query; // Period in days (default: 30 days)

    const districtCoordinator = await DistrictCoordinator.findById(dcId).lean();
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District Coordinator not found'
      });
    }

    // Ensure wallet exists
    if (!districtCoordinator.wallet) {
      districtCoordinator.wallet = {
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

    const dcIdObj = districtCoordinator._id;

    // Get student IDs first (lean and only _id field for performance)
    const studentIds = await Student.find({
      'referralHierarchy.districtCoordinator': dcIdObj
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
        'referralHierarchy.districtCoordinator': dcIdObj
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
        Coordinator.countDocuments({
          createdBy: dcIdObj
        }),
        TeamLeader.countDocuments({
          assignedByDistrictCoordinator: dcIdObj
        }).then(tlCount => {
          return TeamLeader.find({
            assignedByDistrictCoordinator: dcIdObj
          }).select('_id').lean().then(tls => {
            const tlIds = tls.map(tl => tl._id);
            return Promise.all([
              Promise.resolve(tlCount),
              FieldEmployee.countDocuments({
                assignedByTeamLeader: { $in: tlIds }
              })
            ]);
          });
        })
      ]),

      // Growth chart using aggregation (single query instead of loop)
      Promise.all([
        Student.aggregate([
          {
            $match: {
              'referralHierarchy.districtCoordinator': dcIdObj,
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
        'referralHierarchy.districtCoordinator': dcIdObj
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
            user: dcIdObj,
            userModel: 'DistrictCoordinator',
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
    
    const [coordCount, [tlCount, feCount]] = hierarchyCounts;
    
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
        districtCoordinator: {
          userId: districtCoordinator.userId,
          firstName: districtCoordinator.firstName,
          lastName: districtCoordinator.lastName,
          email: districtCoordinator.email
        },
        wallet: districtCoordinator.wallet,
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
            coordinators: coordCount || 0,
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
 * Get Wallet Balance
 */
const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const districtCoordinator = await DistrictCoordinator.findById(userId).select('userId firstName lastName wallet');

    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District coordinator not found'
      });
    }

    res.json({
      success: true,
      message: 'Wallet balance retrieved successfully',
      data: {
        userId: districtCoordinator.userId,
        name: `${districtCoordinator.firstName} ${districtCoordinator.lastName}`,
        wallet: districtCoordinator.wallet || {
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

    const districtCoordinator = await DistrictCoordinator.findById(userId);
    if (!districtCoordinator) {
      return res.status(404).json({
        success: false,
        message: 'District coordinator not found'
      });
    }

    const query = {
      user: districtCoordinator._id,
      userModel: 'DistrictCoordinator'
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
  createCoordinator,
  createTeamLeader,
  getTeamLeaders,
  getTeamLeaderDetails,
  getMyUsers,
  getDashboard,
  getWalletBalance,
  getWalletTransactions
};

