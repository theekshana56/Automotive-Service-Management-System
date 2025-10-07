import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://127.0.0.1:27017/autoelite';

const run = async () => {
  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME });
    console.log('Connected to MongoDB');

    const users = mongoose.connection.collection('users');
    const salaries = mongoose.connection.collection('staffsalaries');

    const userResult = await users.updateMany({ role: 'staff_manager' }, { $set: { role: 'staff_member' } });
    console.log(`Updated users: ${userResult.modifiedCount}`);

    const salaryResult = await salaries.updateMany({ staffRole: 'staff_manager' }, { $set: { staffRole: 'staff_member' } });
    console.log(`Updated salaries: ${salaryResult.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

run();


