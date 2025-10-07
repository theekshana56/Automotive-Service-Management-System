import express from 'express';
import {
  getPendingJobs,
  createInspection,
  updateInspection,
  completeInspection,
  getInspection,
  getAdvisorInspections,
  deleteBooking
} from '../../controllers/advisor/inspectionController.js';
import auth from '../../middleware/auth.js';
import { body, param } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = express.Router();

// Validation middleware
const createInspectionValidation = [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('inspectionData.vehiclePlate').notEmpty().withMessage('Vehicle plate is required'),
  body('inspectionData.jobType').isIn(['oil-change', 'brake-service', 'engine-repair', 'general-inspection', 'tire-rotation', 'battery-check']).withMessage('Valid job type is required'),
  body('inspectionData.engineOil').isIn(['good', 'needs-change', 'low']).withMessage('Valid engine oil status is required'),
  body('inspectionData.brakeFluid').isIn(['good', 'needs-change', 'low']).withMessage('Valid brake fluid status is required'),
  body('inspectionData.coolant').isIn(['good', 'needs-change', 'low']).withMessage('Valid coolant status is required'),
  body('inspectionData.battery').isIn(['good', 'weak', 'dead']).withMessage('Valid battery status is required'),
  body('inspectionData.notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters')
];

const updateInspectionValidation = [
  param('id').isMongoId().withMessage('Valid inspection ID is required'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('recommendations').optional().isArray().withMessage('Recommendations must be an array')
];

const completeInspectionValidation = [
  param('id').isMongoId().withMessage('Valid inspection ID is required'),
  body('recommendations').optional().isArray().withMessage('Recommendations must be an array'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('actualDuration').optional().isNumeric().withMessage('Actual duration must be a number')
];

const deleteBookingValidation = [
  param('id').isMongoId().withMessage('Valid booking ID is required')
];

// Routes
router.get('/pending-jobs', auth, getPendingJobs);
router.get('/inspections', auth, getAdvisorInspections);
router.get('/inspections/:id', auth, getInspection);
router.post('/inspections', auth, createInspectionValidation, validateRequest, createInspection);
router.put('/inspections/:id', auth, updateInspectionValidation, validateRequest, updateInspection);
router.patch('/inspections/:id/complete', auth, completeInspectionValidation, validateRequest, completeInspection);
router.delete('/booking/:id', auth, deleteBookingValidation, validateRequest, deleteBooking);

export default router;
