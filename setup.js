const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Staff Management System...');

// Check if MongoDB is running
const checkMongoDB = () => {
  try {
    // Try to connect to MongoDB
    const mongoose = require('mongoose');
    return mongoose.connect("mongodb://127.0.0.1:27017/staff_management")
      .then(() => {
        console.log('✅ MongoDB is running');
        mongoose.connection.close();
        return true;
      })
      .catch(() => {
        console.log('❌ MongoDB is not running. Please start MongoDB first.');
        console.log('💡 You can download MongoDB from: https://www.mongodb.com/try/download/community');
        return false;
      });
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Install dependencies
const installDependencies = () => {
  console.log('📦 Installing root dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Root dependencies installed');
  } catch (error) {
    console.log('❌ Failed to install root dependencies');
    return false;
  }

  console.log('📦 Installing React app dependencies...');
  try {
    execSync('npm install', { cwd: './first-project', stdio: 'inherit' });
    console.log('✅ React app dependencies installed');
  } catch (error) {
    console.log('❌ Failed to install React app dependencies');
    return false;
  }

  return true;
};

// Build React app
const buildReactApp = () => {
  console.log('🔨 Building React app...');
  try {
    execSync('npm run build', { cwd: './first-project', stdio: 'inherit' });
    console.log('✅ React app built successfully');
    return true;
  } catch (error) {
    console.log('❌ Failed to build React app');
    return false;
  }
};

// Run setup
const runSetup = async () => {
  console.log('🔍 Checking prerequisites...');
  
  const mongoRunning = await checkMongoDB();
  if (!mongoRunning) {
    console.log('\n❌ Setup failed. Please start MongoDB and try again.');
    process.exit(1);
  }

  const depsInstalled = installDependencies();
  if (!depsInstalled) {
    console.log('\n❌ Setup failed. Please check the error messages above.');
    process.exit(1);
  }

  const appBuilt = buildReactApp();
  if (!appBuilt) {
    console.log('\n❌ Setup failed. Please check the error messages above.');
    process.exit(1);
  }

  console.log('\n✅ Setup completed successfully!');
  console.log('\n📋 How to run the application:');
  console.log('1. For production: npm start');
  console.log('2. For development: cd first-project && npm run dev');
  console.log('3. Open http://localhost:3001 (production) or http://localhost:3000 (development)');
  console.log('\n🔑 Demo credentials: alex@asms.demo / demo123');
};

runSetup();
