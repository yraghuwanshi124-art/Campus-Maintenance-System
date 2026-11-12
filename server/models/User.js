
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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

    phoneNumber: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      trim: true,
    },

    enrollmentNumber: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    department: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      trim: true,
    },
    branch: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      trim: true,
    },

    semester: {
      type: Number,
      required: function () {
        return this.role === "student";
      },
      min: 1,
      max: 8,
    },

    classSection: {
      type: String,
      required: true,
      trim: true,
    },

    // ================= PASSWORD =================

    // Password is required only after
    // email OTP verification and registration completion.
    password: {
      type: String,
      required: function () {
        return this.isVerified === true;
      },
      select: false,
    },

    // ================= ROLE =================

    role: {
      type: String,
      enum: ["student", "admin", "technician","supervisor"],
      default: "student",
    },

    assignedBlocks: {
      type: [String],
      default: [],
    },

    // ================= TECHNICIAN =================

// ================= TECHNICIAN =================

specialization: {
  type: String,
  enum: [
    "Electrician",
    "Carpenter",
    "AC Technician",
    "Computer Technician",
    "Plumber",
    "General",
  ],
  default: "General",
},

// Supervisor who created this technician
createdBySupervisor: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

    // ================= EMAIL OTP =================

    emailOTP: {
      type: String,
      select: false,
    },

    emailOTPExpires: {
      type: Date,
      select: false,
    },

    // OTP verified but password/account
    // creation is still pending.
    registrationEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Final account verification.
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ================= PASSWORD RESET OTP =================

    resetPasswordOTP: {
      type: String,
      select: false,
    },

    resetPasswordOTPExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
