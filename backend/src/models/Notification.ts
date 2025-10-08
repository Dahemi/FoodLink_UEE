import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Action button schema for interactive notifications
const ActionButtonSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, maxlength: 50 },
  action: { 
    type: String, 
    enum: ['accept', 'decline', 'view', 'call', 'message', 'navigate', 'reschedule', 'cancel', 'confirm', 'custom'],
    required: true
  },
  style: { 
    type: String, 
    enum: ['default', 'primary', 'secondary', 'success', 'warning', 'danger'],
    default: 'default'
  },
  url: { type: String }, // Deep link or URL to navigate to
  payload: { type: mongoose.Schema.Types.Mixed } // Additional data for the action
}, { _id: false });

// Rich content schema for enhanced notifications
const RichContentSchema = new Schema({
  imageUrl: { type: String },
  thumbnailUrl: { type: String },
  videoUrl: { type: String },
  audioUrl: { type: String },
  attachments: [{
    type: { type: String, enum: ['image', 'document', 'audio', 'video'] },
    url: { type: String, required: true },
    filename: { type: String },
    size: { type: Number }
  }],
  customData: { type: mongoose.Schema.Types.Mixed } // For app-specific rich content
}, { _id: false });

// Delivery tracking schema
const DeliveryTrackingSchema = new Schema({
  channel: { 
    type: String, 
    enum: ['push', 'email', 'sms', 'in_app', 'webhook'],
    required: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'delivered', 'read', 'clicked', 'failed', 'bounced'],
    default: 'pending'
  },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  readAt: { type: Date },
  clickedAt: { type: Date },
  failureReason: { type: String },
  externalId: { type: String }, // ID from external service (FCM, SendGrid, etc.)
  metadata: { type: mongoose.Schema.Types.Mixed } // Channel-specific metadata
}, { _id: false });

// Main Notification Schema
const NotificationSchema = new Schema({
  // Recipient information
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  }, // Can reference any user type
  recipientType: { 
    type: String, 
    enum: ['donor', 'ngo', 'volunteer', 'beneficiary', 'admin'],
    required: true
  },
  
  // Sender information (optional, for user-to-user notifications)
  senderId: { 
    type: mongoose.Schema.Types.ObjectId 
  }, // Can reference any user type
  
  // Notification identification
  notificationId: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated unique notification ID
  
  // Content
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  body: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  shortText: { 
    type: String, 
    maxlength: 50 
  }, // For badges, tickers, etc.
  
  // Notification type and category
  type: { 
    type: String, 
    enum: [
      // Donation related
      'donation_created', 'donation_claimed', 'donation_expired', 'donation_cancelled',
      
      // Task related
      'task_assigned', 'task_accepted', 'task_declined', 'task_completed', 'task_cancelled',
      'task_reminder', 'task_overdue', 'task_rescheduled',
      
      // Pickup/Delivery related
      'volunteer_en_route', 'volunteer_arrived', 'pickup_completed', 'delivery_completed',
      'pickup_delayed', 'delivery_delayed',
      
      // Communication
      'new_message', 'call_request', 'video_call_request',
      
      // Feedback and ratings
      'feedback_received', 'rating_received', 'review_request',
      
      // System notifications
      'account_verified', 'profile_updated', 'password_changed',
      'maintenance_notice', 'app_update', 'feature_announcement',
      
      // Emergency and alerts
      'emergency_alert', 'safety_concern', 'weather_alert',
      
      // Promotional
      'promotion', 'achievement_unlocked', 'milestone_reached',
      
      // Administrative
      'account_suspended', 'account_reactivated', 'policy_update',
      
      // Custom
      'custom'
    ],
    required: true
  },
  
  category: { 
    type: String, 
    enum: ['urgent', 'important', 'informational', 'promotional', 'social', 'system'],
    default: 'informational'
  },
  
  // Priority and urgency
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Context and references
  contextType: { 
    type: String, 
    enum: ['donation', 'claim', 'task', 'pickup_event', 'message', 'feedback', 'user', 'system', 'general']
  },
  contextId: { 
    type: mongoose.Schema.Types.ObjectId 
  }, // ID of related entity
  
  // Rich content
  richContent: { type: RichContentSchema },
  
  // Interactive elements
  actionButtons: [ActionButtonSchema],
  
  // Delivery channels and tracking
  channels: [DeliveryTrackingSchema],
  
  // Scheduling
  scheduledFor: { type: Date }, // When to send (for scheduled notifications)
  expiresAt: { type: Date }, // When notification expires
  
  // Status and state
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'sent', 'delivered', 'read', 'clicked', 'dismissed', 'expired', 'failed'],
    default: 'draft'
  },
  
  // Read status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Interaction tracking
  clicked: { type: Boolean, default: false },
  clickedAt: { type: Date },
  dismissed: { type: Boolean, default: false },
  dismissedAt: { type: Date },
  
  // Action taken
  actionTaken: { 
    type: String 
  }, // Which action button was clicked
  actionTakenAt: { type: Date },
  actionResult: { type: mongoose.Schema.Types.Mixed }, // Result of the action
  
  // Grouping and threading
  groupId: { type: String }, // For grouping related notifications
  threadId: { type: String }, // For threading conversations
  
  // Personalization
  personalizedContent: { type: mongoose.Schema.Types.Mixed }, // User-specific content variations
  localization: {
    language: { type: String, default: 'en' },
    region: { type: String, default: 'US' },
    timezone: { type: String, default: 'UTC' }
  },
  
  // Targeting and segmentation
  targetingCriteria: {
    userTypes: [{ type: String }],
    locations: [{ type: String }],
    interests: [{ type: String }],
    behaviors: [{ type: String }]
  },
  
  // A/B testing
  experimentId: { type: String },
  variant: { type: String }, // A, B, C, etc.
  
  // Analytics and tracking
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    customEvents: [{ 
      event: { type: String },
      value: { type: mongoose.Schema.Types.Mixed },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  
  // Retry logic
  retryCount: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  retryAfter: { type: Date },
  lastRetryAt: { type: Date },
  
  // Batch information
  batchId: { type: String }, // For bulk notifications
  batchSize: { type: Number },
  batchIndex: { type: Number },
  
  // Template information
  templateId: { type: String },
  templateVersion: { type: String },
  templateData: { type: mongoose.Schema.Types.Mixed }, // Data used to populate template
  
  // Compliance and privacy
  consentGiven: { type: Boolean, default: true },
  consentType: { 
    type: String, 
    enum: ['explicit', 'implicit', 'legitimate_interest', 'opt_in', 'opt_out']
  },
  gdprCompliant: { type: Boolean, default: true },
  
  // Device and platform targeting
  deviceTargeting: {
    platforms: [{ type: String, enum: ['ios', 'android', 'web', 'desktop'] }],
    deviceTypes: [{ type: String, enum: ['mobile', 'tablet', 'desktop'] }],
    appVersions: [{ type: String }],
    osVersions: [{ type: String }]
  },
  
  // Frequency capping
  frequencyCap: {
    maxPerHour: { type: Number },
    maxPerDay: { type: Number },
    maxPerWeek: { type: Number },
    respectQuietHours: { type: Boolean, default: true }
  },
  
  // Error handling
  deliveryErrors: [{
    channel: { type: String },
    error: { type: String },
    timestamp: { type: Date, default: Date.now },
    retryable: { type: Boolean, default: true }
  }],
  
  // Metadata
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional custom data
  tags: [{ type: String }], // For categorization and filtering
  
  // Audit trail
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  approvedAt: { type: Date }
}, { 
  timestamps: true 
});

// Indexes for performance
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ isRead: 1, recipientId: 1 });
NotificationSchema.index({ contextType: 1, contextId: 1 });
// notificationId already has unique: true, so no need to index again
NotificationSchema.index({ batchId: 1 });
NotificationSchema.index({ groupId: 1 });

// Pre-save middleware to generate notification ID
NotificationSchema.pre('save', async function(next) {
  if (this.isNew && !this.notificationId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.notificationId = `NTF-${dateStr}-${randomStr}`;
  }
  next();
});

// Virtual for notification age
NotificationSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
});

// Virtual for delivery success rate
NotificationSchema.virtual('deliverySuccessRate').get(function() {
  if (this.channels.length === 0) return 0;
  const successful = this.channels.filter(channel => 
    ['delivered', 'read', 'clicked'].includes(channel.status)
  ).length;
  return (successful / this.channels.length) * 100;
});

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = 'read';
    
    // Update analytics
    this.analytics.impressions += 1;
  }
};

// Method to mark as clicked
NotificationSchema.methods.markAsClicked = function(actionId?: string) {
  if (!this.clicked) {
    this.clicked = true;
    this.clickedAt = new Date();
    this.actionTaken = actionId || 'default';
    this.actionTakenAt = new Date();
    
    // Update analytics
    this.analytics.clicks += 1;
  }
};

// Method to dismiss notification
NotificationSchema.methods.dismiss = function() {
  this.dismissed = true;
  this.dismissedAt = new Date();
  this.status = 'dismissed';
};

// Method to add delivery tracking
NotificationSchema.methods.addDeliveryTracking = function(channel: string, status: string, metadata?: any) {
  const existingChannel = this.channels.find(c => c.channel === channel);
  if (existingChannel) {
    existingChannel.status = status;
    if (status === 'sent') existingChannel.sentAt = new Date();
    if (status === 'delivered') existingChannel.deliveredAt = new Date();
    if (status === 'read') existingChannel.readAt = new Date();
    if (status === 'clicked') existingChannel.clickedAt = new Date();
    if (metadata) existingChannel.metadata = metadata;
  } else {
    this.channels.push({
      channel,
      status,
      sentAt: status === 'sent' ? new Date() : undefined,
      deliveredAt: status === 'delivered' ? new Date() : undefined,
      readAt: status === 'read' ? new Date() : undefined,
      clickedAt: status === 'clicked' ? new Date() : undefined,
      metadata: metadata || {}
    });
  }
};

// Method to check if notification should be sent
NotificationSchema.methods.shouldSend = function(): boolean {
  // Check if expired
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  
  // Check if already sent
  if (['sent', 'delivered', 'read', 'clicked', 'dismissed'].includes(this.status)) return false;
  
  // Check if scheduled for future
  if (this.scheduledFor && new Date() < this.scheduledFor) return false;
  
  // Check retry logic
  if (this.retryCount >= this.maxRetries) return false;
  
  return true;
};

// Method to increment retry count
NotificationSchema.methods.incrementRetry = function(delayMinutes: number = 5) {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  this.retryAfter = new Date(Date.now() + delayMinutes * 60000);
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function(userId: string) {
  return await this.countDocuments({
    recipientId: userId,
    isRead: false,
    status: { $nin: ['dismissed', 'expired', 'failed'] }
  });
};

// Static method to mark multiple as read
NotificationSchema.statics.markMultipleAsRead = async function(userId: string, notificationIds: string[]) {
  return await this.updateMany(
    {
      recipientId: userId,
      notificationId: { $in: notificationIds },
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        status: 'read'
      },
      $inc: {
        'analytics.impressions': 1
      }
    }
  );
};

export type NotificationDocument = InferSchemaType<typeof NotificationSchema> & { 
  _id: mongoose.Types.ObjectId;
  ageInHours: number;
  deliverySuccessRate: number;
  markAsRead: () => void;
  markAsClicked: (actionId?: string) => void;
  dismiss: () => void;
  addDeliveryTracking: (channel: string, status: string, metadata?: any) => void;
  shouldSend: () => boolean;
  incrementRetry: (delayMinutes?: number) => void;
};

export const NotificationModel = mongoose.model<NotificationDocument>('Notification', NotificationSchema);
