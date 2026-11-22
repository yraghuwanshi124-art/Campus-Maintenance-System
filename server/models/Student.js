const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    enrollmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },

    classSection: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Student || mongoose.model("Student", studentSchema);