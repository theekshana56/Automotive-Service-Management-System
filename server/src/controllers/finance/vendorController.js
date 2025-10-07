import Vendor from '../../models/finance/Vendor.js';
import Bill from '../../models/finance/Bill.js';


// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
export const getVendors = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit', 'search'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Vendor.find(JSON.parse(queryStr));

    // Search
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query = query.or([
        { name: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex }
      ]);
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('name');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Vendor.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const vendors = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: vendors.length,
      pagination,
      data: vendors
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
export const getVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
// @access  Private
export const createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);

    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
export const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Check if vendor has bills
    
    const billCount = await Bill.countDocuments({ vendor: req.params.id });

    if (billCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vendor with existing bills'
      });
    }

    await vendor.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
