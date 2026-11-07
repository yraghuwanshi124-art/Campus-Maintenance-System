
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  sendVerificationOTP,
  sendPasswordResetOTP,
} = require("../services/emailService");

// ================= OTP GENERATOR =================

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ================= PASSWORD VALIDATION =================

const validateStrongPassword = (password) => {
  if (!password) return false;

  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return (
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial
  );
};

// ================= CHANGE PASSWORD =================

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required",
      });
    }

    if (!validateStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      });
    }

    const user = await User.findById(req.user.userId).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Server error while changing password",
    });
  }
};

// ================= REGISTER / START REGISTRATION =================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      classSection,
      enrollmentNumber,
      enrollmentYear,
      department,
      branch,
      semester,
    } = req.body;

    // ================= REQUIRED FIELDS =================

    if (
      !name ||
      !email ||
      !phoneNumber ||
      !classSection ||
      !enrollmentNumber ||
      !department ||
      !branch ||
      !semester
    ) {
      return res.status(400).json({
        message: "All student details are required",
      });
    }

    // ================= NORMALIZE DATA =================

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedEnrollment = enrollmentNumber
      .trim()
      .toUpperCase();

    const normalizedPhone = phoneNumber
      .toString()
      .replace(/\s+/g, "")
      .trim();

    const normalizedName = name.trim();
    const normalizedDepartment = department.trim();
    const normalizedBranch = branch.trim();
    const normalizedClassSection = classSection.trim();

    // ================= COLLEGE EMAIL CHECK =================

    if (!normalizedEmail.endsWith("@medicaps.ac.in")) {
      return res.status(400).json({
        message: "Please use your Medi-Caps college email.",
      });
    }

    // ================= PHONE CHECK =================

    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    // ================= ENROLLMENT CHECK =================

    if (!/^[A-Z0-9]+$/.test(normalizedEnrollment)) {
      return res.status(400).json({
        message: "Invalid enrollment number.",
      });
    }

    // ================= SEMESTER CHECK =================

    const numericSemester = Number(semester);

    if (
      !Number.isInteger(numericSemester) ||
      numericSemester < 1 ||
      numericSemester > 8
    ) {
      return res.status(400).json({
        message: "Semester must be between 1 and 8.",
      });
    }

    // ================= CHECK EXISTING ACCOUNT =================

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { enrollmentNumber: normalizedEnrollment },
        { phoneNumber: normalizedPhone },
      ],
    }).select("+emailOTP +emailOTPExpires");

    // ================= EXISTING VERIFIED ACCOUNT =================

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        message: "An account already exists with these details.",
      });
    }

    // ================= CREATE / UPDATE PENDING USER =================

    const otp = generateOTP();

    if (existingUser) {
      // Existing incomplete registration

      existingUser.name = normalizedName;
      existingUser.email = normalizedEmail;
      existingUser.phoneNumber = normalizedPhone;
      existingUser.enrollmentNumber = normalizedEnrollment;
      existingUser.department = normalizedDepartment;
      existingUser.branch = normalizedBranch;
      existingUser.semester = numericSemester;
      existingUser.classSection = normalizedClassSection;

      if (enrollmentYear) {
        existingUser.enrollmentYear =
          enrollmentYear.toString().trim();
      }

      existingUser.emailOTP = otp;

      existingUser.emailOTPExpires = new Date(
        Date.now() + 10 * 60 * 1000
      );

      existingUser.registrationEmailVerified = false;
      existingUser.isVerified = false;

      await existingUser.save();
    } else {
      const userData = {
        name: normalizedName,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        enrollmentNumber: normalizedEnrollment,
        department: normalizedDepartment,
        branch: normalizedBranch,
        semester: numericSemester,
        classSection: normalizedClassSection,
        role: "student",
        isVerified: false,
        registrationEmailVerified: false,
        emailOTP: otp,
        emailOTPExpires: new Date(
          Date.now() + 10 * 60 * 1000
        ),
      };

      if (enrollmentYear) {
        userData.enrollmentYear =
          enrollmentYear.toString().trim();
      }

      await User.create(userData);
    }

    // ================= SEND EMAIL OTP =================

    const emailRes = await sendVerificationOTP(normalizedEmail, otp);

    const message = (emailRes?.devMode || !process.env.EMAIL_USER)
      ? `Verification OTP generated! (Dev OTP: ${otp})`
      : "Verification OTP sent to your email.";

    return res.status(200).json({
      message,
      email: normalizedEmail,
      ...(emailRes?.devMode ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

// ================= VERIFY EMAIL OTP =================

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOTP = otp.trim();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailOTP +emailOTPExpires"
    );

    if (!user) {
      return res.status(404).json({
        message:
          "Registration not found. Please register again.",
      });
    }

    // Already completed account

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account is already verified.",
      });
    }

    // ================= OTP CHECK =================

    if (!user.emailOTP || !user.emailOTPExpires) {
      return res.status(400).json({
        message:
          "Verification OTP not found. Please register again.",
      });
    }

    if (user.emailOTPExpires < new Date()) {
      return res.status(400).json({
        message:
          "Verification OTP has expired. Please register again.",
      });
    }

    if (user.emailOTP !== normalizedOTP) {
      return res.status(400).json({
        message: "Invalid verification OTP.",
      });
    }

    // ================= EMAIL VERIFIED =================

    user.registrationEmailVerified = true;

    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;

    await user.save();

    return res.status(200).json({
      message:
        "Email verified successfully. Please create your password.",
      email: user.email,
    });
  } catch (error) {
    console.error("EMAIL OTP VERIFICATION ERROR:", error);

    return res.status(500).json({
      message: "Email OTP verification failed",
      error: error.message,
    });
  }
};

// ================= COMPLETE REGISTRATION =================

const completeRegistration = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
    } = req.body;

    // ================= REQUIRED FIELDS =================

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message:
          "Email, password and confirm password are required",
      });
    }

    // ================= NORMALIZE EMAIL =================

    const normalizedEmail = email.trim().toLowerCase();

    // ================= PASSWORD MATCH =================

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    // ================= STRONG PASSWORD =================

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      });
    }

    // ================= FIND PENDING USER =================

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        message:
          "Registration not found. Please register again.",
      });
    }

    // ================= CHECK OTP VERIFICATION =================

    if (!user.registrationEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your college email before creating your password.",
      });
    }

    // ================= ALREADY VERIFIED =================

    if (user.isVerified) {
      return res.status(400).json({
        message: "Account has already been created.",
      });
    }

    // ================= HASH PASSWORD =================

    user.password = await bcrypt.hash(password, 10);

    // ================= COMPLETE ACCOUNT =================

    user.isVerified = true;
    user.registrationEmailVerified = true;

    await user.save();

    return res.status(201).json({
      message:
        "Account created successfully. You can now login.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        classSection: user.classSection,
      },
    });
  } catch (error) {
    console.error("COMPLETE REGISTRATION ERROR:", error);

    return res.status(500).json({
      message: "Failed to complete registration",
      error: error.message,
    });
  }
};

// ================= FORGOT PASSWORD =================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+resetPasswordOTP +resetPasswordOTPExpires"
    );

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email",
      });
    }

    const otp = generateOTP();

    // user.resetPasswordOTP = otp;

    // user.resetPasswordOTPExpires = new Date(
    //   Date.now() + 10 * 60 * 1000
    // );

    // await user.save();

await user.updateOne({
  resetPasswordOTP: otp,
  resetPasswordOTPExpires: new Date(
    Date.now() + 10 * 60 * 1000
  ),
});

    const emailRes = await sendPasswordResetOTP(normalizedEmail, otp);

    const message = (emailRes?.devMode || !process.env.EMAIL_USER)
      ? `Password reset OTP generated! (Dev OTP: ${otp})`
      : "Password reset OTP sent to your email.";

    return res.status(200).json({
      message,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Failed to send password reset OTP",
    });
  }
};

// ================= RESET PASSWORD =================


const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP and new password are required",
      });
    }

    if (!validateStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+resetPasswordOTP +resetPasswordOTPExpires +password"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      !user.resetPasswordOTP ||
      !user.resetPasswordOTPExpires
    ) {
      return res.status(400).json({
        message:
          "Reset OTP not found. Please request a new OTP.",
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      return res.status(400).json({
        message:
          "Reset OTP has expired. Please request a new OTP.",
      });
    }

    if (user.resetPasswordOTP !== otp.trim()) {
      return res.status(400).json({
        message: "Invalid reset OTP",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        message:
          "New password must be different from current password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await user.updateOne({
      password: hashedPassword,
      resetPasswordOTP: undefined,
      resetPasswordOTPExpires: undefined,
    });

    return res.status(200).json({
      message:
        "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Failed to reset password",
    });
  }
};


// ================= LOGIN =================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Student must complete the entire registration.

    if (user.role === "student" && !user.isVerified) {
      return res.status(403).json({
        message:
          "Please complete your registration before logging in.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        enrollmentNumber: user.enrollmentNumber,
        department: user.department,
        semester: user.semester,
        classSection: user.classSection,
        role: user.role,
        assignedBlocks: user.assignedBlocks || [],
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

// ================= EXPORTS =================

module.exports = {
  registerUser,
  verifyOTP,
  completeRegistration,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};

