import mongoose from 'mongoose';

const mechanicSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  specialties: [{
    type: String,
    enum: ['Engine Repair', 'Brake Service', 'Oil Change', 'Tire Service', 'AC Repair', 'Transmission', 'Electrical', 'Diagnostics', 'Suspension', 'Exhaust', 'Cooling System', 'Fuel System']
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  availability: {
    monday: { start: String, end: String, isAvailable: Boolean },
    tuesday: { start: String, end: String, isAvailable: Boolean },
    wednesday: { start: String, end: String, isAvailable: Boolean },
    thursday: { start: String, end: String, isAvailable: Boolean },
    friday: { start: String, end: String, isAvailable: Boolean },
    saturday: { start: String, end: String, isAvailable: Boolean },
    sunday: { start: String, end: String, isAvailable: Boolean }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    },
    lastUpdated: Date
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  responseTime: {
    type: Number, // in minutes
    default: 15
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  documents: [{
    type: {
      type: String,
      enum: ['license', 'insurance', 'certification', 'id']
    },
    url: String,
    verified: Boolean,
    uploadedAt: Date
  }],
  bankDetails: {
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String
  }
}, {
  timestamps: true
});

// Create 2dsphere index for location-based queries
mechanicSchema.index({ location: '2dsphere' });
mechanicSchema.index({ currentLocation: '2dsphere' });

// Virtual for distance calculation
mechanicSchema.virtual('distance').get(function() {
  // This will be calculated dynamically in queries
  return null;
});

// Create the model first
const Mechanic = mongoose.model('Mechanic', mechanicSchema);

// Create some test mechanics if none exist
Mechanic.createTestMechanics = async function() {
  try {
    const existingCount = await this.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing mechanics, skipping test data creation`);
      return;
    }

    console.log('Creating test mechanics...');

    const testMechanics = [
      {
        userId: new mongoose.Types.ObjectId(),
        licenseNumber: 'LIC001',
        specialties: ['Engine Repair', 'Brake Service', 'Oil Change'],
        experience: 5,
        hourlyRate: 75,
        location: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128], // New York coordinates [lng, lat]
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001'
          }
        },
        isOnline: true,
        rating: { average: 4.5, count: 10 },
        completedJobs: 25
      },
      {
        userId: new mongoose.Types.ObjectId(),
        licenseNumber: 'LIC002',
        specialties: ['Tire Service', 'AC Repair', 'Diagnostics'],
        experience: 8,
        hourlyRate: 85,
        location: {
          type: 'Point',
          coordinates: [-87.6298, 41.8781], // Chicago coordinates [lng, lat]
          address: {
            street: '456 Oak Ave',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601'
          }
        },
        isOnline: true,
        rating: { average: 4.8, count: 15 },
        completedJobs: 40
      },
      {
        userId: new mongoose.Types.ObjectId(),
        licenseNumber: 'LIC003',
        specialties: ['Transmission', 'Electrical', 'Suspension'],
        experience: 12,
        hourlyRate: 95,
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522], // Los Angeles coordinates [lng, lat]
          address: {
            street: '789 Pine St',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210'
          }
        },
        isOnline: true,
        rating: { average: 4.7, count: 20 },
        completedJobs: 60
      }
    ];

    await this.insertMany(testMechanics);
    console.log(`Created ${testMechanics.length} test mechanics`);

    return testMechanics.length;
  } catch (error) {
    console.error('Error creating test mechanics:', error);
    throw error;
  }
};

export default Mechanic;
