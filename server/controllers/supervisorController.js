
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const bcrypt = require("bcryptjs");

const {
  sendComplaintResolvedEmail,
} = require("../services/emailService");

const {
  createNotification,
} = require("../utils/notificationService");



// ======================================================
// CATEGORY → TECHNICIAN SPECIALIZATION
// ======================================================

const specializationMap = {
  Computer: "Computer Technician",
  Fan: "Electrician",
  Light: "Electrician",
  AC: "AC Technician",
  Door: "Carpenter",
};

// ======================================================
// SLA DEADLINE DEFAULTS (IN HOURS)
// ======================================================

const deadlineHoursMap = {
  Computer: { High: 24, Medium: 48, Low: 72 },
  Fan: { High: 12, Medium: 24, Low: 48 },
  Light: { High: 12, Medium: 24, Low: 48 },
  AC: { High: 24, Medium: 48, Low: 72 },
  Door: { High: 24, Medium: 48, Low: 72 },
  General: { High: 24, Medium: 72, Low: 120 },
};

const getSuggestedDeadlineHours = (category, priority) => {
  const categoryRules =
    deadlineHoursMap[category] || deadlineHoursMap.General;

  return categoryRules[priority] || categoryRules.Medium;
};

// ======================================================
// HELPER FUNCTIONS
// ======================================================

// Compare block names safely
const normalizeBlock = (block) => {
  return String(block || "").trim().toLowerCase();
};

// Get logged-in admin and verify role
const getAdmin = async (userId) => {
  return User.findById(userId).select(
    "role assignedBlocks"
  );
};

// Check whether admin owns a block
const adminOwnsBlock = (admin, block) => {
  return (admin.assignedBlocks || []).some(
    (assignedBlock) =>
      normalizeBlock(assignedBlock) ===
      normalizeBlock(block)
  );
};

// ======================================================
// CREATE SUPERVISOR - ADMIN ONLY
// ======================================================

const createSupervisor = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      password,
      block,
      assignedBlocks,
    } = req.body;

    // ----------------------------------------------
    // VERIFY ADMIN
    // ----------------------------------------------

    const admin = await getAdmin(req.user.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    // ----------------------------------------------
    // GET SELECTED BLOCK
    // ----------------------------------------------

    const selectedBlock =
      block ||
      (Array.isArray(assignedBlocks) &&
      assignedBlocks.length === 1
        ? assignedBlocks[0]
        : null);

    if (
      !name ||
      !email ||
      !phoneNumber ||
      !password ||
      !selectedBlock
    ) {
      return res.status(400).json({
        message:
          "Name, email, phone number, password and block are required.",
      });
    }

    // One supervisor account belongs to one block.
    if (
      Array.isArray(assignedBlocks) &&
      assignedBlocks.length > 1
    ) {
      return res.status(400).json({
        message:
          "A supervisor can be assigned to only one block.",
      });
    }

    // ----------------------------------------------
    // BLOCK AUTHORIZATION
    // ----------------------------------------------

    if (!adminOwnsBlock(admin, selectedBlock)) {
      return res.status(403).json({
        message:
          "You are not authorized to create a supervisor for this block.",
      });
    }

    // ----------------------------------------------
    // CHECK EMAIL
    // ----------------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "An account already exists with this email.",
      });
    }

    // ----------------------------------------------
    // HASH PASSWORD
    // ----------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ----------------------------------------------
    // CREATE SUPERVISOR
    // ----------------------------------------------

    const supervisor = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phoneNumber: phoneNumber.trim(),
      password: hashedPassword,
      role: "supervisor",
      assignedBlocks: [selectedBlock.trim()],
      classSection: "SUPERVISOR",
      isVerified: true,
      registrationEmailVerified: true,
    });

    return res.status(201).json({
      message: "Supervisor created successfully.",

      supervisor: {
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        phoneNumber: supervisor.phoneNumber,
        role: supervisor.role,
        assignedBlocks: supervisor.assignedBlocks,
      },
    });
  } catch (error) {
    console.error("CREATE SUPERVISOR ERROR:", error);

    return res.status(500).json({
      message: "Failed to create supervisor.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SUPERVISORS - ADMIN ONLY
// ======================================================

const getSupervisors = async (req, res) => {
  try {
    const admin = await getAdmin(req.user.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    const adminBlocks = admin.assignedBlocks || [];

    if (adminBlocks.length === 0) {
      return res.json({
        supervisors: [],
      });
    }

    // Return only supervisors belonging to admin's blocks.
    const supervisors = await User.find({
      role: "supervisor",
      assignedBlocks: {
        $in: adminBlocks,
      },
    }).select(
      "name email phoneNumber assignedBlocks"
    );

    return res.json({
      supervisors,
    });
  } catch (error) {
    console.error("GET SUPERVISORS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch supervisors.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE SUPERVISOR - ADMIN ONLY
// ======================================================

const updateSupervisor = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      password,
      block,
      assignedBlocks,
    } = req.body;

    // ----------------------------------------------
    // VERIFY ADMIN
    // ----------------------------------------------

    const admin = await getAdmin(req.user.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    // ----------------------------------------------
    // FIND SUPERVISOR
    // ----------------------------------------------

    const supervisor = await User.findOne({
      _id: req.params.id,
      role: "supervisor",
    });

    if (!supervisor) {
      return res.status(404).json({
        message: "Supervisor not found.",
      });
    }

    // ----------------------------------------------
    // CHECK CURRENT BLOCK OWNERSHIP
    // ----------------------------------------------

    const currentBlocks =
      supervisor.assignedBlocks || [];

    // Legacy common supervisors with multiple blocks
    // cannot be edited by a single-block admin.
    if (currentBlocks.length !== 1) {
      return res.status(403).json({
        message:
          "This supervisor has a legacy or multiple-block assignment. Please review the assignment before editing.",
      });
    }

    if (!adminOwnsBlock(admin, currentBlocks[0])) {
      return res.status(403).json({
        message:
          "You are not authorized to edit this supervisor.",
      });
    }

    // ----------------------------------------------
    // CHECK NEW BLOCK
    // ----------------------------------------------

    const newBlock =
      block ||
      (Array.isArray(assignedBlocks) &&
      assignedBlocks.length === 1
        ? assignedBlocks[0]
        : currentBlocks[0]);

    if (!newBlock) {
      return res.status(400).json({
        message: "A valid block is required.",
      });
    }

    if (
      Array.isArray(assignedBlocks) &&
      assignedBlocks.length > 1
    ) {
      return res.status(400).json({
        message:
          "A supervisor can be assigned to only one block.",
      });
    }

    if (!adminOwnsBlock(admin, newBlock)) {
      return res.status(403).json({
        message:
          "You are not authorized to assign a supervisor to this block.",
      });
    }

    // ----------------------------------------------
    // UPDATE NAME
    // ----------------------------------------------

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty.",
        });
      }

      supervisor.name = name.trim();
    }

    // ----------------------------------------------
    // UPDATE EMAIL
    // ----------------------------------------------

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          message: "Email cannot be empty.",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: supervisor._id,
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            "An account already exists with this email.",
        });
      }

      supervisor.email = normalizedEmail;
    }

    // ----------------------------------------------
    // UPDATE PHONE NUMBER
    // ----------------------------------------------

    if (phoneNumber !== undefined) {
      if (!phoneNumber.trim()) {
        return res.status(400).json({
          message:
            "Phone number cannot be empty.",
        });
      }

      supervisor.phoneNumber =
        phoneNumber.trim();
    }

    // ----------------------------------------------
    // UPDATE PASSWORD (OPTIONAL)
    // ----------------------------------------------

    if (password) {
      supervisor.password = await bcrypt.hash(
        password,
        10
      );
    }

    // ----------------------------------------------
    // UPDATE BLOCK
    // ----------------------------------------------

    supervisor.assignedBlocks = [
      newBlock.trim(),
    ];

    await supervisor.save();

    return res.json({
      message: "Supervisor updated successfully.",

      supervisor: {
        id: supervisor._id,
        name: supervisor.name,
        email: supervisor.email,
        phoneNumber: supervisor.phoneNumber,
        role: supervisor.role,
        assignedBlocks: supervisor.assignedBlocks,
      },
    });
  } catch (error) {
    console.error("UPDATE SUPERVISOR ERROR:", error);

    return res.status(500).json({
      message: "Failed to update supervisor.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SUPERVISOR COMPLAINTS
// ======================================================

const getSupervisorComplaints = async (req, res) => {
  try {
    const supervisor = await User.findById(
      req.user.userId
    ).select("role assignedBlocks");

    if (
      !supervisor ||
      supervisor.role !== "supervisor"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Supervisor only.",
      });
    }

    const complaints = await Complaint.find({
      supervisor: supervisor._id,
      isFake: { $ne: true },
    })
      .select(
        [
          "block",
          "floor",
          "room",
          "category",
          "description",
          "image",
          "completionImage",
          "priority",
          "status",
          "technician",
          "createdAt",
          "assignedAt",
          "technicianAssignedAt",
          "resolvedAt",
          "feedbackRating",
          "feedbackComment",
          "deadline",
"deadlineSetBy",
"deadlineReason",
"deadlineVersion",
"deadlineHistory",
"verificationStatus",
"verifiedBy",
"verifiedAt",
"verificationRemarks",
"resolutionRemarks",
"assignmentHistory",
"auditHistory"
        ].join(" ")
      )
      .populate(
        "technician",
        "name email specialization"
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      complaints,
    });
  } catch (error) {
    console.error(
      "GET SUPERVISOR COMPLAINTS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch supervisor complaints.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL COLLEGE TECHNICIANS - SUPERVISOR ONLY
// ======================================================



const getTechniciansForSupervisor = async (req, res) => {
  try {
    const supervisor = await User.findById(req.user.userId);

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    const technicians = await User.find({
      role: "technician",
      createdBySupervisor: supervisor._id,
    }).select(
      "name email specialization assignedBlocks"
    );

    const techniciansWithWorkload = await Promise.all(
      technicians.map(async (technician) => {
        const activeComplaints = await Complaint.countDocuments({
          technician: technician._id,
          status: { $in: ["Assigned", "In Progress"] },
          isFake: false,
        });

        const inProgressComplaints = await Complaint.countDocuments({
          technician: technician._id,
          status: "In Progress",
          isFake: false,
        });

        return {
          _id: technician._id,
          name: technician.name,
          email: technician.email,
          specialization: technician.specialization,
          assignedBlocks: technician.assignedBlocks,
          activeComplaints,
          inProgressComplaints,
          workloadLevel:
            activeComplaints >= 8
              ? "High"
              : activeComplaints >= 4
              ? "Medium"
              : "Low",
        };
      })
    );

    return res.json(techniciansWithWorkload);
  } catch (error) {
    console.error("GET TECHNICIANS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch technicians.",
      error: error.message,
    });
  }
};



// ======================================================
// ASSIGN / REASSIGN TECHNICIAN - SUPERVISOR ONLY
// ======================================================

const assignTechnician = async (req, res) => {
  try {
    const { technicianId, reason } = req.body;

    if (!technicianId || !reason || !reason.trim()) {
      return res.status(400).json({
        message: "Technician and assignment reason are required.",
      });
    }

    const supervisor = await User.findById(req.user.userId);

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    if (
      !complaint.supervisor ||
      complaint.supervisor.toString() !== supervisor._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to manage this complaint.",
      });
    }

    const ownsBlock = (supervisor.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!ownsBlock) {
      return res.status(403).json({
        message: "Complaint does not belong to your assigned block.",
      });
    }

    if (complaint.status === "Resolved" || complaint.isFake) {
      return res.status(400).json({
        message: "Resolved or fake complaints cannot be assigned.",
      });
    }

    const technician = await User.findOne({
      _id: technicianId,
      role: "technician",
      createdBySupervisor: supervisor._id,
    });

    if (!technician) {
      return res.status(404).json({
        message: "Technician not found under your supervision.",
      });
    }

    const technicianOwnsBlock = (technician.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!technicianOwnsBlock) {
      return res.status(400).json({
        message: "Technician is not assigned to this block.",
      });
    }

    // Verify technician specialization.
    const requiredSpecialization =
      specializationMap[complaint.category];

    if (
      requiredSpecialization &&
      technician.specialization !== requiredSpecialization &&
      technician.specialization !== "General"
    ) {
      return res.status(400).json({
        message: `This complaint requires a ${requiredSpecialization}.`,
      });
    }

    const previousTechnician = complaint.technician || null;

    if (
      previousTechnician &&
      previousTechnician.toString() === technician._id.toString()
    ) {
      return res.status(400).json({
        message: "This technician is already assigned.",
      });
    }

    // Calculate technician's current active workload.
    const activeWorkload = await Complaint.countDocuments({
      technician: technician._id,
      status: { $in: ["Assigned", "In Progress"] },
      isFake: false,
    });

    // Save assignment history.
    complaint.assignmentHistory.push({
      previousTechnician,
      newTechnician: technician._id,
      assignedBy: supervisor._id,
      reason: reason.trim(),
      assignedAt: new Date(),
    });

    // Set a fresh suggested deadline for the new assignment.
    const hours = getSuggestedDeadlineHours(
      complaint.category,
      complaint.priority
    );

    const newDeadline = new Date(
      Date.now() + hours * 60 * 60 * 1000
    );

    complaint.deadlineHistory.push({
      previousDeadline: complaint.deadline || null,
      newDeadline,
      reason: previousTechnician
        ? `Fresh deadline after technician reassignment: ${reason.trim()}`
        : `Initial deadline on technician assignment: ${reason.trim()}`,
      changedBy: supervisor._id,
      changedAt: new Date(),
    });

    complaint.technician = technician._id;
    complaint.technicianAssignedAt = new Date();
    complaint.status = "Assigned";

    complaint.deadline = newDeadline;
    complaint.deadlineSetBy = supervisor._id;
    complaint.deadlineReason =
      `Suggested ${hours}-hour SLA after assignment. Reason: ${reason.trim()}`;

    complaint.deadlineVersion =
      (complaint.deadlineVersion || 0) + 1;

    // Reset verification for the new technician's work.
    complaint.verificationStatus = "Not Submitted";
    complaint.verifiedBy = null;
    complaint.verifiedAt = null;
    complaint.verificationRemarks = "";
    complaint.resolutionRemarks = "";
    complaint.completionImage = "";
    complaint.resolvedAt = null;

    complaint.auditHistory.push({
      action: previousTechnician
        ? "TECHNICIAN_REASSIGNED"
        : "TECHNICIAN_ASSIGNED",
      details: `Technician ${technician.name} assigned. Reason: ${reason.trim()}. Fresh deadline: ${newDeadline.toISOString()}`,
      performedBy: supervisor._id,
      performedAt: new Date(),
    });

    await complaint.save();

    // Notify newly assigned technician.
    await createNotification({
      recipient: technician._id,
      title: previousTechnician
        ? "Complaint Reassigned to You"
        : "New Complaint Assigned",
      message: `A ${complaint.category} complaint in ${complaint.block}, Room ${complaint.room} has been assigned to you. Your resolution deadline is ${newDeadline.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`,
      type: "technician_assigned",
      complaint: complaint._id,
    });

    // Notify previous technician when reassigned.
    if (previousTechnician) {
      await createNotification({
        recipient: previousTechnician,
        title: "Complaint Reassigned",
        message: `Complaint ${complaint._id} has been reassigned to another technician.`,
        type: "system",
        complaint: complaint._id,
      });
    }

    // Notify supervisor about successful assignment.
    await createNotification({
      recipient: supervisor._id,
      title: "Technician Assignment Updated",
      message: `Complaint ${complaint._id} has been assigned to ${technician.name}.`,
      type: "system",
      complaint: complaint._id,
    });

    return res.json({
      message: previousTechnician
        ? "Technician reassigned successfully."
        : "Technician assigned successfully.",
      complaint: {
        _id: complaint._id,
        block: complaint.block,
        floor: complaint.floor,
        room: complaint.room,
        category: complaint.category,
        description: complaint.description,
        image: complaint.image,
        completionImage: complaint.completionImage,
        priority: complaint.priority,
        status: complaint.status,
        supervisor: complaint.supervisor,
        technician: {
          _id: technician._id,
          name: technician.name,
          email: technician.email,
          specialization: technician.specialization,
        },
        deadline: complaint.deadline,
        deadlineReason: complaint.deadlineReason,
        deadlineVersion: complaint.deadlineVersion,
        deadlineHistory: complaint.deadlineHistory,
        assignmentHistory: complaint.assignmentHistory,
        verificationStatus: complaint.verificationStatus,
        createdAt: complaint.createdAt,
        assignedAt: complaint.assignedAt,
        technicianAssignedAt: complaint.technicianAssignedAt,
        resolvedAt: complaint.resolvedAt,
      },
      technicianWorkload: activeWorkload,
    });
  } catch (error) {
    console.error("ASSIGN TECHNICIAN ERROR:", error);

    return res.status(500).json({
      message: "Failed to assign technician.",
      error: error.message,
    });
  }
};


// ======================================================
// SET / UPDATE COMPLAINT DEADLINE - SUPERVISOR ONLY
// ======================================================

const setComplaintDeadline = async (req, res) => {
  try {
    const { deadline, useSuggestedDeadline, reason } = req.body;

    const supervisor = await User.findById(
      req.user.userId
    ).select("role assignedBlocks");

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    // Verify complaint ownership.
    if (
      !complaint.supervisor ||
      complaint.supervisor.toString() !== supervisor._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to manage this complaint.",
      });
    }

    // Verify block ownership.
    const ownsBlock = (supervisor.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!ownsBlock) {
      return res.status(403).json({
        message: "This complaint does not belong to your assigned block.",
      });
    }

    if (complaint.status === "Resolved" || complaint.isFake) {
      return res.status(400).json({
        message: "Deadline cannot be set for this complaint.",
      });
    }

    let newDeadline;
    let deadlineReason;

    if (useSuggestedDeadline === true) {
      const hours = getSuggestedDeadlineHours(
        complaint.category,
        complaint.priority
      );

      newDeadline = new Date(Date.now() + hours * 60 * 60 * 1000);

      deadlineReason = `Suggested SLA: ${hours} hours for ${complaint.category} - ${complaint.priority} priority.`;
    } else {
      if (!deadline || !reason || !reason.trim()) {
        return res.status(400).json({
          message:
            "A custom deadline and a reason are required when overriding the suggested deadline.",
        });
      }

      newDeadline = new Date(deadline);

      if (Number.isNaN(newDeadline.getTime())) {
        return res.status(400).json({
          message: "Please provide a valid deadline.",
        });
      }

      if (newDeadline <= new Date()) {
        return res.status(400).json({
          message: "Deadline must be in the future.",
        });
      }

      deadlineReason = reason.trim();
    }

    const previousDeadline = complaint.deadline || null;

    complaint.deadlineHistory.push({
      previousDeadline,
      newDeadline,
      reason: deadlineReason,
      changedBy: supervisor._id,
      changedAt: new Date(),
    });

    complaint.deadline = newDeadline;
    complaint.deadlineSetBy = supervisor._id;
    complaint.deadlineReason = deadlineReason;
    complaint.deadlineVersion =
      (complaint.deadlineVersion || 0) + 1;

    complaint.auditHistory.push({
      action: previousDeadline
        ? "DEADLINE_UPDATED"
        : "DEADLINE_SET",
      details: `Deadline set to ${newDeadline.toISOString()}. Reason: ${deadlineReason}`,
      performedBy: supervisor._id,
      performedAt: new Date(),
    });

    await complaint.save();

    // Notify assigned technician when available.
    if (complaint.technician) {
      await createNotification({
        recipient: complaint.technician,
        title: previousDeadline
          ? "Complaint Deadline Updated"
          : "Complaint Deadline Assigned",
        message: `The resolution deadline for your ${complaint.category} complaint in ${complaint.block}, Room ${complaint.room} has been set to ${newDeadline.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`,
        type: "deadline_reminder",
        complaint: complaint._id,
      });
    }

    return res.json({
      message: previousDeadline
        ? "Complaint deadline updated successfully."
        : "Complaint deadline set successfully.",
      complaint: {
        _id: complaint._id,
        deadline: complaint.deadline,
        deadlineReason: complaint.deadlineReason,
        deadlineVersion: complaint.deadlineVersion,
        deadlineHistory: complaint.deadlineHistory,
      },
    });
  } catch (error) {
    console.error("SET COMPLAINT DEADLINE ERROR:", error);

    return res.status(500).json({
      message: "Failed to set complaint deadline.",
      error: error.message,
    });
  }
};


const verifyComplaint = async (req, res) => {
  try {
    const { decision, remarks } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be Approved or Rejected.",
      });
    }

    if (decision === "Rejected" && !remarks?.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required.",
      });
    }

    const supervisor = await User.findById(req.user.userId);

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Supervisor access required.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    if (
      !complaint.supervisor ||
      complaint.supervisor.toString() !== supervisor._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to verify this complaint.",
      });
    }

    const ownsBlock = (supervisor.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!ownsBlock) {
      return res.status(403).json({
        message: "Complaint does not belong to your assigned block.",
      });
    }

    if (complaint.isFake || complaint.status === "Resolved") {
      return res.status(400).json({
        message: "This complaint cannot be verified.",
      });
    }

    if (
      complaint.verificationStatus !== "Pending" ||
      !complaint.completionImage ||
      !complaint.resolutionRemarks?.trim()
    ) {
      return res.status(400).json({
        message: "No complete technician submission is awaiting verification.",
      });
    }

    complaint.verificationStatus = decision;
    complaint.verifiedBy = supervisor._id;
    complaint.verifiedAt = new Date();
    complaint.verificationRemarks = remarks?.trim() || "";

    if (decision === "Approved") {
      complaint.status = "Resolved";
      complaint.resolvedAt = new Date();

      await sendComplaintResolvedEmail(complaint);

      await createNotification({
        recipient: complaint.user,
        title: "Complaint Resolved",
        message: `Your ${complaint.category} complaint in ${complaint.block}, Room ${complaint.room} has been verified and resolved.`,
        type: "complaint_resolved",
        complaint: complaint._id,
      });

      if (complaint.technician) {
        await createNotification({
          recipient: complaint.technician,
          title: "Work Approved",
          message: `Your completion submission for complaint ${complaint._id} has been approved.`,
          type: "system",
          complaint: complaint._id,
        });
      }
    } else {
      complaint.status = "In Progress";
      complaint.resolvedAt = null;

      if (complaint.technician) {
        await createNotification({
          recipient: complaint.technician,
          title: "Completion Submission Rejected",
          message: `Your work for complaint ${complaint._id} requires correction. Supervisor remarks: ${remarks.trim()}`,
          type: "system",
          complaint: complaint._id,
        });
      }
    }

    complaint.auditHistory.push({
      action: decision === "Approved"
        ? "COMPLAINT_VERIFIED"
        : "COMPLETION_REJECTED",
      details: remarks?.trim() || "Completion approved by supervisor.",
      performedBy: supervisor._id,
      performedAt: new Date(),
    });

    await complaint.save();

    return res.json({
      message: decision === "Approved"
        ? "Complaint verified and resolved successfully."
        : "Completion rejected. Complaint returned to technician.",
      complaint,
    });
  } catch (error) {
    console.error("VERIFY COMPLAINT ERROR:", error);

    return res.status(500).json({
      message: "Failed to verify complaint.",
      error: error.message,
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createSupervisor,
  getSupervisors,
  updateSupervisor,
  getSupervisorComplaints,
  getTechniciansForSupervisor,
  assignTechnician,
  setComplaintDeadline,
  verifyComplaint,
};
