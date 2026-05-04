const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    updated_by_role: {
      type: String,
      default: 'system',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    actor_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    actor_role: {
      type: String,
      default: 'system',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    order_id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    merchant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
      index: true,
    },
    rider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    customer_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    customer_phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    delivery_address: {
      type: String,
      required: true,
      trim: true,
    },
    item_description: {
      type: String,
      required: true,
      trim: true,
    },
    declared_value: {
      type: Number,
      default: 0,
    },
    order_status: {
      type: String,
      enum: ['pending', 'picked_up', 'at_hub', 'out_for_delivery', 'delivered', 'failed', 'returned'],
      default: 'pending',
      index: true,
    },
    otp_code: {
      type: String,
      default: null,
      select: false,
    },
    package_tracking_id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    rider_tracking_id: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    qr_code: {
      type: String,
      default: null,
    },
    hub_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      required: true,
      index: true,
    },
    delivery_zone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    delivery_fee: {
      type: Number,
      default: 0,
    },
    cod_amount: {
      type: Number,
      default: 0,
    },
    batch_id: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    delivery_attempts: {
      type: Number,
      default: 0,
    },
    failed_reason: {
      type: String,
      default: null,
      trim: true,
    },
    return_reason: {
      type: String,
      default: null,
      trim: true,
    },
    assigned_at: {
      type: Date,
      default: null,
    },
    picked_up_at: {
      type: Date,
      default: null,
    },
    at_hub_at: {
      type: Date,
      default: null,
    },
    out_for_delivery_at: {
      type: Date,
      default: null,
    },
    delivered_at: {
      type: Date,
      default: null,
    },
    failed_at: {
      type: Date,
      default: null,
    },
    returned_at: {
      type: Date,
      default: null,
    },
    otp_verified_at: {
      type: Date,
      default: null,
    },
    status_history: {
      type: [orderHistorySchema],
      default: [],
    },
    activity_logs: {
      type: [activityLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for optimized queries
orderSchema.index({ hub_id: 1, delivery_zone: 1, order_status: 1, createdAt: -1 });
orderSchema.index({ merchant_id: 1, order_status: 1 });
orderSchema.index({ rider_id: 1, order_status: 1 });
orderSchema.index({ batch_id: 1, createdAt: -1 });
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days TTL

// Text indexes for search
orderSchema.index({ customer_name: 'text', delivery_address: 'text', package_tracking_id: 'text' });

orderSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    order_id: this.order_id,
    merchant_id: this.merchant_id,
    rider_id: this.rider_id,
    customer_name: this.customer_name,
    customer_phone: this.customer_phone,
    delivery_address: this.delivery_address,
    item_description: this.item_description,
    declared_value: this.declared_value,
    order_status: this.order_status,
    package_tracking_id: this.package_tracking_id,
    rider_tracking_id: this.rider_tracking_id,
    qr_code: this.qr_code,
    hub_id: this.hub_id,
    delivery_zone: this.delivery_zone,
    delivery_fee: this.delivery_fee,
    cod_amount: this.cod_amount,
    batch_id: this.batch_id,
    delivery_attempts: this.delivery_attempts,
    failed_reason: this.failed_reason,
    return_reason: this.return_reason,
    assigned_at: this.assigned_at,
    picked_up_at: this.picked_up_at,
    at_hub_at: this.at_hub_at,
    out_for_delivery_at: this.out_for_delivery_at,
    delivered_at: this.delivered_at,
    failed_at: this.failed_at,
    returned_at: this.returned_at,
    otp_verified_at: this.otp_verified_at,
    status_history: this.status_history,
    activity_logs: this.activity_logs,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Order', orderSchema);
