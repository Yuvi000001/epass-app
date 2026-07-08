// =====================================================================
// E-PASS — Sample data seeder (run with: npm run seed)
// Creates 3 campus Admins (BIST/BIRT/BIRTS) + one HOD, one Faculty,
// two Students, and one Guard under BIST for local testing.
// Safe to re-run — skips records that already exist.
// =====================================================================

require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

async function seed() {
  await connectDB();

  const upsert = async (filter, data) => {
    const existing = await User.findOne(filter);
    if (existing) {
      console.log(`Skipping (already exists): ${filter.email}`);
      return existing;
    }
    const created = await User.create(data);
    console.log(`Created ${data.role} [${data.campus}]: ${data.email}`);
    return created;
  };

  // ---- One Admin per campus ----
  const adminBist = await upsert(
    { email: 'admin.bist@bgi.edu.in' },
    { name: 'BIST Admin', email: 'admin.bist@bgi.edu.in', password: 'Admin@123', role: 'ADMIN', campus: 'BIST', isEmailVerified: true }
  );
  await upsert(
    { email: 'admin.birt@bgi.edu.in' },
    { name: 'BIRT Admin', email: 'admin.birt@bgi.edu.in', password: 'Admin@123', role: 'ADMIN', campus: 'BIRT', isEmailVerified: true }
  );
  await upsert(
    { email: 'admin.birts@bgi.edu.in' },
    { name: 'BIRTS Admin', email: 'admin.birts@bgi.edu.in', password: 'Admin@123', role: 'ADMIN', campus: 'BIRTS', isEmailVerified: true }
  );

  // ---- Sample BIST staff/students ----
  const hod = await upsert(
    { email: 'sunita.rao@bgi.edu.in' },
    {
      name: 'Dr. Sunita Rao', email: 'sunita.rao@bgi.edu.in', password: 'Hod@123', role: 'HOD',
      campus: 'BIST', department: 'CSE', phone: '9876543213', isEmailVerified: true, addedBy: adminBist._id,
    }
  );

  const faculty = await upsert(
    { email: 'ramesh.kumar@bgi.edu.in' },
    {
      name: 'Dr. Ramesh Kumar', email: 'ramesh.kumar@bgi.edu.in', password: 'Faculty@123',
      role: 'FACULTY', campus: 'BIST', department: 'CSE', designation: 'Assistant Professor',
      phone: '9876543212', isEmailVerified: true, addedBy: adminBist._id,
    }
  );

  await upsert(
    { email: 'john.doe@bgi.edu.in' },
    {
      name: 'John Doe', email: 'john.doe@bgi.edu.in', password: 'Student@123', role: 'STUDENT',
      campus: 'BIST', department: 'CSE', rollNumber: '21CS1001', branch: 'B.Tech CSE', semester: 4,
      facultyAdvisorId: faculty._id, phone: '9876543210', isEmailVerified: true, addedBy: adminBist._id,
    }
  );

  await upsert(
    { email: 'alice.smith@bgi.edu.in' },
    {
      name: 'Alice Smith', email: 'alice.smith@bgi.edu.in', password: 'Student@123', role: 'STUDENT',
      campus: 'BIST', department: 'CSE', rollNumber: '21CS1002', branch: 'B.Tech CSE', semester: 4,
      facultyAdvisorId: faculty._id, phone: '9876543211', isEmailVerified: true, addedBy: adminBist._id,
    }
  );

  await upsert(
    { email: 'guard.gate1@bgi.edu.in' },
    {
      name: 'Ramesh Singh', email: 'guard.gate1@bgi.edu.in', password: 'Guard@123',
      role: 'GUARD', campus: 'BIST', assignedGate: 'Main Gate', phone: '9876500001',
      isEmailVerified: true, addedBy: adminBist._id,
    }
  );

  console.log('\nSeeding complete. Default login credentials:');
  console.log('  ADMIN (BIST)  -> admin.bist@bgi.edu.in / Admin@123');
  console.log('  ADMIN (BIRT)  -> admin.birt@bgi.edu.in / Admin@123');
  console.log('  ADMIN (BIRTS) -> admin.birts@bgi.edu.in / Admin@123');
  console.log('  HOD           -> sunita.rao@bgi.edu.in / Hod@123');
  console.log('  FACULTY       -> ramesh.kumar@bgi.edu.in / Faculty@123');
  console.log('  STUDENT       -> john.doe@bgi.edu.in / Student@123');
  console.log('  GUARD         -> guard.gate1@bgi.edu.in / Guard@123');
  console.log('\nStudent self-registration campus codes:');
  console.log('  BIST  ->', process.env.CAMPUS_CODE_BIST || 'Bist@#123');
  console.log('  BIRT  ->', process.env.CAMPUS_CODE_BIRT || 'Birt@#123');
  console.log('  BIRTS ->', process.env.CAMPUS_CODE_BIRTS || 'Birts@#123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
