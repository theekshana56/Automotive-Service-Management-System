import express from 'express';
import billController from '../controllers/billController';

const router = express.Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All routes require authentication
router.use(protect);

// Get all bills with filters and pagination
router.get('/', billController.getBills);

// Get bill by ID
router.get('/:id', billController.getBill);

// Create new bill (finance managers only)
router.post('/', authorize('finance_manager', 'admin'), validate(schemas.bill), billController.createBill);

// Update bill (finance managers only)
router.put('/:id', authorize('finance_manager', 'admin'), validate(schemas.bill), billController.updateBill);

// Delete bill (finance managers only)
router.delete('/:id', authorize('finance_manager', 'admin'), billController.deleteBill);

export default router;