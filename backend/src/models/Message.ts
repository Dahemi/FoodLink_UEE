import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Attachment schema for files, images, etc.
const AttachmentSchema = new Schema({
  type: { 
    type: String, 
    enum: ['image', 'document', 'audio', 'video', 'location'],
    required: true
  },
  url: { type: String, required: true },
  filename: { type: String },
  size: { type: Number }, // in bytes
  mimeType: { type: String },
  thumbnail: { type: String }, // For images/videos
  duration: { type: Number }, // For audio/video in seconds
  coordinates: { // For location type
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  }
}, { _id: false });

// Message reactions schema
const ReactionSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  emoji: { 
    type: String, 
    required: true 
  }, // 👍, ❤️, 😊, etc.
  reactedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

// Main Message Schema
const MessageSchema = new Schema({
  // Conversation identification
  conversationId: { 
    type: String, 
    required: true,
    index: true
  }, // Generated from participant IDs
  
  // Message details
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  }, // Can reference Donor, NGO, Volunteer, or Beneficiary
  content: { 
    type: String, 
    maxlength: 2000 
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'system', 'template'],
    default: 'text'
  },
  
  // Context (what this message is about)
  contextType: { 
    type: String, 
    enum: ['donation', 'claim', 'task', 'general', 'support'],
    required: true
  },
  contextId: { 
    type: mongoose.Schema.Types.ObjectId,
    required: function() { return this.contextType !== 'general'; }
  }, // ID of donation, claim, or task
  
  // Attachments
  attachments: [AttachmentSchema],
  
  // Message status
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read receipts
  readBy: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId 
    }, // Can reference any user type
    readAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Delivery receipts
  deliveredTo: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId 
    }, // Can reference any user type
    deliveredAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  
  // Message threading (reply to another message)
  replyTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  },
  
  // Reactions
  reactions: [ReactionSchema],
  
  // Message priority
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // System message details (for automated messages)
  systemMessageType: { 
    type: String, 
    enum: [
      'donation_created', 'donation_claimed', 'volunteer_assigned',
      'pickup_scheduled', 'pickup_completed', 'delivery_completed',
      'task_cancelled', 'user_joined', 'user_left', 'status_update'
    ]
  },
  systemMessageData: { 
    type: mongoose.Schema.Types.Mixed 
  }, // Additional data for system messages
  
  // Template message (for quick responses)
  templateType: { 
    type: String, 
    enum: ['pickup_confirmation', 'delay_notification', 'completion_update', 'issue_report']
  },
  templateData: { 
    type: mongoose.Schema.Types.Mixed 
  },
  
  // Editing
  editedAt: { type: Date },
  editHistory: [{
    content: { type: String },
    editedAt: { type: Date, default: Date.now }
  }],
  
  // Deletion
  deletedAt: { type: Date },
  deletedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  deletedForEveryone: { type: Boolean, default: false },
  
  // Forwarding
  forwardedFrom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  },
  forwardCount: { type: Number, default: 0 },
  
  // Scheduling (for future messages)
  scheduledFor: { type: Date },
  isScheduled: { type: Boolean, default: false },
  
  // Encryption (for sensitive data)
  isEncrypted: { type: Boolean, default: false },
  encryptionKey: { type: String }, // Reference to encryption key
  
  // Moderation
  flagged: { type: Boolean, default: false },
  flagReason: { type: String },
  flaggedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  flaggedAt: { type: Date },
  moderationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'auto_approved'],
    default: 'auto_approved'
  }
}, { 
  timestamps: true 
});

// Conversation Schema (for managing chat participants and metadata)
const ConversationSchema = new Schema({
  conversationId: { 
    type: String, 
    unique: true, 
    required: true 
  },
  
  // Participants
  participants: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
    leftAt: { type: Date },
    isActive: { type: Boolean, default: true },
    lastReadMessageId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Message' 
    },
    lastReadAt: { type: Date },
    notificationSettings: {
      muted: { type: Boolean, default: false },
      mutedUntil: { type: Date }
    }
  }],
  
  // Conversation metadata
  title: { type: String }, // Optional title for group conversations
  description: { type: String, maxlength: 500 },
  conversationType: { 
    type: String, 
    enum: ['direct', 'group', 'support', 'system'],
    required: true
  },
  
  // Context
  contextType: { 
    type: String, 
    enum: ['donation', 'claim', 'task', 'general', 'support'],
    required: true
  },
  contextId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  
  // Settings
  settings: {
    allowFileSharing: { type: Boolean, default: true },
    allowImageSharing: { type: Boolean, default: true },
    maxParticipants: { type: Number, default: 10 },
    autoDeleteAfterDays: { type: Number }, // Auto-delete messages after X days
    requireApprovalForNewMembers: { type: Boolean, default: false }
  },
  
  // Status
  isActive: { type: Boolean, default: true },
  archivedBy: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    archivedAt: { type: Date }
  }],
  
  // Last activity
  lastMessageAt: { type: Date },
  lastMessageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Message' 
  },
  messageCount: { type: Number, default: 0 },
  
  // Privacy
  isPrivate: { type: Boolean, default: true },
  encryptionEnabled: { type: Boolean, default: false }
}, { 
  timestamps: true 
});

// Indexes for performance
// conversationId already has index: true, so use compound index only
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ contextType: 1, contextId: 1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ scheduledFor: 1, isScheduled: 1 });

// conversationId already has unique: true, so no need to index again
ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ contextType: 1, contextId: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

// Static method to generate conversation ID
MessageSchema.statics.generateConversationId = function(participantIds: string[], contextType?: string, contextId?: string): string {
  // Sort participant IDs to ensure consistent conversation ID
  const sortedIds = participantIds.sort();
  let baseId = sortedIds.join('-');
  
  if (contextType && contextId) {
    baseId += `-${contextType}-${contextId}`;
  }
  
  return baseId;
};

// Method to mark message as read
MessageSchema.methods.markAsRead = function(userId: string) {
  const existingRead = this.readBy.find((read: any) => read.userId.toString() === userId);
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
  }
};

// Method to add reaction
MessageSchema.methods.addReaction = function(userId: string, emoji: string) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter((reaction: any) => reaction.userId.toString() !== userId);
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    reactedAt: new Date()
  });
};

// Method to remove reaction
MessageSchema.methods.removeReaction = function(userId: string) {
  this.reactions = this.reactions.filter((reaction: any) => reaction.userId.toString() !== userId);
};

// Virtual for unread count per user
ConversationSchema.methods.getUnreadCount = function(userId: string): number {
  const participant = this.participants.find((p: any) => p.userId.toString() === userId);
  if (!participant || !participant.lastReadMessageId) {
    return this.messageCount;
  }
  
  // This would need to be calculated with a separate query in practice
  return 0; // Placeholder
};

// Method to add participant
ConversationSchema.methods.addParticipant = function(userId: string, role: string = 'member') {
  const existingParticipant = this.participants.find((p: any) => p.userId.toString() === userId);
  if (!existingParticipant) {
    this.participants.push({
      userId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  } else if (!existingParticipant.isActive) {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = undefined;
  }
};

// Method to remove participant
ConversationSchema.methods.removeParticipant = function(userId: string) {
  const participant = this.participants.find((p: any) => p.userId.toString() === userId);
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
};

export type MessageDocument = InferSchemaType<typeof MessageSchema> & { 
  _id: mongoose.Types.ObjectId;
  markAsRead: (userId: string) => void;
  addReaction: (userId: string, emoji: string) => void;
  removeReaction: (userId: string) => void;
};

export type ConversationDocument = InferSchemaType<typeof ConversationSchema> & { 
  _id: mongoose.Types.ObjectId;
  getUnreadCount: (userId: string) => number;
  addParticipant: (userId: string, role?: string) => void;
  removeParticipant: (userId: string) => void;
};

export const MessageModel = mongoose.model<MessageDocument>('Message', MessageSchema);
export const ConversationModel = mongoose.model<ConversationDocument>('Conversation', ConversationSchema);
