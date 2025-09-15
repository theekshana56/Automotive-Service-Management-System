// server/src/controllers/inventory/inventoryItemController.js
import Part from '../../models/inventory/Part.js';

/**
 * Get all inventory items
 */
export const getAllItems = async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    // Apply search filter if query parameter exists
    if (q) {
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { partCode: new RegExp(q, 'i') },
        { category: new RegExp(q, 'i') },
      ];
    }

    // Apply category filter if provided
    if (category) {
      filter.category = category;
    }

    // Get total count for pagination
    const total = await Part.countDocuments(filter);
    
    // Get paginated results
    const items = await Part.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      total,
      items,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    next(error);
  }
};

/**
 * Get low stock items
 */
export const getLowStockItems = async (req, res, next) => {
  try {
    console.log('🔍 Low-stock endpoint called');
    
    // Get all active parts
    const parts = await Part.find({ isActive: true });
    console.log(`📦 Found ${parts.length} active parts`);
    
    // Filter for low stock manually
    const lowStockItems = parts.filter(part => {
      const stock = part.stock || {};
      const onHand = stock.onHand || 0;
      const reorderLevel = stock.reorderLevel || 0;
      
      return onHand <= reorderLevel;
    });
    
    console.log(`⚠️ Found ${lowStockItems.length} low-stock parts`);
    res.json({ 
      total: lowStockItems.length, 
      items: lowStockItems 
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    next(error);
  }
};

/**
 * Get a single inventory item by ID
 */
export const getItemById = async (req, res, next) => {
  try {
    const item = await Part.findOne({ _id: req.params.id, isActive: true });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    next(error);
  }
};

/**
 * Create a new inventory item
 */
export const createItem = async (req, res, next) => {
  try {
    // Extract data from request body
    const { 
      name, 
      partNumber, // Will be mapped to partCode
      category, 
      quantity, // Will be mapped to stock.onHand
      minQuantity, // Will be mapped to stock.reorderLevel
      price, 
      supplier 
    } = req.body;

    // Check if part with same part number already exists
    const existingPart = await Part.findOne({ partCode: partNumber });
    if (existingPart) {
      return res.status(400).json({ message: 'Part with this part number already exists' });
    }

    // Create new part with mapped fields
    const newPart = new Part({
      name,
      partCode: partNumber,
      category,
      description: req.body.description || '',
      stock: {
        onHand: quantity,
        minLevel: minQuantity,
        reorderLevel: minQuantity,
        maxLevel: req.body.maxQuantity || quantity * 2, // Default max to double the current quantity
      },
      isActive: true
    });

    await newPart.save();
    res.status(201).json(newPart);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    next(error);
  }
};

/**
 * Update an inventory item
 */
export const updateItem = async (req, res, next) => {
  try {
    const item = await Part.findOne({ _id: req.params.id, isActive: true });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Update fields
    if (req.body.name) item.name = req.body.name;
    if (req.body.partNumber) item.partCode = req.body.partNumber;
    if (req.body.category) item.category = req.body.category;
    if (req.body.description) item.description = req.body.description;
    
    // Update stock fields
    if (!item.stock) item.stock = {};
    if (req.body.quantity !== undefined) item.stock.onHand = req.body.quantity;
    if (req.body.minQuantity !== undefined) {
      item.stock.minLevel = req.body.minQuantity;
      item.stock.reorderLevel = req.body.minQuantity;
    }
    if (req.body.maxQuantity !== undefined) item.stock.maxLevel = req.body.maxQuantity;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    next(error);
  }
};

/**
 * Update inventory item quantity
 */
export const updateItemQuantity = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
    }

    const item = await Part.findOne({ _id: req.params.id, isActive: true });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Update quantity
    if (!item.stock) item.stock = {};
    item.stock.onHand = quantity;

    await item.save();
    res.json({
      message: 'Quantity updated successfully',
      item
    });
  } catch (error) {
    console.error('Error updating inventory item quantity:', error);
    next(error);
  }
};

/**
 * Delete an inventory item (soft delete)
 */
export const deleteItem = async (req, res, next) => {
  try {
    const item = await Part.findOne({ _id: req.params.id, isActive: true });
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Soft delete by setting isActive to false
    item.isActive = false;
    await item.save();
    
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    next(error);
  }
};