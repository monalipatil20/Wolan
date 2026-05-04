const mongoose = require('mongoose');

const gpsLocationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  { _id: false }
);

const nextOfKinSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['license', 'insurance', 'bike_registration', 'id_card', 'other'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const fineSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'waived'],
      default: 'pending',
    },
    issued_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issued_at: {
      type: Date,
      default: Date.now,
    },
    paid_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['accident', 'theft', 'complaint', 'lost_package', 'damage', 'medical', 'other'],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: null,
    },
    reported_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'closed'],
      default: 'open',
    },
    resolution: {
      type: String,
      default: null,
    },
    reported_at: {
      type: Date,
      default: Date.now,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const dailyEarningsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    deliveries: {
      type: Number,
      default: 0,
    },
    successful_deliveries: {
      type: Number,
      default: 0,
    },
    failed_deliveries: {
      type: Number,
      default: 0,
    },
    returned_orders: {
      type: Number,
      default: 0,
    },
    total_distance: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    cod_collected: {
      type: Number,
      default: 0,
    },
    fines: {
      type: Number,
      default: 0,
    },
    bonus: {
      type: Number,
      default: 0,
    },
    net_earnings: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const riderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    bike_plate: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    nin_number: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    next_of_kin: {
      type: nextOfKinSchema,
      required: true,
    },
    bond_amount: {
      type: Number,
      default: 0,
    },
    bond_status: {
      type: String,
      enum: ['pending', 'deposited', 'refunded', 'forfeited'],
      default: 'pending',
    },
    current_status: {
      type: String,
      enum: ['available', 'on_delivery', 'break', 'offline'],
      default: 'offline',
      index: true,
    },
    gps_location: {
      type: gpsLocationSchema,
      default: { type: 'Point', coordinates: [0, 0] },
    },
    last_location_update: {
      type: Date,
      default: null,
    },
    current_cod: {
      type: Number,
      default: 0,
    },
    performance_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    total_deliveries: {
      type: Number,
      default: 0,
    },
    successful_deliveries: {
      type: Number,
      default: 0,
    },
    failed_deliveries: {
      type: Number,
      default: 0,
    },
    returned_orders: {
      type: Number,
      default: 0,
    },
    total_distance: {
      type: Number,
      default: 0,
    },
    earnings: {
      type: Number,
      default: 0,
    },
    pending_payout: {
      type: Number,
      default: 0,
    },
    hub_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      required: true,
      index: true,
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    all_documents_verified: {
      type: Boolean,
      default: false,
    },
    fines: {
      type: [fineSchema],
      default: [],
    },
    incidents: {
      type: [incidentSchema],
      default: [],
    },
    daily_earnings: {
      type: [dailyEarningsSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    total_ratings: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    activation_date: {
      type: Date,
      default: Date.now,
    },
    last_delivery_at: {
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

riderSchema.index({ hub_id: 1, current_status: 1 });
riderSchema.index({ hub_id: 1, gps_location: '2dsphere' });
riderSchema.index({ 'daily_earnings.date': -1 });

riderSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    user_id: this.user_id,
    full_name: this.full_name,
    phone: this.phone,
    bike_plate: this.bike_plate,
    nin_number: this.nin_number,
    next_of_kin: this.next_of_kin,
    bond_amount: this.bond_amount,
    bond_status: this.bond_status,
    current_status: this.current_status,
    gps_location: this.gps_location,
    current_cod: this.current_cod,
    performance_score: this.performance_score,
    total_deliveries: this.total_deliveries,
    successful_deliveries: this.successful_deliveries,
    failed_deliveries: this.failed_deliveries,
    returned_orders: this.returned_orders,
    earnings: this.earnings,
    pending_payout: this.pending_payout,
    hub_id: this.hub_id,
    documents: this.documents,
    all_documents_verified: this.all_documents_verified,
    rating: this.rating,
    total_ratings: this.total_ratings,
    is_active: this.is_active,
    activation_date: this.activation_date,
    last_delivery_at: this.last_delivery_at,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

riderSchema.methods.toSummaryJSON = function toSummaryJSON() {
  return {
    id: this._id,
    full_name: this.full_name,
    phone: this.phone,
    bike_plate: this.bike_plate,
    current_status: this.current_status,
    gps_location: this.gps_location,
    performance_score: this.performance_score,
    total_deliveries: this.total_deliveries,
    earnings: this.earnings,
    pending_payout: this.pending_payout,
    hub_id: this.hub_id,
    rating: this.rating,
    is_active: this.is_active,
  };
};

module.exports = mongoose.model('Rider', riderSchema);
