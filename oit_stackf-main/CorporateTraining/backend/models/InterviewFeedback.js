const mongoose = require('mongoose');

const interviewFeedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['hr', 'technical'],
        message: 'Type must be hr or technical',
      },
      required: [true, 'Interview type is required'],
    },
    questions: {
      type: [String],
    },
    answers: {
      type: [String],
    },
    feedback: {
      type: [String],
    },
    scores: {
      communication: {
        type: Number,
      },
      confidence: {
        type: Number,
      },
      technical: {
        type: Number,
      },
      overall: {
        type: Number,
      },
    },
    duration: {
      type: Number, // seconds
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const InterviewFeedback = mongoose.model('InterviewFeedback', interviewFeedbackSchema);

module.exports = InterviewFeedback;

