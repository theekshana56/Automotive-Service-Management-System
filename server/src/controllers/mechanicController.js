import Mechanic from '../models/Mechanic.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

// Register as a mechanic
const registerMechanic = async (req, res) => {
  try {
    console.log('🔧 Mechanic registration request body:', req.body);
    const { userId, licenseNumber, specialties, experience, hourlyRate, location, availability } = req.body;

    // Basic validation
    if (!userId || !licenseNumber) {
      console.log('❌ Missing userId or licenseNumber:', { userId, licenseNumber });
      return res.status(400).json({ error: 'userId and licenseNumber are required' });
    }
    if (!location || location.latitude === undefined || location.longitude === undefined) {
      console.log('❌ Missing location data:', { location });
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    // Check if user already has a mechanic profile
    const existingMechanic = await Mechanic.findOne({ userId });
    if (existingMechanic) {
      return res.status(400).json({ error: 'User already has a mechanic profile' });
    }

    // Check if license number is already taken
    const existingLicense = await Mechanic.findOne({ licenseNumber });
    if (existingLicense) {
      console.log('❌ License number already exists:', licenseNumber);
      return res.status(400).json({ error: 'License number already registered' });
    }

    const latitude = parseFloat(location.latitude);
    const longitude = parseFloat(location.longitude);
    const exp = Number(experience ?? 0);
    const rate = Number(hourlyRate ?? 0);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({ error: 'Latitude/Longitude must be valid numbers' });
    }

    // Validate specialties
    if (!specialties || !Array.isArray(specialties) || specialties.length === 0) {
      console.log('❌ Invalid specialties:', specialties);
      return res.status(400).json({ error: 'At least one specialty is required' });
    }

    const mechanic = new Mechanic({
      userId,
      licenseNumber: String(licenseNumber).trim(),
      specialties: Array.isArray(specialties) ? specialties : [],
      experience: exp,
      hourlyRate: rate,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address: location.address || {}
      },
      availability: availability || {
        monday: { start: '09:00', end: '17:00', isAvailable: true },
        tuesday: { start: '09:00', end: '17:00', isAvailable: true },
        wednesday: { start: '09:00', end: '17:00', isAvailable: true },
        thursday: { start: '09:00', end: '17:00', isAvailable: true },
        friday: { start: '09:00', end: '17:00', isAvailable: true },
        saturday: { start: '09:00', end: '15:00', isAvailable: true },
        sunday: { start: '10:00', end: '14:00', isAvailable: false }
      }
    });

    await mechanic.save();

    // Update user role, availability and geo location so nearby search finds them
    await User.findByIdAndUpdate(userId, {
      role: 'mechanic',
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Mechanic profile created successfully',
      mechanic
    });
  } catch (error) {
    console.error('Error registering mechanic:', error);
    // Handle duplicate key error from MongoDB
    if (error?.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ error: `${key} already exists` });
    }
    return res.status(500).json({ error: 'Failed to register mechanic', details: error.message });
  }
};

// Find nearby mechanics
const findNearbyMechanics = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10, serviceType, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      },
      isOnline: true
    };

    // Add service type filter if provided
    if (serviceType) {
      query.specialties = { $in: [serviceType] };
    }

    const mechanics = await Mechanic.find(query)
      .populate('userId', 'name email phone avatarUrl')
      .limit(parseInt(limit))
      .lean();

    // Calculate distance for each mechanic
    const mechanicsWithDistance = mechanics.map(mechanic => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        mechanic.location.coordinates[1],
        mechanic.location.coordinates[0]
      );

      return {
        ...mechanic,
        distance: distance.toFixed(1),
        user: mechanic.userId
      };
    });

    res.json(mechanicsWithDistance);
  } catch (error) {
    console.error('Error finding nearby mechanics:', error);
    res.status(500).json({ error: 'Failed to find nearby mechanics' });
  }
};

// Update mechanic location
const updateLocation = async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { latitude, longitude } = req.body;

    const mechanic = await Mechanic.findByIdAndUpdate(
      mechanicId,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
          lastUpdated: new Date()
        }
      },
      { new: true }
    );

    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    res.json({ message: 'Location updated successfully', mechanic });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Update mechanic availability
const updateAvailability = async (req, res) => {
  try {
    const { mechanicId } = req.params;
    const { availability, isOnline } = req.body;

    const updateData = {};
    if (availability) updateData.availability = availability;
    if (typeof isOnline === 'boolean') updateData.isOnline = isOnline;

    const mechanic = await Mechanic.findByIdAndUpdate(
      mechanicId,
      updateData,
      { new: true }
    ).populate('userId', 'name email phone avatarUrl');

    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    res.json({ message: 'Availability updated successfully', mechanic });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

// Get mechanic profile
const getMechanicProfile = async (req, res) => {
  try {
    const { mechanicId } = req.params;

    const mechanic = await Mechanic.findById(mechanicId)
      .populate('userId', 'name email phone avatarUrl')
      .lean();

    if (!mechanic) {
      return res.status(404).json({ error: 'Mechanic not found' });
    }

    // Get recent reviews
    const reviews = await Booking.find({
      mechanicId,
      status: 'completed',
      rating: { $exists: true }
    })
      .populate('userId', 'name')
      .select('rating review createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      ...mechanic,
      user: mechanic.userId,
      recentReviews: reviews
    });
  } catch (error) {
    console.error('Error fetching mechanic profile:', error);
    res.status(500).json({ error: 'Failed to fetch mechanic profile' });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export {
  registerMechanic,
  findNearbyMechanics,
  updateLocation,
  updateAvailability,
  getMechanicProfile
};

// Export individual functions for ES6 compatibility
export { registerMechanic as default };
