
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
const supervisor = await User.findById(req.user.userId);

if (!supervisor || supervisor.role !== "supervisor") {
  return res.status(403).json({
    message: "Access denied. Supervisor only.",
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

    // Admin must assign a deadline before technician assignment.
    if (!complaint.deadline) {
      return res.status(400).json({
        message: "This complaint does not have an admin-assigned deadline.",
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

    // Assign technician without changing Admin's deadline.
    complaint.technician = technician._id;
    complaint.technicianAssignedAt = new Date();
    complaint.status = "Assigned";

    // Reset verification for the new technician's work.
    complaint.verificationStatus = "Not Submitted";
    complaint.verifiedBy = null;
    complaint.verifiedAt = null;
    complaint.verificationRemarks = "";
    complaint.resolutionRemarks = "";
    complaint.completionImage = "";
    complaint.resolvedAt = null;

    // Audit history.
    complaint.auditHistory.push({
      action: previousTechnician
        ? "TECHNICIAN_REASSIGNED"
        : "TECHNICIAN_ASSIGNED",
      details: `Technician ${technician.name} assigned. Reason: ${reason.trim()}. Existing admin deadline: ${complaint.deadline.toISOString()}`,
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
      message: `A ${complaint.category} complaint in ${complaint.block}, Room ${complaint.room} has been assigned to you. Original resolution deadline: ${complaint.deadline.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}.`,
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
    const { deadlineHours, reason } = req.body;

    // Validate deadline hours
    const hours = Number(deadlineHours);

    if (!Number.isFinite(hours) || hours <= 0) {
      return res.status(400).json({
        message: "Please select a valid deadline in hours.",
      });
    }

    // Verify Admin
    const admin = await User.findById(req.user.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    // Only existing Admin deadlines can be edited
    if (!complaint.deadline) {
      return res.status(400).json({
        message: "This complaint does not have an admin-assigned deadline.",
      });
    }

    // Verify Admin block ownership
    const normalizeBlock = (block) =>
      String(block || "").trim().toLowerCase();

    const canManageBlock = (admin.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!canManageBlock) {
      return res.status(403).json({
        message: "You are not authorized to manage complaints for this block.",
      });
    }

    // Resolved or fake complaints cannot be updated
    if (complaint.status === "Resolved" || complaint.isFake) {
      return res.status(400).json({
        message: "Deadline cannot be changed for this complaint.",
      });
    }

    const changedAt = new Date();
    const previousDeadline = complaint.deadline;

    const newDeadline = new Date(
      changedAt.getTime() + hours * 60 * 60 * 1000
    );

    const deadlineReason =
      reason?.trim() ||
      `Admin updated the resolution deadline to ${hours} hours.`;

    // Save deadline history
    complaint.deadlineHistory.push({
      previousDeadline,
      newDeadline,
      reason: deadlineReason,
      changedBy: admin._id,
      changedAt,
    });

    // Update deadline
    complaint.deadline = newDeadline;
    complaint.deadlineSetBy = admin._id;
    complaint.deadlineReason = deadlineReason;
    complaint.deadlineVersion =
      (complaint.deadlineVersion || 0) + 1;

    // Audit history
    complaint.auditHistory.push({
      action: "DEADLINE_UPDATED",
      details: `Admin updated deadline to ${hours} hours. New deadline: ${newDeadline.toISOString()}. Reason: ${deadlineReason}`,
      performedBy: admin._id,
      performedAt: changedAt,
    });

    await complaint.save();

    // Notify assigned technician
    if (complaint.technician) {
      await createNotification({
        recipient: complaint.technician,
        title: "Complaint Deadline Updated",
        message: `The resolution deadline for your ${complaint.category} complaint in ${complaint.block}, Room ${complaint.room} has been updated to ${newDeadline.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}.`,
        type: "deadline_reminder",
        complaint: complaint._id,
      });
    }

    return res.json({
      message: "Complaint deadline updated successfully.",
      complaint: {
        _id: complaint._id,
        deadline: complaint.deadline,
        deadlineSetBy: complaint.deadlineSetBy,
        deadlineReason: complaint.deadlineReason,
        deadlineVersion: complaint.deadlineVersion,
        deadlineHistory: complaint.deadlineHistory,
      },
    });

  } catch (error) {
    console.error("SET COMPLAINT DEADLINE ERROR:", error);

    return res.status(500).json({
      message: "Failed to update complaint deadline.",
      error: error.message,
    });
  }
};



const verifyComplaint = async (req, res) => {
  try {
    const { decision, remarks } = req.body;

    // Validate decision.
    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        message: "Decision must be Approved or Rejected.",
      });
    }

    // Rejection reason is mandatory.
    if (decision === "Rejected" && !remarks?.trim()) {
      return res.status(400).json({
        message: "Rejection reason is required.",
      });
    }

    // Verify supervisor.
    const supervisor = await User.findById(req.user.userId);

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Supervisor access required.",
      });
    }

    // Find complaint.
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
        message: "You are not authorized to verify this complaint.",
      });
    }

    // Verify assigned block.
    const ownsBlock = (supervisor.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!ownsBlock) {
      return res.status(403).json({
        message: "Complaint does not belong to your assigned block.",
      });
    }

    // Prevent fake or already resolved complaints.
    if (complaint.isFake || complaint.status === "Resolved") {
      return res.status(400).json({
        message: "This complaint cannot be verified.",
      });
    }

    // Only pending submissions can be verified.
    if (
      complaint.verificationStatus !== "Pending" ||
      !complaint.completionImage ||
      !complaint.resolutionRemarks?.trim()
    ) {
      return res.status(400).json({
        message:
          "No complete technician submission is awaiting verification.",
      });
    }

    // Save verification details.
    complaint.verificationStatus = decision;
    complaint.verifiedBy = supervisor._id;
    complaint.verifiedAt = new Date();
    complaint.verificationRemarks = remarks?.trim() || "";

    if (decision === "Approved") {
      // Final approval.
      complaint.status = "Resolved";
      complaint.resolvedAt = new Date();

      complaint.auditHistory.push({
        action: "COMPLAINT_VERIFIED",
        details: remarks?.trim() || "Completion approved by supervisor.",
        performedBy: supervisor._id,
        performedAt: new Date(),
      });

    } else {
      // Return complaint to technician for corrections.
      complaint.status = "In Progress";
      complaint.resolvedAt = null;

      complaint.auditHistory.push({
        action: "COMPLETION_REJECTED",
        details: `Completion rejected. Reason: ${remarks.trim()}`,
        performedBy: supervisor._id,
        performedAt: new Date(),
      });
    }

    await complaint.save();

    // Send notifications after saving.
    if (decision === "Approved") {
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

    return res.status(200).json({
      message:
        decision === "Approved"
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
// DELETE RESOLVED COMPLAINT - SUPERVISOR ONLY
// ======================================================

const deleteComplaint = async (req, res) => {
  try {
    // Verify logged-in supervisor
    const supervisor = await User.findById(req.user.userId);

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    // Verify complaint ownership
    if (
      !complaint.supervisor ||
      complaint.supervisor.toString() !== supervisor._id.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to delete this complaint.",
      });
    }

    // Verify assigned block
    const ownsBlock = (supervisor.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) === normalizeBlock(complaint.block)
    );

    if (!ownsBlock) {
      return res.status(403).json({
        message: "Complaint does not belong to your assigned block.",
      });
    }

    // Only resolved complaints can be deleted
    if (complaint.status !== "Resolved") {
      return res.status(400).json({
        message: "Only resolved complaints can be deleted.",
      });
    }

    // Fake complaints cannot be deleted through this action
    if (complaint.isFake) {
      return res.status(400).json({
        message: "Fake complaints cannot be deleted.",
      });
    }

    // Atomically delete only if ownership and status still match
    const deletedComplaint = await Complaint.findOneAndDelete({
      _id: complaint._id,
      supervisor: supervisor._id,
      status: "Resolved",
      isFake: { $ne: true },
    });

    if (!deletedComplaint) {
      return res.status(409).json({
        message: "Complaint could not be deleted. Please refresh and try again.",
      });
    }

    return res.status(200).json({
      message: "Resolved complaint deleted successfully.",
      deletedComplaintId: deletedComplaint._id,
    });

  } catch (error) {
    console.error("DELETE COMPLAINT ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid complaint ID.",
      });
    }

    return res.status(500).json({
      message: "Failed to delete complaint.",
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
  deleteComplaint,
};
