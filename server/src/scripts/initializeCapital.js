import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Capital from '../models/finance/Capital.js';

dotenv.config();

const initializeCapital = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get or create capital record
    const capital = await Capital.getOrCreate();
    
    // Check if already initialized
    if (capital.initialAmount > 0) {
      console.log('Capital already initialized:', {
        initialAmount: capital.initialAmount,
        currentAmount: capital.currentAmount,
        totalSpent: capital.totalSpent
      });
      return;
    }

    // Initialize with $500,000
    // Use a dummy ObjectId for system initialization
    const systemUserId = new mongoose.Types.ObjectId();
    await capital.initializeCapital(500000, systemUserId);
    
    console.log('Capital initialized successfully:', {
      initialAmount: capital.initialAmount,
      currentAmount: capital.currentAmount,
      totalSpent: capital.totalSpent
    });

  } catch (error) {
    console.error('Error initializing capital:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
initializeCapital();
