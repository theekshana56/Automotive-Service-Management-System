import express from 'express';
import customerController from '../controllers/customerController';

const router = express.Router();

const { protect } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All routes require authentication
router.use(protect);

// Get all customers with filters and pagination
router.get('/', customerController.getCustomers);

// Create new customer
router.post('/', validate(schemas.customer), customerController.createCustomer);

// Get customer by ID
router.get('/:id', customerController.getCustomer);

// Update customer
router.put('/:id', validate(schemas.customer), customerController.updateCustomer);

// Delete customer
router.delete('/:id', customerController.deleteCustomer);

// Get customer balance details
router.get('/:id/balance', customerController.getCustomerBalance);

// Get customer transactions
router.get('/:id/transactions', customerController.getCustomerTransactions);

export default router;