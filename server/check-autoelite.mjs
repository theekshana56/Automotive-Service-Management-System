// Check suppliers in AutoElite database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkAutoEliteDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to AutoElite database');
    
    // Check suppliers
    const db = mongoose.connection.db;
    const suppliersCount = await db.collection('suppliers').countDocuments();
    console.log(`📊 Total suppliers in AutoElite: ${suppliersCount}`);
    
    if (suppliersCount > 0) {
      const suppliers = await db.collection('suppliers').find({}).toArray();
      console.log('\n📋 Suppliers in AutoElite:');
      suppliers.forEach((supplier, index) => {
        console.log(`${index + 1}. ${supplier.companyName || supplier.name} (${supplier._id})`);
      });
    } else {
      console.log('❌ No suppliers found in AutoElite database');
    }
    
    // Check parts
    const partsCount = await db.collection('parts').countDocuments();
    console.log(`\n📊 Total parts in AutoElite: ${partsCount}`);
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAutoEliteDB();