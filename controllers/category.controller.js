const MainCategory = require('../models/mainCategory.model');
const SubCategory = require('../models/subCategory.model');
const { processImage, getFileExtension } = require('../services/imageProcessingService');
const { uploadToS3, deleteFromS3 } = require('../services/awsS3Service');
const SuperAdmin = require('../models/superAdmin.model');
const { USER_ROLES } = require('../utils/constants');

/**
 * Create Main Category (Super Admin only)
 */
const createMainCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user.userId; // From authenticated user (MongoDB _id)

    // Check if user is Super Admin
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create categories'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await MainCategory.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Main category with this name already exists'
      });
    }

    // Get super admin who is creating
    const superAdmin = await SuperAdmin.findById(createdBy);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `main-category-${Date.now()}-${name.trim().replace(/\s+/g, '-')}.${fileExtension}`;

        // Upload to S3
        imageUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing category image',
          error: error.message
        });
      }
    }

    // Create main category
    const mainCategory = new MainCategory({
      name: name.trim(),
      description: description ? description.trim() : null,
      image: imageUrl,
      createdBy: superAdmin._id
    });

    await mainCategory.save();

    res.status(201).json({
      success: true,
      message: 'Main category created successfully',
      data: {
        _id: mainCategory._id,
        name: mainCategory.name,
        description: mainCategory.description,
        image: mainCategory.image,
        isActive: mainCategory.isActive,
        createdAt: mainCategory.createdAt,
        updatedAt: mainCategory.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating main category',
      error: error.message
    });
  }
};

/**
 * Get All Main Categories (Super Admin - Protected)
 */
const getAllMainCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await MainCategory.find(query)
      .populate('createdBy', 'userId firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Main categories retrieved successfully',
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving main categories',
      error: error.message
    });
  }
};

/**
 * Get Main Category by ID (Super Admin - Protected)
 */
const getMainCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await MainCategory.findById(id)
      .populate('createdBy', 'userId firstName lastName');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    res.json({
      success: true,
      message: 'Main category retrieved successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving main category',
      error: error.message
    });
  }
};

/**
 * Update Main Category (Super Admin only)
 */
const updateMainCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const category = await MainCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Check if name is being changed and if new name already exists
    if (name && name.trim() !== category.name) {
      const existingCategory = await MainCategory.findOne({ name: name.trim() });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Main category with this name already exists'
        });
      }
      category.name = name.trim();
    }

    if (description !== undefined) {
      category.description = description ? description.trim() : null;
    }

    if (isActive !== undefined) {
      category.isActive = isActive === 'true' || isActive === true;
    }

    // Handle image update if provided
    if (req.file) {
      try {
        // Delete old image from S3 if exists
        if (category.image) {
          try {
            await deleteFromS3(category.image);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Process and upload new image
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `main-category-${Date.now()}-${category.name.replace(/\s+/g, '-')}.${fileExtension}`;

        category.image = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing category image',
          error: error.message
        });
      }
    }

    await category.save();

    res.json({
      success: true,
      message: 'Main category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating main category',
      error: error.message
    });
  }
};

/**
 * Delete Main Category (Super Admin only)
 */
const deleteMainCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await MainCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Check if category has sub categories
    const subCategoriesCount = await SubCategory.countDocuments({ mainCategory: id });
    if (subCategoriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete main category. It has ${subCategoriesCount} sub category(ies). Please delete sub categories first.`
      });
    }

    // Delete image from S3 if exists
    if (category.image) {
      try {
        await deleteFromS3(category.image);
      } catch (error) {
        console.error('Error deleting image from S3:', error);
      }
    }

    await MainCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Main category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting main category',
      error: error.message
    });
  }
};

/**
 * Create Sub Category (Super Admin only)
 */
const createSubCategory = async (req, res) => {
  try {
    const { name, description, mainCategoryId } = req.body;
    const createdBy = req.user.userId; // From authenticated user (MongoDB _id)

    // Check if user is Super Admin
    if (req.user.role !== USER_ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can create sub categories'
      });
    }

    if (!name || !mainCategoryId) {
      return res.status(400).json({
        success: false,
        message: 'Sub category name and main category ID are required'
      });
    }

    // Check if main category exists
    const mainCategory = await MainCategory.findById(mainCategoryId);
    if (!mainCategory) {
      return res.status(404).json({
        success: false,
        message: 'Main category not found'
      });
    }

    // Check if sub category already exists under this main category
    const existingSubCategory = await SubCategory.findOne({
      name: name.trim(),
      mainCategory: mainCategoryId
    });

    if (existingSubCategory) {
      return res.status(400).json({
        success: false,
        message: 'Sub category with this name already exists under this main category'
      });
    }

    // Get super admin who is creating
    const superAdmin = await SuperAdmin.findById(createdBy);
    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Super Admin not found'
      });
    }

    // Handle image upload if provided
    let imageUrl = null;
    if (req.file) {
      try {
        // Process image with Jimp
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `sub-category-${Date.now()}-${name.trim().replace(/\s+/g, '-')}.${fileExtension}`;

        // Upload to S3
        imageUrl = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing sub category image',
          error: error.message
        });
      }
    }

    // Create sub category
    const subCategory = new SubCategory({
      name: name.trim(),
      description: description ? description.trim() : null,
      image: imageUrl,
      mainCategory: mainCategoryId,
      createdBy: superAdmin._id
    });

    await subCategory.save();
    await subCategory.populate('mainCategory', 'name description image');

    res.status(201).json({
      success: true,
      message: 'Sub category created successfully',
      data: {
        _id: subCategory._id,
        name: subCategory.name,
        description: subCategory.description,
        image: subCategory.image,
        mainCategory: subCategory.mainCategory,
        isActive: subCategory.isActive,
        createdAt: subCategory.createdAt,
        updatedAt: subCategory.updatedAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating sub category',
      error: error.message
    });
  }
};

/**
 * Get All Sub Categories (Super Admin - Protected)
 */
const getAllSubCategories = async (req, res) => {
  try {
    const { mainCategoryId, isActive } = req.query;
    const query = {};
    
    if (mainCategoryId) {
      query.mainCategory = mainCategoryId;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const subCategories = await SubCategory.find(query)
      .populate('mainCategory', 'name description image')
      .populate('createdBy', 'userId firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Sub categories retrieved successfully',
      data: subCategories,
      count: subCategories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving sub categories',
      error: error.message
    });
  }
};

/**
 * Get Sub Category by ID (Super Admin - Protected)
 */
const getSubCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id)
      .populate('mainCategory', 'name description image')
      .populate('createdBy', 'userId firstName lastName');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    res.json({
      success: true,
      message: 'Sub category retrieved successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving sub category',
      error: error.message
    });
  }
};

/**
 * Update Sub Category (Super Admin only)
 */
const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, mainCategoryId, isActive } = req.body;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    // Check if main category is being changed
    if (mainCategoryId && mainCategoryId !== subCategory.mainCategory.toString()) {
      const mainCategory = await MainCategory.findById(mainCategoryId);
      if (!mainCategory) {
        return res.status(404).json({
          success: false,
          message: 'Main category not found'
        });
      }
      subCategory.mainCategory = mainCategoryId;
    }

    // Check if name is being changed and if new name already exists under the main category
    if (name && name.trim() !== subCategory.name) {
      const mainCatId = mainCategoryId || subCategory.mainCategory;
      const existingSubCategory = await SubCategory.findOne({
        name: name.trim(),
        mainCategory: mainCatId,
        _id: { $ne: id }
      });
      if (existingSubCategory) {
        return res.status(400).json({
          success: false,
          message: 'Sub category with this name already exists under this main category'
        });
      }
      subCategory.name = name.trim();
    }

    if (description !== undefined) {
      subCategory.description = description ? description.trim() : null;
    }

    if (isActive !== undefined) {
      subCategory.isActive = isActive === 'true' || isActive === true;
    }

    // Handle image update if provided
    if (req.file) {
      try {
        // Delete old image from S3 if exists
        if (subCategory.image) {
          try {
            await deleteFromS3(subCategory.image);
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Process and upload new image
        const processedImage = await processImage(req.file.buffer);
        const fileExtension = getFileExtension(req.file.mimetype);
        const fileName = `sub-category-${Date.now()}-${subCategory.name.replace(/\s+/g, '-')}.${fileExtension}`;

        subCategory.image = await uploadToS3(processedImage, fileName, req.file.mimetype);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error processing sub category image',
          error: error.message
        });
      }
    }

    await subCategory.save();
    await subCategory.populate('mainCategory', 'name description image');

    res.json({
      success: true,
      message: 'Sub category updated successfully',
      data: subCategory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating sub category',
      error: error.message
    });
  }
};

/**
 * Delete Sub Category (Super Admin only)
 */
const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Sub category not found'
      });
    }

    // Delete image from S3 if exists
    if (subCategory.image) {
      try {
        await deleteFromS3(subCategory.image);
      } catch (error) {
        console.error('Error deleting image from S3:', error);
      }
    }

    await SubCategory.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Sub category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting sub category',
      error: error.message
    });
  }
};

/**
 * Public API - Get All Active Main Categories
 */
const getPublicMainCategories = async (req, res) => {
  try {
    const categories = await MainCategory.find({ isActive: true })
      .select('name description image createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Main categories retrieved successfully',
      data: categories,
      count: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving main categories',
      error: error.message
    });
  }
};

/**
 * Public API - Get All Active Sub Categories
 */
const getPublicSubCategories = async (req, res) => {
  try {
    const { mainCategoryId } = req.query;
    const query = { isActive: true };
    
    if (mainCategoryId) {
      query.mainCategory = mainCategoryId;
    }

    const subCategories = await SubCategory.find(query)
      .populate('mainCategory', 'name description image')
      .select('name description image mainCategory createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Sub categories retrieved successfully',
      data: subCategories,
      count: subCategories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving sub categories',
      error: error.message
    });
  }
};

module.exports = {
  // Main Category
  createMainCategory,
  getAllMainCategories,
  getMainCategoryById,
  updateMainCategory,
  deleteMainCategory,
  // Sub Category
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  // Public APIs
  getPublicMainCategories,
  getPublicSubCategories
};

