const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Customer account. Accounts are created on the fly the first time someone
// signs in with Google (see userAuthController.googleLogin).
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, default: '', trim: true, maxlength: 32 },
    photoUrl: { type: String, default: '', trim: true },
    // Firebase Auth uid (Google provider). Indexed for lookups, not unique so
    // legacy/empty values never collide.
    firebaseUid: { type: String, default: '', index: true },
    provider: { type: String, enum: ['google', 'password'], default: 'google' },
    passwordHash: { type: String, default: null, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    photoUrl: this.photoUrl,
    provider: this.provider,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
