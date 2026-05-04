const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const merchantSchema = new mongoose.Schema(
  {
    merchant_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    shop_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    building_name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    referral_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    referred_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      default: null,
      index: true,
    },
    tier_level: {
      type: String,
      enum: ['Starter', 'Active', 'Priority', 'Elite'],
      default: 'Starter',
      index: true,
    },
    total_deliveries: {
      type: Number,
      default: 0,
    },
    cod_balance: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    qr_code: {
      type: String,
      default: null,
    },
    hub_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'active',
      index: true,
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

merchantSchema.pre('save', async function hashMerchantPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  if (!this.isNew) {
    this.password_changed_at = new Date();
  }

  return next();
});

merchantSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

merchantSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    merchant_name: this.merchant_name,
    shop_name: this.shop_name,
    building_name: this.building_name,
    phone: this.phone,
    email: this.email,
    address: this.address,
    referral_code: this.referral_code,
    referred_by: this.referred_by,
    tier_level: this.tier_level,
    total_deliveries: this.total_deliveries,
    cod_balance: this.cod_balance,
    earnings: this.earnings,
    qr_code: this.qr_code,
    hub_id: this.hub_id,
    status: this.status,
    last_login: this.last_login,
  };
};

module.exports = mongoose.model('Merchant', merchantSchema);