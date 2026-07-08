const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// =====================================================================
// E-PASS — Unified User model
// One collection holds all 5 roles (STUDENT, FACULTY, HOD, GUARD, ADMIN).
// Role-specific fields are simply left empty/undefined for roles that
// don't use them — this fits MongoDB's flexible-schema nature much
// better than 5 separate tables, and keeps auth/profile logic in one place.
// =====================================================================

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'HOD', 'GUARD', 'ADMIN', 'DIRECTOR'],
      required: true,
    },
    campus: {
      type: String,
      enum: ['BIST', 'BIRT', 'BIRTS'],
      required: true,
    },
    isEmailVerified: { type: Boolean, default: false }, // true once OTP-verified (self-register) or admin-added
    department: { type: String, trim: true }, // CSE, ECE, ME, Civil, etc. (not used by ADMIN)
    phone: { type: String, trim: true },
    college: { type: String, trim: true },
    profileImageUrl: { type: String }, // Firebase Storage public URL
    fcmToken: { type: String },
    isActive: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // which Admin created this account

    // ---- STUDENT-only fields ----
    rollNumber: { type: String, unique: true, sparse: true, trim: true },
    branch: { type: String, trim: true },
    semester: { type: Number, min: 1, max: 8 },
    facultyAdvisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ---- FACULTY-only field ----
    designation: { type: String, trim: true },

    // ---- GUARD-only field ----
    assignedGate: { type: String, trim: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, department: 1 });
userSchema.index({ campus: 1, role: 1 });

// Hash the password automatically whenever it's set/changed.
// Skips re-hashing if the value already looks like a bcrypt hash — this lets
// the registration flow pre-hash a password once (see registerController.js)
// without it getting double-hashed when the final User document is created.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash, and expose `_id` as a clean string `id`
userSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
