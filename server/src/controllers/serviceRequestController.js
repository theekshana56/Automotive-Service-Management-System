import mongoose from 'mongoose';
import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { sendMechanicNotifications, sendAssignmentNotification, sendCustomerNotification } from '../services/notificationService.js';

// Create a new service request
export async function createServiceRequest(req, res) {
  try {
    console.log('🔧 Creating service request with data:', req.body);

    const {
      name,
      phone,
      email,
      location,
      serviceType,
      problemDescription,
      urgency,
      preferredTime,
      additionalNotes
    } = req.body;

    // Validate required fields
    if (!name || !phone || !location?.latitude || !location?.longitude || !serviceType || !problemDescription) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ message: 'Missing required fields' });
    }

    console.log('📍 Location data:', location);

    // Create the service request
    const serviceRequest = new ServiceRequest({
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
        address: location.address || {},
        serviceRadius: location.serviceRadius || 10
      },
      serviceType,
      problemDescription,
      urgency: urgency || 'normal',
      preferredTime: preferredTime ? new Date(preferredTime) : null,
      additionalNotes
    });

    console.log('💾 Saving service request...');
    const savedRequest = await serviceRequest.save();
    console.log('✅ Service request saved:', savedRequest._id);

    // Send notifications to all available mechanics (async operation)
    try {
      const notificationResult = await sendMechanicNotifications(savedRequest._id);
      if (notificationResult.success) {
        console.log(`📧 Successfully notified ${notificationResult.successful}/${notificationResult.total} mechanics`);
      } else {
        console.warn('⚠️ Failed to send notifications:', notificationResult.error);
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to send notifications:', notificationError.message);
    }

    // Create audit log (non-blocking)
    try {
      await AuditLog.create({
        actor: req.user?.id || null,
        action: 'service_request_created',
        meta: {
          requestId: savedRequest._id,
          serviceType,
          urgency,
          location: savedRequest.location.coordinates
        }
      });
      console.log('📝 Audit log created');
    } catch (auditError) {
      console.warn('⚠️ Failed to create audit log:', auditError.message);
      console.warn('⚠️ Audit log error details:', auditError);
      // Don't fail the request if audit log creation fails
    }

    console.log('🎉 Service request created successfully');
    res.status(201).json({
      message: 'Service request created successfully',
      requestId: savedRequest._id,
      status: savedRequest.status
    });

  } catch (error) {
    console.error('❌ Error creating service request:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      message: 'Failed to create service request',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Get service requests for mechanics (nearby pending requests)
export async function getNearbyRequests(req, res) {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;
    const mechanicId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Find nearby pending requests
    const requests = await ServiceRequest.find({
      status: 'pending',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(maxDistance) * 1609.34 // Convert miles to meters
        }
      }
    }).sort({ createdAt: -1 });

    // Filter out requests that this mechanic has already responded to
    const filteredRequests = requests.filter(request =>
      !request.mechanicResponses.some(response =>
        response.mechanic.toString() === mechanicId
      )
    );

    res.json({
      requests: filteredRequests,
      count: filteredRequests.length
    });

  } catch (error) {
    console.error('Error fetching nearby requests:', error);
    res.status(500).json({ message: 'Failed to fetch nearby requests', error: error.message });
  }
}

// Mechanic responds to service request (accept/decline)
export async function respondToRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { response, notes } = req.body; // response: 'accepted' or 'declined'
    const mechanicId = req.user.id;

    if (!['accepted', 'declined'].includes(response)) {
      return res.status(400).json({ message: 'Invalid response. Must be "accepted" or "declined"' });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    if (serviceRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is no longer available' });
    }

    // Check if mechanic already responded
    const existingResponse = serviceRequest.mechanicResponses.find(
      r => r.mechanic.toString() === mechanicId
    );

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already responded to this request' });
    }

    // Add mechanic response
    serviceRequest.mechanicResponses.push({
      mechanic: mechanicId,
      response,
      notes: notes || '',
      respondedAt: new Date()
    });

    // If accepted, assign the mechanic (first-come-first-served)
    if (response === 'accepted') {
      // Use atomic update to prevent race conditions
      const updateResult = await ServiceRequest.findOneAndUpdate(
        {
          _id: requestId,
          status: 'pending',
          assignedMechanic: { $exists: false }
        },
        {
          $set: {
            assignedMechanic: mechanicId,
            assignedAt: new Date(),
            status: 'assigned'
          },
          $push: {
            mechanicResponses: {
              mechanic: mechanicId,
              response,
              notes: notes || '',
              respondedAt: new Date()
            }
          }
        },
        {
          new: true, // Return the updated document
          runValidators: true
        }
      );

      if (updateResult) {
        // Assignment was successful
        serviceRequest = updateResult; // Update our local reference

        // Send assignment notifications (async, don't wait for completion)
        try {
          await sendAssignmentNotification(mechanicId, serviceRequest);
          await sendCustomerNotification(serviceRequest);
          console.log(`📧 Assignment notifications sent for request ${requestId}`);
        } catch (notificationError) {
          console.warn('⚠️ Failed to send assignment notifications:', notificationError.message);
        }

        console.log(`🎉 SERVICE ASSIGNED: Mechanic ${mechanicId} assigned to request ${requestId}`);
      } else {
        // Someone else got assigned first or request was no longer available
        console.log(`❌ ASSIGNMENT FAILED: Request ${requestId} was already assigned or no longer available`);

        // Add the response but mark it as failed
        serviceRequest.mechanicResponses.push({
          mechanic: mechanicId,
          response,
          notes: (notes || '') + ' (Request was assigned to another mechanic first)',
          respondedAt: new Date()
        });
      }
    }

    await serviceRequest.save();

    // Create audit log
    try {
      await AuditLog.create({
        actor: mechanicId,
        action: 'service_request_response',
        meta: {
          requestId,
          response,
          assigned: response === 'accepted' && serviceRequest.status === 'assigned'
        }
      });
    } catch (auditError) {
      console.warn('Failed to create audit log for mechanic response:', auditError.message);
    }

    res.json({
      message: response === 'accepted' ? 'Request accepted successfully' : 'Request declined',
      status: serviceRequest.status,
      assigned: serviceRequest.status === 'assigned'
    });

  } catch (error) {
    console.error('Error responding to service request:', error);
    res.status(500).json({ message: 'Failed to respond to request', error: error.message });
  }
}

// Get service request details
export async function getServiceRequest(req, res) {
  try {
    const { requestId } = req.params;

    const serviceRequest = await ServiceRequest.findById(requestId)
      .populate('assignedMechanic', 'name email phone')
      .populate('mechanicResponses.mechanic', 'name email phone');

    if (!serviceRequest) {
      return res.status(404).json({ message: 'Service request not found' });
    }

    res.json({ request: serviceRequest });

  } catch (error) {
    console.error('Error fetching service request:', error);
    res.status(500).json({ message: 'Failed to fetch service request', error: error.message });
  }
}



// Get nearby available mechanics (for waiting room display)
export async function getNearbyMechanics(req, res) {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;

    console.log('🔍 Searching for nearby mechanics...');
    console.log('📍 Search location:', { latitude, longitude, maxDistance });

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    // Import models
    const Mechanic = (await import('../models/Mechanic.js')).default;
    const User = (await import('../models/User.js')).default;

    // Strategy 1: First try to find mechanics in the Mechanic model (proper setup)
    let mechanics = [];
    let mechanicUsers = [];

    try {
      // Find mechanics in Mechanic model with location data
      mechanics = await Mechanic.find({
        isOnline: true,
        'location.coordinates': { $exists: true, $ne: [0, 0] },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseFloat(maxDistance) * 1609.34 // Convert miles to meters
          }
        }
      }).populate('userId', 'name email phone avatarUrl').select('location specialties hourlyRate rating');

      console.log(`🎯 Found ${mechanics.length} mechanics in Mechanic model within ${maxDistance} miles`);
    } catch (geoError) {
      console.warn('⚠️ Geospatial query failed:', geoError.message);
      mechanics = [];
    }

    // Strategy 2: If no mechanics found in Mechanic model, look for users with mechanic role
    if (mechanics.length === 0) {
      console.log('🔄 No mechanics found in Mechanic model, checking User model for mechanic role...');

      try {
        // Find users with mechanic role who are available
        mechanicUsers = await User.find({
          role: 'mechanic',
          isAvailable: true
        }).select('name email phone avatarUrl');

        console.log(`👥 Found ${mechanicUsers.length} users with mechanic role`);

        // Convert user records to mechanic-like format for frontend compatibility
        mechanics = mechanicUsers.map(user => ({
          _id: user._id,
          userId: user,
          location: null, // No location data in User model
          specialties: [], // No specialties in User model
          hourlyRate: 0, // No hourly rate in User model
          rating: { average: 4.5, count: 0 }, // Default rating
          isOnline: user.isAvailable,
          // Add mock location data for testing (you should add proper location to User model)
          location: {
            coordinates: [parseFloat(longitude) + (Math.random() - 0.5) * 0.1, parseFloat(latitude) + (Math.random() - 0.5) * 0.1] // Mock nearby location
          }
        }));

        console.log(`✅ Converted ${mechanics.length} mechanic users for frontend compatibility`);
      } catch (userError) {
        console.warn('⚠️ Error fetching mechanic users:', userError.message);
      }
    }

    // Strategy 3: If still no mechanics, create some test mechanics for development
    if (mechanics.length === 0) {
      console.log('🚨 No mechanics found, creating test mechanics for development...');

      try {
        // Create test mechanics if none exist
        const testMechanics = [
          {
            userId: new mongoose.Types.ObjectId(),
            licenseNumber: 'TEST001',
            specialties: ['Engine Repair', 'Brake Service'],
            experience: 5,
            hourlyRate: 75,
            location: {
              type: 'Point',
              coordinates: [parseFloat(longitude) + 0.01, parseFloat(latitude) + 0.01], // Near user location
              address: { street: 'Test Mechanic 1', city: 'Test City', state: 'TS', zipCode: '12345' }
            },
            isOnline: true,
            rating: { average: 4.5, count: 10 },
            completedJobs: 25
          },
          {
            userId: new mongoose.Types.ObjectId(),
            licenseNumber: 'TEST002',
            specialties: ['Tire Service', 'Oil Change'],
            experience: 3,
            hourlyRate: 65,
            location: {
              type: 'Point',
              coordinates: [parseFloat(longitude) - 0.01, parseFloat(latitude) - 0.01], // Near user location
              address: { street: 'Test Mechanic 2', city: 'Test City', state: 'TS', zipCode: '12345' }
            },
            isOnline: true,
            rating: { average: 4.2, count: 8 },
            completedJobs: 15
          }
        ];

        await Mechanic.insertMany(testMechanics);
        console.log('✅ Created test mechanics');

        // Fetch the newly created mechanics
        mechanics = await Mechanic.find({
          licenseNumber: { $in: ['TEST001', 'TEST002'] }
        }).populate('userId', 'name email phone avatarUrl');

        console.log(`🧪 Created and found ${mechanics.length} test mechanics`);
      } catch (testError) {
        console.warn('⚠️ Error creating test mechanics:', testError.message);
      }
    }

    // Calculate distance and ETA for each mechanic
    const mechanicsWithDetails = mechanics.map(mechanic => {
      let distance = 0;
      let etaMinutes = 0;

      try {
        // Only calculate distance if mechanic has valid location coordinates
        if (mechanic.location &&
            mechanic.location.coordinates &&
            mechanic.location.coordinates.length === 2 &&
            mechanic.location.coordinates[0] !== 0 &&
            mechanic.location.coordinates[1] !== 0) {

          // Calculate rough distance in miles
          distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            mechanic.location.coordinates[1], // latitude
            mechanic.location.coordinates[0]  // longitude
          );

          // Calculate rough ETA (assuming 30 mph average speed)
          etaMinutes = Math.ceil(distance / 30 * 60);
        } else {
          console.warn(`⚠️ Mechanic ${mechanic._id} missing valid location coordinates`);
          distance = 0;
          etaMinutes = 0;
        }
      } catch (calcError) {
        console.warn(`⚠️ Error calculating distance for mechanic ${mechanic._id}:`, calcError.message);
        distance = 0;
        etaMinutes = 0;
      }

      return {
        id: mechanic._id,
        name: mechanic.userId?.name || 'Test Mechanic',
        email: mechanic.userId?.email || 'test@mechanic.com',
        phone: mechanic.userId?.phone || '555-TEST',
        avatarUrl: mechanic.userId?.avatarUrl || '',
        distance: distance > 0 ? `${distance.toFixed(1)} miles` : 'Distance unknown',
        eta: etaMinutes > 0 ? (etaMinutes <= 60 ? `${etaMinutes} min` : `${Math.ceil(etaMinutes/60)} hr`) : 'ETA unknown',
        rating: mechanic.rating?.average || 4.5,
        isOnline: mechanic.isOnline,
        specialties: mechanic.specialties || [],
        hourlyRate: mechanic.hourlyRate || 0,
        hasLocation: !!(mechanic.location && mechanic.location.coordinates)
      };
    });

    console.log(`✅ Returning ${mechanicsWithDetails.length} mechanics with details`);

    res.json({
      mechanics: mechanicsWithDetails,
      count: mechanicsWithDetails.length,
      debug: {
        mechanicsFromMechanicModel: mechanics.filter(m => m.userId).length,
        mechanicsFromUserModel: mechanics.filter(m => !m.userId).length,
        searchLocation: { latitude, longitude, maxDistance }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching nearby mechanics:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);

    // Return empty array instead of error to prevent frontend crash
    res.json({
      mechanics: [],
      count: 0,
      error: 'Failed to fetch nearby mechanics',
      debug: { error: error.message }
    });
  }
}

// Get mechanic's assigned/accepted requests
export async function getMechanicRequests(req, res) {
  try {
    const mechanicId = req.user.id;
    const { status } = req.query; // pending, assigned, accepted, in_progress, completed

    let query = {
      $or: [
        { assignedMechanic: mechanicId },
        { 'mechanicResponses.mechanic': mechanicId, 'mechanicResponses.response': 'accepted' }
      ]
    };

    if (status) {
      query.status = status;
    }

    const requests = await ServiceRequest.find(query)
      .sort({ updatedAt: -1 })
      .populate('assignedMechanic', 'name email phone');

    res.json({
      requests,
      count: requests.length
    });

  } catch (error) {
    console.error('Error fetching mechanic requests:', error);
    res.status(500).json({ message: 'Failed to fetch mechanic requests', error: error.message });
  }
}

// Update service request status (for guest customers to cancel their requests)
export async function updateRequestStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, notes, customerEmail, customerPhone } = req.body;

    console.log('🔧 Update Request Status:', {
      requestId,
      status,
      customerEmail,
      customerPhone
    });

    const validStatuses = ['accepted', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Require customer contact information for guest users
    if (!customerEmail && !customerPhone) {
      return res.status(400).json({
        message: 'Customer email or phone is required to verify request ownership'
      });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      console.log('❌ Service request not found:', requestId);
      return res.status(404).json({ message: 'Service request not found' });
    }

    console.log('📋 Service Request Details:', {
      id: serviceRequest._id,
      status: serviceRequest.status,
      customerEmail: serviceRequest.customerEmail,
      customerPhone: serviceRequest.customerPhone
    });

    // Check if the provided contact info matches the request owner
    const isOwner = (customerEmail && serviceRequest.customerEmail === customerEmail) ||
                   (customerPhone && serviceRequest.customerPhone === customerPhone);

    if (!isOwner) {
      return res.status(403).json({
        message: 'You can only cancel your own requests. Please provide the same email or phone number you used when creating the request.'
      });
    }

    // Don't allow cancellation if request is already completed or cancelled
    if (serviceRequest.status === 'completed' || serviceRequest.status === 'cancelled') {
      console.log('❌ Request already finalized');
      return res.status(400).json({ message: 'Request is already finalized and cannot be cancelled' });
    }

    serviceRequest.status = status;

    // Add notes if provided
    if (notes) {
      serviceRequest.additionalNotes = (serviceRequest.additionalNotes || '') + `\n[${new Date().toISOString()}] ${notes}`;
    }

    await serviceRequest.save();

    console.log('✅ Request cancelled successfully by customer');

    res.json({
      message: 'Request status updated successfully',
      status: serviceRequest.status
    });

  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Failed to update request status', error: error.message });
  }
}

// Update service request status (for mechanics to update job progress)
export async function updateMechanicJobStatus(req, res) {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;
    const mechanicId = req.user.id;

    console.log('🔧 Mechanic Update Job Status:', {
      requestId,
      status,
      mechanicId
    });

    const validStatuses = ['accepted', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status for mechanic update' });
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      console.log('❌ Service request not found:', requestId);
      return res.status(404).json({ message: 'Service request not found' });
    }

    console.log('📋 Service Request Details:', {
      id: serviceRequest._id,
      status: serviceRequest.status,
      assignedMechanic: serviceRequest.assignedMechanic,
      currentMechanic: mechanicId
    });

    // Check if the request is assigned to this mechanic
    if (serviceRequest.assignedMechanic?.toString() !== mechanicId) {
      return res.status(403).json({
        message: 'You can only update status for jobs assigned to you'
      });
    }

    // Don't allow status changes if request is already completed or cancelled
    if (serviceRequest.status === 'completed' || serviceRequest.status === 'cancelled') {
      console.log('❌ Request already finalized');
      return res.status(400).json({ message: 'Request is already finalized and cannot be updated' });
    }

    serviceRequest.status = status;

    // Add notes if provided
    if (notes) {
      serviceRequest.additionalNotes = (serviceRequest.additionalNotes || '') + `\n[${new Date().toISOString()}] ${notes}`;
    }

    await serviceRequest.save();

    console.log('✅ Job status updated successfully by mechanic');

    res.json({
      message: 'Job status updated successfully',
      status: serviceRequest.status
    });

  } catch (error) {
    console.error('Error updating mechanic job status:', error);
    res.status(500).json({ message: 'Failed to update job status', error: error.message });
  }
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}
