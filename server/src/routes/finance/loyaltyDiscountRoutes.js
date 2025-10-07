import express from 'express';
import auth from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import {
  createLoyaltyDiscountRequest,
  getLoyaltyDiscountRequests,
  getLoyaltyDiscountRequest,
  reviewLoyaltyDiscountRequest,
  getCustomerLoyaltyRequests,
  getLoyaltyDiscountSummary
} from '../../controllers/finance/loyaltyDiscountController.js';
import LoyaltyDiscountRequest from '../../models/finance/LoyaltyDiscountRequest.js';

const router = express.Router();

// Create loyalty discount request (any authenticated user)
router.post('/', auth, createLoyaltyDiscountRequest);

// Get customer's loyalty discount requests
router.get('/customer/:customerId', auth, getCustomerLoyaltyRequests);

// Get single loyalty discount request
router.get('/:id', auth, getLoyaltyDiscountRequest);

// All other routes require finance manager role
router.use(allowRoles('finance_manager', 'admin'));

// Get all loyalty discount requests
router.get('/', getLoyaltyDiscountRequests);

// Review loyalty discount request (approve/decline)
router.put('/:id/review', reviewLoyaltyDiscountRequest);

// Get loyalty discount summary
router.get('/summary', getLoyaltyDiscountSummary);

// Health check endpoint for loyalty discount functionality
router.get('/health', async (req, res) => {
  try {
    console.log('🏥 Loyalty discount health check...');
    
    // Check if model is available
    if (!LoyaltyDiscountRequest) {
      return res.status(500).json({
        success: false,
        message: 'LoyaltyDiscountRequest model not available',
        timestamp: new Date().toISOString()
      });
    }

    // Check database connection
    const dbState = LoyaltyDiscountRequest.db.readyState;
    console.log('📊 Database state:', dbState);
    
    // Check collection existence
    let collectionExists = false;
    try {
      collectionExists = await LoyaltyDiscountRequest.collection.exists();
    } catch (error) {
      console.error('❌ Error checking collection:', error);
    }

    // Get basic count
    let documentCount = 0;
    try {
      documentCount = await LoyaltyDiscountRequest.countDocuments();
    } catch (error) {
      console.error('❌ Error counting documents:', error);
    }

    res.status(200).json({
      success: true,
      message: 'Loyalty discount service is healthy',
      data: {
        modelAvailable: !!LoyaltyDiscountRequest,
        databaseState: dbState,
        collectionExists,
        documentCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;