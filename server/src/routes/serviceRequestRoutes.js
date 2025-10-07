import { Router } from 'express';
import authRequired from '../middleware/auth.js';
import {
  createServiceRequest,
  getNearbyRequests,
  respondToRequest,
  getServiceRequest,
  getNearbyMechanics,
  getMechanicRequests,
  updateRequestStatus,
  updateMechanicJobStatus
} from '../controllers/serviceRequestController.js';
import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';

const router = Router();

// Public routes (no authentication required)
router.post('/', createServiceRequest); // Create service request
router.get('/mechanics/nearby', getNearbyMechanics); // Get nearby mechanics (public for waiting room)



// Protected routes (authentication required)
router.get('/nearby', authRequired, getNearbyRequests); // Get nearby requests for mechanics
router.post('/:requestId/respond', authRequired, respondToRequest); // Mechanic responds to request
router.get('/mechanic/requests', authRequired, getMechanicRequests); // Get mechanic's requests
router.patch('/:requestId/mechanic-status', authRequired, updateMechanicJobStatus); // Mechanic updates job status

// Public routes that need to be after specific routes (no authentication required)
router.get('/:requestId', getServiceRequest); // Get service request details (public for waiting room)

// Public routes for status updates (no authentication required for customers)
router.patch('/:requestId/status', updateRequestStatus); // Update request status (customer can cancel their own request)

// Diagnostic endpoint (temporary for debugging)
router.get('/debug/status', async (req, res) => {
  try {
    const mechanics = await User.find({ role: 'mechanic' }).select('name email isAvailable location');
    const serviceRequests = await ServiceRequest.find({}).select('status customerName serviceType location createdAt').sort({ createdAt: -1 }).limit(5);

    res.json({
      mechanics: {
        total: mechanics.length,
        available: mechanics.filter(m => m.isAvailable).length,
        details: mechanics.map(m => ({
          name: m.name,
          email: m.email,
          available: m.isAvailable,
          hasLocation: !!m.location,
          coordinates: m.location?.coordinates || null
        }))
      },
      serviceRequests: {
        total: serviceRequests.length,
        details: serviceRequests.map(sr => ({
          id: sr._id,
          customer: sr.customerName,
          service: sr.serviceType,
          status: sr.status,
          created: sr.createdAt,
          coordinates: sr.location?.coordinates || null
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create test mechanics (temporary for development)
router.post('/debug/create-test-mechanics', async (req, res) => {
  try {
    const testMechanics = [
      {
        name: 'John Smith',
        email: 'john.mechanic@test.com',
        password: 'password123',
        role: 'mechanic',
        phone: '555-0101',
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128], // New York coordinates [lng, lat]
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          }
        }
      },
      {
        name: 'Mike Johnson',
        email: 'mike.mechanic@test.com',
        password: 'password123',
        role: 'mechanic',
        phone: '555-0102',
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-87.6298, 41.8781], // Chicago coordinates [lng, lat]
          address: {
            street: '456 Oak Ave',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601'
          }
        }
      },
      {
        name: 'Sarah Davis',
        email: 'sarah.mechanic@test.com',
        password: 'password123',
        role: 'mechanic',
        phone: '555-0103',
        isAvailable: true,
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522], // Los Angeles coordinates [lng, lat]
          address: {
            street: '789 Pine St',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210'
          }
        }
      }
    ];

    const createdMechanics = [];
    for (const mechanicData of testMechanics) {
      try {
        const existingMechanic = await User.findOne({ email: mechanicData.email });
        if (!existingMechanic) {
          const mechanic = new User(mechanicData);
          await mechanic.save();
          createdMechanics.push({
            name: mechanic.name,
            email: mechanic.email,
            location: mechanic.location.coordinates
          });
        } else {
          console.log(`Mechanic ${mechanicData.email} already exists`);
        }
      } catch (error) {
        console.error(`Error creating mechanic ${mechanicData.email}:`, error.message);
      }
    }

    res.json({
      message: `Created ${createdMechanics.length} test mechanics`,
      mechanics: createdMechanics
    });

  } catch (error) {
    console.error('Error creating test mechanics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
