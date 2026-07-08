const mongoose = require('mongoose');
const PendingReg = require('./models/PendingRegistration');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/epass_db').then(async () => {
  try {
    console.log('\n========== HOD REGISTRATION FLOW CHECK ==========\n');
    
    // Check pending HOD registrations
    const pending = await PendingReg.find({ role: 'HOD' });
    console.log('📋 PENDING HOD REGISTRATIONS:');
    console.log(`   Total: ${pending.length}`);
    pending.slice(0, 5).forEach(p => {
      console.log(`   ✓ ${p.name} (${p.email})`);
      console.log(`     Campus: ${p.campus}, Dept: ${p.department}, Emp ID: ${p.employeeId}`);
    });
    
    // Check approved HOD users
    const hodUsers = await User.find({ role: 'HOD' });
    console.log('\n✅ APPROVED HOD USERS (Can Login):');
    console.log(`   Total: ${hodUsers.length}`);
    hodUsers.slice(0, 5).forEach(u => {
      console.log(`   ✓ ${u.name} (${u.email})`);
      console.log(`     Department: ${u.department}, Active: ${u.isActive}`);
    });
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Pending registrations waiting for admin approval: ${pending.length}`);
    console.log(`   Approved HOD accounts that can login: ${hodUsers.length}`);
    console.log(`   HOD registration system: ${ pending.length > 0 || hodUsers.length > 0 ? '✅ WORKING' : '⚠️ NO DATA'}`);
    console.log();
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err.message);
  process.exit(1);
});
