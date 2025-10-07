import express from 'express';
import vehicleController from '../controllers/vehicleController';

const router = express.Router();

const { protect } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All routes require authentication
router.use(protect);

// Get all vehicles with filters and pagination
router.get('/', vehicleController.getVehicles);

// Create new vehicle
router.post('/', validate(schemas.vehicle), vehicleController.createVehicle);

// Get vehicle by ID
router.get('/:id', vehicleController.getVehicle);

// Update vehicle
router.put('/:id', validate(schemas.vehicle), vehicleController.updateVehicle);

// Delete vehicle
router.delete('/:id', vehicleController.deleteVehicle);

export default router;
