import mongoose, { Schema, InferSchemaType } from 'mongoose';

// Rating criteria schema for detailed feedback
const RatingCriteriaSchema = new Schema({
  // For Donor feedback
  foodQuality: { type: Number, min: 1, max: 5 },
  foodQuantity: { type: Number, min: 1, max: 5 },
  packaging: { type: Number, min: 1, max: 5 },
  hygiene: { type: Number, min: 1, max: 5 },
  
  // For Volunteer feedback
  punctuality: { type: Number, min: 1, max: 5 },
  communication: { type: Number, min: 1, max: 5 },
  professionalism: { type: Number, min: 1, max: 5 },
  foodHandling: { type: Number, min: 1, max: 5 },
  
  // For NGO feedback
  organization: { type: Number, min: 1, max: 5 },
  coordination: { type: Number, min: 1, max: 5 },
  responsiveness: { type: Number, min: 1, max: 5 },
  impact: { type: Number, min: 1, max: 5 },
  
  // For Beneficiary feedback
  accessibility: { type: Number, min: 1, max: 5 },
  variety: { type: Number, min: 1, max: 5 },
  freshness: { type: Number, min: 1, max: 5 },
  portionSize: { type: Number, min: 1, max: 5 }
}, { _id: false });

// Improvement suggestion schema
const ImprovementSuggestionSchema = new Schema({
  category: { 
    type: String, 
    enum: ['process', 'communication', 'timing', 'quality', 'safety', 'technology', 'other'],
    required: true
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  suggestion: { type: String, maxlength: 500, required: true },
  implementationDifficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard']
  },
  estimatedImpact: { 
    type: String, 
    enum: ['low', 'medium', 'high']
  }
}, { _id: false });

// Main Feedback Schema
const FeedbackSchema = new Schema({
  // References
  donationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Donation' 
  },
  claimId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Claim' 
  },
  taskId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'VolunteerTask' 
  },
  pickupEventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PickupEvent' 
  },
  
  // Feedback identification
  feedbackNumber: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Auto-generated unique feedback number
  
  // Who is giving feedback and about whom
  reviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  }, // Person giving feedback (can be any user type)
  revieweeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  }, // Person being reviewed (can be any user type)
  
  // Feedback type and context
  feedbackType: { 
    type: String, 
    enum: [
      'donor_to_volunteer', 'donor_to_ngo',
      'volunteer_to_donor', 'volunteer_to_ngo',
      'ngo_to_donor', 'ngo_to_volunteer',
      'beneficiary_to_ngo', 'beneficiary_to_volunteer',
      'system_feedback', 'general_feedback'
    ],
    required: true
  },
  
  // Context of the feedback
  context: { 
    type: String, 
    enum: ['donation_process', 'pickup_delivery', 'communication', 'food_quality', 'service_quality', 'app_experience', 'general'],
    required: true
  },
  
  // Overall rating
  overallRating: { 
    type: Number, 
    required: true,
    min: 1, 
    max: 5 
  },
  
  // Detailed ratings
  detailedRatings: { type: RatingCriteriaSchema },
  
  // Written feedback
  title: { 
    type: String, 
    maxlength: 100 
  },
  comment: { 
    type: String, 
    maxlength: 2000 
  },
  
  // Specific aspects
  positiveAspects: [{ 
    type: String, 
    maxlength: 200 
  }], // What went well
  negativeAspects: [{ 
    type: String, 
    maxlength: 200 
  }], // What could be improved
  
  // Improvement suggestions
  suggestions: [ImprovementSuggestionSchema],
  
  // Recommendation
  wouldRecommend: { type: Boolean },
  wouldWorkAgain: { type: Boolean },
  
  // Experience rating
  experienceRating: { 
    type: String, 
    enum: ['excellent', 'good', 'average', 'poor', 'terrible']
  },
  
  // Issue reporting
  issuesReported: [{
    issueType: { 
      type: String, 
      enum: ['quality', 'quantity', 'timing', 'communication', 'safety', 'hygiene', 'behavior', 'other']
    },
    severity: { 
      type: String, 
      enum: ['minor', 'moderate', 'major', 'critical'],
      default: 'moderate'
    },
    description: { type: String, maxlength: 500 },
    evidence: [{ 
      type: { type: String, enum: ['photo', 'document', 'audio'] },
      url: { type: String },
      description: { type: String }
    }]
  }],
  
  // Response from reviewee
  response: {
    comment: { type: String, maxlength: 1000 },
    respondedAt: { type: Date },
    acknowledgment: { type: Boolean }, // Did they acknowledge the feedback?
    actionPlan: { type: String, maxlength: 500 } // What they plan to do about it
  },
  
  // Verification and authenticity
  isVerified: { type: Boolean, default: false },
  verificationMethod: { 
    type: String, 
    enum: ['pickup_confirmation', 'delivery_confirmation', 'photo_evidence', 'gps_location', 'manual_verification']
  },
  verifiedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  verifiedAt: { type: Date },
  
  // Feedback status
  status: { 
    type: String, 
    enum: ['pending', 'published', 'under_review', 'disputed', 'resolved', 'hidden'],
    default: 'pending'
  },
  
  // Moderation
  moderationStatus: { 
    type: String, 
    enum: ['auto_approved', 'pending_review', 'approved', 'rejected', 'flagged'],
    default: 'auto_approved'
  },
  moderationNotes: { type: String, maxlength: 500 },
  moderatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  moderatedAt: { type: Date },
  
  // Flagging and reporting
  flagged: { type: Boolean, default: false },
  flagReason: { 
    type: String, 
    enum: ['inappropriate', 'spam', 'fake', 'offensive', 'irrelevant', 'other']
  },
  flaggedBy: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    flaggedAt: { type: Date, default: Date.now }
  }],
  
  // Helpfulness voting
  helpfulVotes: { type: Number, default: 0 },
  notHelpfulVotes: { type: Number, default: 0 },
  votedBy: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['helpful', 'not_helpful'] },
    votedAt: { type: Date, default: Date.now }
  }],
  
  // Follow-up
  followUpRequired: { type: Boolean, default: false },
  followUpReason: { type: String, maxlength: 300 },
  followUpBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  followUpAt: { type: Date },
  followUpCompleted: { type: Boolean, default: false },
  
  // Analytics and insights
  sentimentScore: { type: Number, min: -1, max: 1 }, // AI-generated sentiment analysis
  keywords: [{ type: String }], // Extracted keywords for analysis
  category: { 
    type: String, 
    enum: ['praise', 'complaint', 'suggestion', 'neutral', 'mixed']
  }, // Auto-categorized feedback type
  
  // Privacy settings
  isAnonymous: { type: Boolean, default: false },
  isPublic: { type: Boolean, default: true },
  
  // Timing
  experienceDate: { type: Date }, // When the experience being reviewed happened
  submittedAt: { type: Date, default: Date.now },
  
  // Impact tracking
  impactMetrics: {
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    actionsTaken: { type: Number, default: 0 }, // How many times this feedback led to action
    improvementsMade: [{ 
      description: { type: String },
      implementedAt: { type: Date },
      implementedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }]
  }
}, { 
  timestamps: true 
});

// Indexes for performance
FeedbackSchema.index({ reviewerId: 1 });
FeedbackSchema.index({ revieweeId: 1 });
FeedbackSchema.index({ feedbackType: 1 });
FeedbackSchema.index({ overallRating: 1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ donationId: 1 });
FeedbackSchema.index({ taskId: 1 });
// feedbackNumber already has unique: true, so no need to index again

// Pre-save middleware to generate feedback number
FeedbackSchema.pre('save', async function(next) {
  if (this.isNew && !this.feedbackNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.feedbackNumber = `FBK-${dateStr}-${randomStr}`;
  }
  next();
});

// Virtual for helpfulness ratio
FeedbackSchema.virtual('helpfulnessRatio').get(function() {
  const totalVotes = this.helpfulVotes + this.notHelpfulVotes;
  if (totalVotes === 0) return 0;
  return (this.helpfulVotes / totalVotes) * 100;
});

// Virtual for feedback age
FeedbackSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// Method to calculate average detailed rating
FeedbackSchema.methods.calculateAverageDetailedRating = function(): number {
  if (!this.detailedRatings) return this.overallRating;
  
  const ratings = Object.values(this.detailedRatings).filter((rating: any) => 
    typeof rating === 'number' && rating >= 1 && rating <= 5
  ) as number[];
  
  if (ratings.length === 0) return this.overallRating;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Round to 1 decimal place
};

// Method to add helpful vote
FeedbackSchema.methods.addVote = function(userId: string, voteType: 'helpful' | 'not_helpful') {
  // Remove existing vote from this user
  this.votedBy = this.votedBy.filter((vote: any) => vote.userId.toString() !== userId);
  
  // Add new vote
  this.votedBy.push({
    userId,
    vote: voteType,
    votedAt: new Date()
  });
  
  // Update vote counts
  const helpfulCount = this.votedBy.filter((vote: any) => vote.vote === 'helpful').length;
  const notHelpfulCount = this.votedBy.filter((vote: any) => vote.vote === 'not_helpful').length;
  
  this.helpfulVotes = helpfulCount;
  this.notHelpfulVotes = notHelpfulCount;
};

// Method to flag feedback
FeedbackSchema.methods.flag = function(userId: string, reason: string) {
  // Check if already flagged by this user
  const existingFlag = this.flaggedBy.find((flag: any) => flag.userId.toString() === userId);
  if (existingFlag) return false;
  
  this.flaggedBy.push({
    userId,
    reason,
    flaggedAt: new Date()
  });
  
  this.flagged = true;
  
  // Auto-hide if flagged by multiple users
  if (this.flaggedBy.length >= 3) {
    this.status = 'under_review';
  }
  
  return true;
};

// Method to respond to feedback
FeedbackSchema.methods.respond = function(comment: string, acknowledgment: boolean = true, actionPlan?: string) {
  this.response = {
    comment,
    respondedAt: new Date(),
    acknowledgment,
    actionPlan: actionPlan || ''
  };
};

// Static method to get feedback statistics for a user
FeedbackSchema.statics.getStatsForUser = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { revieweeId: new mongoose.Types.ObjectId(userId), status: 'published' } },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        averageRating: { $avg: '$overallRating' },
        ratingDistribution: {
          $push: '$overallRating'
        },
        recommendationRate: {
          $avg: { $cond: [{ $eq: ['$wouldRecommend', true] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: [],
    recommendationRate: 0
  };
};

export type FeedbackDocument = InferSchemaType<typeof FeedbackSchema> & { 
  _id: mongoose.Types.ObjectId;
  helpfulnessRatio: number;
  ageInDays: number;
  calculateAverageDetailedRating: () => number;
  addVote: (userId: string, voteType: 'helpful' | 'not_helpful') => void;
  flag: (userId: string, reason: string) => boolean;
  respond: (comment: string, acknowledgment?: boolean, actionPlan?: string) => void;
};

export const FeedbackModel = mongoose.model<FeedbackDocument>('Feedback', FeedbackSchema);
