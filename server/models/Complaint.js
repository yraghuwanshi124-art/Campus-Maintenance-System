
const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    block: { type: String, required: true },
    floor: { type: String, default: "" },
    room: { type: String, required: true },
    mobileNumber: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    description: { type: String, required: true },

    image: { type: String, default: "" },
    completionImage: { type: String, default: "" },
    resolutionRemarks: { type: String, default: "" },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: ["Pending", "Assigned", "In Progress", "Resolved"],
      default: "Pending",
    },

    // Fake Complaint Management
    isFake: { type: Boolean, default: false },
    fakeMarkedAt: { type: Date, default: null },
    fakeMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: { type: Date, default: null },
    technicianAssignedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    // Deadline Management
    deadline: { type: Date, default: null },

    deadlineSetBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deadlineReason: { type: String, default: "" },

    deadlineVersion: { type: Number, default: 0 },

    deadlineHistory: [
      {
        previousDeadline: { type: Date, default: null },
        newDeadline: { type: Date, required: true },
        reason: { type: String, required: true },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // Reminder Tracking
    reminderHistory: [
      {
        reminderKey: { type: String, required: true },
        reminderType: {
          type: String,
          enum: ["24_hours", "2_hours", "overdue"],
          required: true,
        },
        recipient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        sentAt: { type: Date, default: Date.now },
      },
    ],

    // Technician Assignment / Reassignment History
    assignmentHistory: [
      {
        previousTechnician: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        newTechnician: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        assignedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: { type: String, default: "" },
        assignedAt: { type: Date, default: Date.now },
      },
    ],

    // Supervisor Resolution Verification
    verificationStatus: {
      type: String,
      enum: ["Not Submitted", "Pending", "Approved", "Rejected"],
      default: "Not Submitted",
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: { type: Date, default: null },
    verificationRemarks: { type: String, default: "" },

    // Audit Trail
    auditHistory: [
      {
        action: { type: String, required: true },
        details: { type: String, default: "" },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        performedAt: { type: Date, default: Date.now },
      },
    ],

    supporters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    feedbackRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    feedbackComment: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);
