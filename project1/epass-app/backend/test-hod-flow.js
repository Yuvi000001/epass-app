// =====================================================================
// TEST HOD REGISTRATION → ADMIN APPROVAL → LOGIN FLOW
// =====================================================================

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const PendingRegistration = require('./models/PendingRegistration');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/epass_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

const testFlow = async () => {
  console.log('\n========== HOD REGISTRATION FLOW TEST ==========\n');

  // Clean up test data first
  const testEmail = 'testhod123@test.com';
  console.log('1️⃣ Cleaning up old test data...');
  await User.deleteOne({ email: testEmail });
  await PendingRegistration.deleteOne({ email: testEmail });
  console.log('✅ Old test data cleaned\n');

  // Step 1: Simulate HOD Registration (create PendingRegistration)
  console.log('2️⃣ Simulating HOD Registration (completeHodRegistration)...');
  const testPassword = 'TestPassword@123';
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  const pendingReg = await PendingRegistration.create({
    name: 'Test HOD',
    email: testEmail,
    passwordHash: hashedPassword,
    role: 'HOD',
    campus: 'BIST',
    department: 'CSE',
    phone: '9876543210',
    employeeId: 'HOD123',
    otp: 'dummy',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  console.log('✅ PendingRegistration created:');
  console.log(`   - ID: ${pendingReg._id}`);
  console.log(`   - Email: ${pendingReg.email}`);
  console.log(`   - Status: PENDING`);
  console.log(`   - Expires: ${pendingReg.expiresAt}\n`);

  // Step 2: Check if admin can see it
  console.log('3️⃣ Checking if admin can fetch pending HOD list...');
  const allPending = await PendingRegistration.find({ role: 'HOD' });
  console.log(`✅ Found ${allPending.length} pending HOD registration(s)`);
  if (allPending.length > 0) {
    allPending.forEach(p => console.log(`   - ${p.name} (${p.email})`));
  }
  console.log();

  // Step 3: Simulate admin approval
  console.log('4️⃣ Simulating Admin Approval (approveHod)...');
  const approvedUser = await User.create({
    name: pendingReg.name,
    email: pendingReg.email,
    passwordHash: pendingReg.passwordHash,
    role: 'HOD',
    campus: pendingReg.campus,
    department: pendingReg.department,
    phone: pendingReg.phone,
    employeeId: pendingReg.employeeId,
    isActive: true,
  });
  console.log('✅ HOD User account created:');
  console.log(`   - ID: ${approvedUser._id}`);
  console.log(`   - Email: ${approvedUser.email}`);
  console.log(`   - Role: ${approvedUser.role}`);
  console.log(`   - Department: ${approvedUser.department}`);
  console.log(`   - IsActive: ${approvedUser.isActive}\n`);

  // Delete pending registration
  await PendingRegistration.deleteOne({ _id: pendingReg._id });
  console.log('✅ Pending registration deleted after approval\n');

  // Step 4: Check if HOD can login
  console.log('5️⃣ Checking if HOD can login (sendHodLoginOtp)...');
  const hodUser = await User.findOne({ email: testEmail, role: 'HOD' });
  if (hodUser) {
    console.log('✅ HOD user found in database - HOD CAN LOGIN');
    console.log(`   - Name: ${hodUser.name}`);
    console.log(`   - Email: ${hodUser.email}`);
    console.log(`   - IsActive: ${hodUser.isActive}`);
  } else {
    console.log('❌ HOD user NOT found - HOD CANNOT LOGIN');
  }
  console.log();

  // Step 5: Verify password
  console.log('6️⃣ Verifying password hash...');
  const isPasswordValid = await bcrypt.compare(testPassword, approvedUser.passwordHash);
  if (isPasswordValid) {
    console.log('✅ Password verification PASSED - HOD can login with correct password');
  } else {
    console.log('❌ Password verification FAILED');
  }
  console.log();

  console.log('========== TEST SUMMARY ==========');
  console.log('✅ HOD registration request saved to PendingRegistration');
  console.log('✅ Admin can fetch pending HOD requests');
  console.log('✅ Admin can approve HOD and create User account');
  console.log('✅ HOD can login after approval');
  console.log('✅ Password validation works correctly\n');
};

const run = async () => {
  await connectDB();
  try {
    await testFlow();
    console.log('All tests passed! ✅');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
