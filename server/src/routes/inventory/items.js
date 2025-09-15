// server/src/routes/inventory/items.js
import express from 'express';
const router = express.Router();
import auth from '../../middleware/auth.js';
import * as inventoryItemController from '../../controllers/inventory/inventoryItemController.js';

// Public endpoint for retrieving all items (no auth required)
router.get('/public', async (req, res, next) => {
  try {
    const { q, category } = req.query;
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

    const Part = (await import('../../models/inventory/Part.js')).default;
    const items = await Part.find(filter).select('name partCode _id');
    res.json({ items });
  } catch (err) {
    console.error('Error fetching inventory items for public access:', err);
    res.status(500).json({ message: 'Failed to fetch inventory items' });
  }
});

// Get all inventory items
router.get('/', auth, inventoryItemController.getAllItems);

// Get low stock items
router.get('/low-stock', auth, inventoryItemController.getLowStockItems);

// Get a single inventory item by ID
router.get('/:id', auth, inventoryItemController.getItemById);

// Create a new inventory item
router.post('/', auth, inventoryItemController.createItem);

// Update an inventory item
router.put('/:id', auth, inventoryItemController.updateItem);

// Update inventory item quantity
router.put('/:id/quantity', auth, inventoryItemController.updateItemQuantity);

// Delete an inventory item (soft delete)
router.delete('/:id', auth, inventoryItemController.deleteItem);

export default router;