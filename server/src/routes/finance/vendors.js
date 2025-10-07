import express from 'express';
import vendorController from '../controllers/vendorController';

const router = express.Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All routes require authentication
router.use(protect);

// Get all vendors with filters and pagination
router.get('/', vendorController.getVendors);

// Get vendor by ID
router.get('/:id', vendorController.getVendor);

// Create new vendor (finance managers only)
router.post('/', authorize('finance_manager', 'admin'), validate(schemas.vendor), vendorController.createVendor);

// Update vendor (finance managers only)
router.put('/:id', authorize('finance_manager', 'admin'), validate(schemas.vendor), vendorController.updateVendor);

// Delete vendor (finance managers only)
router.delete('/:id', authorize('finance_manager', 'admin'), vendorController.deleteVendor);

export default router;
