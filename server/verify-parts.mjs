// Verify parts were added correctly
import mongoose from 'mongoose';
import Part from './src/models/inventory/Part.js';
import Supplier from './src/models/inventory/Supplier.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/automotive-service-db';

async function verifyParts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Get count by category
    const categories = ['Brakes', 'Filters', 'Engines', 'Electric'];
    
    console.log('\n📊 Parts Verification Report:');
    console.log('================================');
    
    let totalParts = 0;
    
    for (const category of categories) {
      const count = await Part.countDocuments({ category, isActive: true });
      totalParts += count;
      console.log(`${category}: ${count} parts`);
    }
    
    console.log(`\nTotal active parts: ${totalParts}`);
    
    // Show some sample parts with supplier info
    console.log('\n📋 Sample Parts with Suppliers:');
    console.log('=================================');
    
    const sampleParts = await Part.find({ isActive: true })
      .limit(3)
      .lean();
    
    sampleParts.forEach((part, index) => {
      console.log(`\n${index + 1}. ${part.name} (${part.partCode})`);
      console.log(`   Category: ${part.category}`);
      console.log(`   Price: $${part.sellingPrice}`);
      console.log(`   Stock: ${part.stock?.onHand || 0} units`);
      console.log(`   Supplier IDs: ${part.suppliers ? part.suppliers.join(', ') : 'None'}`);
    });
    
    // Also check if suppliers exist in the database
    console.log('\n📋 Available Suppliers:');
    console.log('========================');
    const suppliers = await Supplier.find({}, 'companyName _id').lean();
    suppliers.forEach((supplier, index) => {
      console.log(`${index + 1}. ${supplier.companyName} (${supplier._id})`);
    });
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyParts();