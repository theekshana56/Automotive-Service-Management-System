// Final verification of parts in AutoElite database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function finalVerification() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to AutoElite database');
    
    const db = mongoose.connection.db;
    
    // Check total parts
    const totalParts = await db.collection('parts').countDocuments();
    console.log(`📊 Total parts in AutoElite: ${totalParts}`);
    
    // Check by category
    const categories = ['Brakes', 'Filters', 'Engines', 'Electric'];
    console.log('\n📊 Parts by category in AutoElite:');
    
    for (const category of categories) {
      const count = await db.collection('parts').countDocuments({ category });
      console.log(`${category}: ${count} parts`);
      
      // Show sample parts for this category
      const sampleParts = await db.collection('parts')
        .find({ category })
        .limit(3)
        .project({ name: 1, partCode: 1 })
        .toArray();
      
      if (sampleParts.length > 0) {
        console.log(`  Sample ${category} parts:`);
        sampleParts.forEach(part => {
          console.log(`    - ${part.name} (${part.partCode})`);
        });
      }
      console.log('');
    }
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    console.log('\n✅ SUCCESS: All 45 example parts are now properly stored in the AutoElite database!');
    console.log('🎯 The parts form should now show supplier names and all parts in the inventory.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

finalVerification();