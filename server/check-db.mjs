// Simple database check script
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/automotive-service-db';

async function checkDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔗 Connected to MongoDB');
    
    // Check parts collection directly
    const db = mongoose.connection.db;
    const partsCount = await db.collection('parts').countDocuments();
    console.log(`📊 Total parts in database: ${partsCount}`);
    
    if (partsCount > 0) {
      // Get a few sample parts
      const sampleParts = await db.collection('parts').find({}).limit(5).toArray();
      console.log('\n📋 Sample parts:');
      sampleParts.forEach((part, index) => {
        console.log(`${index + 1}. ${part.name} (${part.partCode}) - Category: ${part.category}`);
      });
      
      // Check by category
      const categories = ['Brakes', 'Filters', 'Engines', 'Electric'];
      console.log('\n📊 Parts by category:');
      for (const category of categories) {
        const count = await db.collection('parts').countDocuments({ category });
        console.log(`${category}: ${count} parts`);
      }
    } else {
      console.log('❌ No parts found in database');
    }
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();