import mongoose from 'mongoose';
import ServiceCost from '../models/finance/ServiceCost.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';

const createTestServiceCosts = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/AutoElite');
    console.log('Connected to MongoDB');

    // Create test users if they don't exist
    let customer = await User.findOne({ email: 'customer@test.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'password123',
        role: 'user'
      });
      console.log('Created test customer');
    }

    let advisor = await User.findOne({ email: 'advisor@test.com' });
    if (!advisor) {
      advisor = await User.create({
        name: 'Test Advisor',
        email: 'advisor@test.com',
        password: 'password123',
        role: 'advisor'
      });
      console.log('Created test advisor');
    }

    // Create test booking if it doesn't exist
    let booking = await Booking.findOne({ user: customer._id });
    if (!booking) {
      booking = await Booking.create({
        user: customer._id,
        serviceType: 'Oil Change',
        vehicle: { model: 'Honda Civic', year: 2020, plate: 'ABC-123' },
        date: new Date().toISOString().split('T')[0],
        timeSlot: '09:00-10:00',
        status: 'Confirmed',
        slotId: 'slot-' + Date.now(),
        estimatedCost: 150
      });
      console.log('Created test booking');
    }

    // Create test service costs
    const testServiceCosts = [
      {
        bookingId: booking._id,
        advisorId: advisor._id,
        customerId: customer._id,
        vehiclePlate: 'ABC-123',
        serviceType: 'Oil Change',
        advisorEstimate: {
          laborHours: 2,
          laborRate: 50,
          partsRequired: [
            {
              partName: 'Engine Oil',
              partNumber: 'OIL-001',
              quantity: 1,
              unitCost: 25.00,
              totalCost: 25.00
            },
            {
              partName: 'Oil Filter',
              partNumber: 'FIL-001',
              quantity: 1,
              unitCost: 15.00,
              totalCost: 15.00
            }
          ],
          additionalServices: [],
          notes: 'Regular oil change service',
          estimatedTotal: 140.00
        },
        finalCost: {
          laborCost: 100.00,
          partsCost: 40.00,
          additionalServicesCost: 0,
          subtotal: 140.00,
          taxRate: 12,
          taxAmount: 16.80,
          discountAmount: 0,
          totalAmount: 156.80
        },
        status: 'pending_review',
        paymentReceived: false
      },
      {
        bookingId: booking._id,
        advisorId: advisor._id,
        customerId: customer._id,
        vehiclePlate: 'XYZ-789',
        serviceType: 'Brake Service',
        advisorEstimate: {
          laborHours: 3,
          laborRate: 50,
          partsRequired: [
            {
              partName: 'Brake Pads',
              partNumber: 'BP-001',
              quantity: 2,
              unitCost: 45.00,
              totalCost: 90.00
            },
            {
              partName: 'Brake Fluid',
              partNumber: 'BF-001',
              quantity: 1,
              unitCost: 20.00,
              totalCost: 20.00
            }
          ],
          additionalServices: [],
          notes: 'Front brake pad replacement',
          estimatedTotal: 260.00
        },
        finalCost: {
          laborCost: 150.00,
          partsCost: 110.00,
          additionalServicesCost: 0,
          subtotal: 260.00,
          taxRate: 12,
          taxAmount: 31.20,
          discountAmount: 0,
          totalAmount: 291.20
        },
        status: 'approved',
        paymentReceived: false
      },
      {
        bookingId: booking._id,
        advisorId: advisor._id,
        customerId: customer._id,
        vehiclePlate: 'DEF-456',
        serviceType: 'Tire Rotation',
        advisorEstimate: {
          laborHours: 1,
          laborRate: 50,
          partsRequired: [],
          additionalServices: [
            {
              serviceName: 'Tire Rotation',
              description: 'Rotate all four tires',
              cost: 30.00
            }
          ],
          notes: 'Standard tire rotation service',
          estimatedTotal: 80.00
        },
        finalCost: {
          laborCost: 50.00,
          partsCost: 0,
          additionalServicesCost: 30.00,
          subtotal: 80.00,
          taxRate: 12,
          taxAmount: 9.60,
          discountAmount: 0,
          totalAmount: 89.60
        },
        status: 'invoiced',
        paymentReceived: false
      }
    ];

    // Clear existing test data
    await ServiceCost.deleteMany({ customerId: customer._id });
    console.log('Cleared existing test service costs');

    // Create new test service costs
    for (const serviceCostData of testServiceCosts) {
      const serviceCost = await ServiceCost.create(serviceCostData);
      console.log(`Created service cost: ${serviceCost.serviceType} - ${serviceCost.vehiclePlate} - $${serviceCost.finalCost.totalAmount}`);
    }

    console.log('\n✅ Test service costs created successfully!');
    console.log('You can now test the Customer Payment Management page.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test service costs:', error);
    process.exit(1);
  }
};

createTestServiceCosts();
