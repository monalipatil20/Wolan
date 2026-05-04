const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
      alias: 'name',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['super_admin', 'hub_manager', 'ops_coordinator', 'rider', 'merchant'],
      default: 'merchant',
      required: true,
    },
    hub_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      default: null,
      index: true,
    },
    profile_image: {
      type: String,
      default: null,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    last_login: {
      type: Date,
      default: null,
    },
    refresh_token_hash: {
      type: String,
      default: null,
      select: false,
    },
    password_reset_token_hash: {
      type: String,
      default: null,
      select: false,
    },
    password_reset_expires: {
      type: Date,
      default: null,
      select: false,
    },
    password_changed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.pre('save', async function savePassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.password_changed_at = new Date();
  }
  return next();
});

userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Compound indexes
userSchema.index({ role: 1, hub_id: 1 });
userSchema.index({ role: 1, is_active: 1 });
userSchema.index({ email: 1, role: 1 });

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    full_name: this.full_name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    hub_id: this.hub_id,
    profile_image: this.profile_image,
    is_active: this.is_active,
    last_login: this.last_login,
  };
};

module.exports = mongoose.model('User', userSchema);
