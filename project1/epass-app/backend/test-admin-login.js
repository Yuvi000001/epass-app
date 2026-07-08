require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

async function testAdminLogin() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    const email = 'Bgi.e.gate.pass@gmail.com';
    const password = 'Admin@123';
    const campus = 'BIST';
    
    console.log('\n=== Checking/Creating Admin User ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Campus:', campus);
    
    // Check if admin exists
    let admin = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (admin) {
      console.log('\n✓ Admin found in database');
      console.log('  Name:', admin.name);
      console.log('  Role:', admin.role);
      console.log('  Campus:', admin.campus);
      console.log('  IsActive:', admin.isActive);
      console.log('  IsEmailVerified:', admin.isEmailVerified);
      
      // Update password
      console.log('\nUpdating password...');
      admin.password = password;
      admin.isActive = true;
      admin.isEmailVerified = true;
      await admin.save();
      console.log('✓ Password updated and activated');
    } else {
      console.log('\n✗ Admin not found. Creating new admin user...');
      admin = await User.create({
        name: 'Super Admin',
        email: email.toLowerCase().trim(),
        password: password,
        role: 'ADMIN',
        campus: campus,
        isActive: true,
        isEmailVerified: true
      });
      console.log('✓ Admin user created successfully');
      console.log('  ID:', admin._id);
    }
    
    // Test login
    console.log('\n=== Testing Password Match ===');
    const isMatch = await admin.comparePassword(password);
    console.log('Password matches:', isMatch ? '✓ YES' : '✗ NO');
    
    if (!isMatch) {
      console.log('\n⚠️  Password does not match. Resetting...');
      admin.password = password;
      await admin.save();
      const isMatchAfter = await admin.comparePassword(password);
      console.log('After reset:', isMatchAfter ? '✓ YES' : '✗ NO');
    }
    
    console.log('\n=== Admin Ready for Login ===');
    console.log('✓ Login should now work with:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('  Role: ADMIN');
    console.log('  Campus:', campus);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

testAdminLogin();
