import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = Object.freeze([
  'LOW_STOCK', 
  'PO_EVENT', 
  'SYSTEM',
  'BOOKING_ASSIGNED',
  'INSPECTION_STARTED',
  'INSPECTION_COMPLETED',
  'JOB_COMPLETED',
  'JOB_CANCELLED',
  'JOB_ON_HOLD',
  'JOB_IN_PROGRESS',
  'STATUS_UPDATED'
]);

const NotificationSchema = new mongoose.Schema(
  {
    // who should see it (optional; null = system/any inventory manager)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 },
    link: { type: String, default: null, validate: { validator: v => v === null || /^\/[A-Za-z0-9/_\-?=&.%]*$/.test(v), message: 'link must be a relative path or null' } }, // e.g., /parts?lowStock=1 or /purchase-orders/123
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    meta: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_, ret) => { ret.id = ret._id; delete ret._id; }
    },
    toObject: { virtuals: true }
  }
);

NotificationSchema.index(
  { userId: 1, read: 1, createdAt: -1 },
  { partialFilterExpression: { userId: { $type: 'objectId' } } }
);
NotificationSchema.index(
  { read: 1, createdAt: -1 },
  { partialFilterExpression: { userId: null } }
);
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification
  ? mongoose.models.Notification
  : mongoose.model('Notification', NotificationSchema);
