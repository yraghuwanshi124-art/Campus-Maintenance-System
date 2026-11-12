
const Complaint = require("../models/Complaint");
const User = require("../models/User");

const {
  sendComplaintNotification,
  sendComplaintResolvedEmail,
} = require("../services/emailService");

const {
  createNotification,
} = require("../utils/notificationService");

// =====================================================
// CREATE COMPLAINT
// STUDENT → BLOCK ADMIN NOTIFICATION
// =====================================================

const createComplaint = async (req, res) => {
  try {
    const {
      block,
      floor,
      room,
      mobileNumber,
      category,
      description,
      priority,
      image,
    } = req.body;

    if (
      !block?.trim() ||
      !room?.trim() ||
      !category?.trim() ||
      !description?.trim() ||
      !image
    ) {
      return res.status(400).json({
        message:
          "Block, room, category, description and complaint photo are required.",
      });
    }

    const trimmedMobile = mobileNumber?.toString().trim();

    if (!trimmedMobile || !/^[0-9]{10}$/.test(trimmedMobile)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // =================================================
    // CHECK DUPLICATE ACTIVE COMPLAINT
    // =================================================

    const existingComplaint = await Complaint.findOne({
      block: block.trim(),
      room: room.trim(),
      category: category.trim(),
      status: {
        $in: ["Pending", "Assigned", "In Progress"],
      },
    })
      .populate(
        "user",
        "name email enrollmentNumber department semester classSection"
      )
      .populate("technician", "name email");

    if (existingComplaint) {
      const currentUserId = req.user.userId.toString();

      const isOriginalReporter =
        existingComplaint.user?._id?.toString() === currentUserId;

      const hasAlreadySupported =
        existingComplaint.supporters?.some(
          (supporterId) =>
            supporterId.toString() === currentUserId
        );

      return res.status(409).json({
        message: "A similar active complaint already exists.",
        duplicate: true,
        alreadyReported: isOriginalReporter,
        alreadySupported: hasAlreadySupported,
        complaint: existingComplaint,
      });
    }

    // =================================================
    // FIND ADMIN ASSIGNED TO THIS BLOCK
    // =================================================

    const blockAdmin = await User.findOne({
      role: "admin",
      assignedBlocks: block.trim(),
    });

    if (!blockAdmin) {
      return res.status(400).json({
        message: `No admin is assigned to ${block.trim()}.`,
      });
    }

    // =================================================
    // CREATE COMPLAINT
    // =================================================

    const complaint = await Complaint.create({
      user: req.user.userId,
      admin: blockAdmin._id,
      block: block.trim(),
      floor: floor ? floor.trim() : "",
      room: room.trim(),
      mobileNumber: trimmedMobile,
      category: category.trim(),
      description: description.trim(),
      priority,
      image,
      supporters: [],
    });

    // =================================================
    // EMAIL NOTIFICATION → ADMIN
    // =================================================

    await sendComplaintNotification(complaint);

    // =================================================
    // IN-APP NOTIFICATION → BLOCK ADMIN
    // =================================================

    await createNotification({
      recipient: blockAdmin._id,
      title: "New Complaint Received",
      message: `A new ${complaint.category} complaint has been reported in ${complaint.block}, Room ${complaint.room}.`,
      type: "complaint_created",
      complaint: complaint._id,
    });

    res.status(201).json({
      message: "Complaint created successfully",
      duplicate: false,
      complaint,
    });
  } catch (error) {
    console.log("Create complaint error:", error);

    res.status(500).json({
      message: "Failed to create complaint",
      error: error.message,
    });
  }
};

// =====================================================
// SUPPORT EXISTING COMPLAINT
// =====================================================

const supportComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      status: {
        $in: ["Pending", "Assigned", "In Progress"],
      },
    });

    if (!complaint) {
      return res.status(404).json({
        message: "Active complaint not found",
      });
    }

    const userId = req.user.userId.toString();

    if (complaint.user.toString() === userId) {
      return res.status(400).json({
        message:
          "You are already the original reporter of this complaint",
      });
    }

    const alreadySupported = complaint.supporters?.some(
      (supporterId) =>
        supporterId.toString() === userId
    );

    if (alreadySupported) {
      return res.status(400).json({
        message: "You have already supported this complaint",
      });
    }

    complaint.supporters.push(req.user.userId);

    await complaint.save();

    const updatedComplaint = await Complaint.findById(
      complaint._id
    )
      .populate(
        "user",
        "name email enrollmentNumber department semester classSection"
      )
      .populate("technician", "name email")
      .populate(
        "supporters",
        "name email enrollmentNumber department semester classSection"
      );

    res.json({
      message: "Complaint supported successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.log("Support complaint error:", error);

    res.status(500).json({
      message: "Failed to support complaint",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY COMPLAINTS
// =====================================================

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      user: req.user.userId,
    })
      .populate(
        "user",
        "name email enrollmentNumber department semester classSection"
      )
      .populate("admin", "name email assignedBlocks")
      .populate("technician", "name email")
      .populate(
        "supporters",
        "name email enrollmentNumber department semester classSection"
      )
      .sort({ createdAt: -1 });

    res.json({
      complaints,
    });
  } catch (error) {
    console.error("GET MY COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};

// =====================================================
// GET ASSIGNED COMPLAINTS - TECHNICIAN
// =====================================================

const getAssignedComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      technician: req.user.userId,
    })
      .populate("user", "name email classSection")
      .populate("admin", "name email assignedBlocks")
      .populate(
        "supporters",
        "name email enrollmentNumber department semester classSection"
      )
      .sort({ createdAt: -1 });

    res.json({
      complaints,
    });
  } catch (error) {
    console.error("GET ASSIGNED COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch assigned complaints",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL COMPLAINTS - ADMIN
// =====================================================

const getAllComplaints = async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only.",
      });
    }

    const complaints = await Complaint.find({
      block: {
        $in: admin.assignedBlocks || [],
      },
    })
      .populate(
        "user",
        "name email enrollmentNumber department semester classSection"
      )
      .populate("admin", "name email assignedBlocks")
      .populate("technician", "name email")
      .populate(
        "supporters",
        "name email enrollmentNumber department semester classSection"
      )
      .sort({
        createdAt: -1,
      });

    res.json({
      complaints,
    });
  } catch (error) {
    console.error("GET ADMIN COMPLAINTS ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE COMPLAINT STATUS
// TECHNICIAN → RESOLVED → STUDENT NOTIFICATION
// =====================================================

const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "In Progress",
      "Resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const complaint = await Complaint.findOneAndUpdate(
      {
        _id: req.params.id,
        technician: req.user.userId,
      },
      {
        status,
        ...(status === "Resolved" && {
          resolvedAt: new Date(),
        }),
      },
      {
        new: true,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    // =================================================
    // COMPLAINT RESOLVED
    // =================================================

    if (status === "Resolved") {
      await sendComplaintResolvedEmail(complaint);

      await createNotification({
        recipient: complaint.user,
        title: "Complaint Resolved",
        message: `Your ${complaint.category} complaint for ${complaint.block}, Room ${complaint.room} has been resolved.`,
        type: "complaint_resolved",
        complaint: complaint._id,
      });
    }

    res.json({
      message: "Complaint status updated",
      complaint,
    });
  } catch (error) {
    console.error("UPDATE COMPLAINT STATUS ERROR:", error);

    res.status(500).json({
      message: "Failed to update complaint status",
      error: error.message,
    });
  }
};

// =====================================================
// ASSIGN COMPLAINT
// ADMIN → COMMON SUPERVISOR
//
// IMPORTANT:
// There is now ONE COMMON SUPERVISOR for the campus.
// Any Admin can assign a complaint from their authorized
// block to this common Supervisor.
//
// Example:
// A Admin → Common Supervisor
// B Admin → Common Supervisor
// C Admin → Common Supervisor
// V Admin → Common Supervisor
// =====================================================



const assignComplaint = async (req, res) => {
  try {
    const { supervisorId } = req.body;

    if (!supervisorId) {
      return res.status(400).json({
        message: "Please select a supervisor",
      });
    }

    const existingComplaint = await Complaint.findById(req.params.id);

    if (!existingComplaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    const admin = await User.findById(req.user.userId);

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({
        message: "Only an admin can assign complaints",
      });
    }

    const normalizeBlock = (block) =>
      String(block || "").trim().toLowerCase();

    const canManageBlock = (admin.assignedBlocks || []).some(
      (block) =>
        normalizeBlock(block) ===
        normalizeBlock(existingComplaint.block)
    );

    if (!canManageBlock) {
      return res.status(403).json({
        message: "You are not authorized to manage complaints for this block",
      });
    }

    if (existingComplaint.status === "Resolved") {
      return res.status(400).json({
        message: "Resolved complaints cannot be reassigned",
      });
    }

    // Find the selected supervisor
    const supervisor = await User.findOne({
      _id: supervisorId,
      role: "supervisor",
    }).select("name email assignedBlocks");

    if (!supervisor) {
      return res.status(404).json({
        message: "Supervisor not found",
      });
    }

    const supervisorBlocks = supervisor.assignedBlocks || [];

    // Only single-block supervisors can receive new assignments
    if (supervisorBlocks.length !== 1) {
      return res.status(403).json({
        message: "Common legacy supervisors cannot receive new complaint assignments",
      });
    }

    // Verify supervisor belongs to the complaint's block
    const belongsToBlock =
      normalizeBlock(supervisorBlocks[0]) ===
      normalizeBlock(existingComplaint.block);

    if (!belongsToBlock) {
      return res.status(403).json({
        message: "Selected supervisor does not belong to this complaint's block",
      });
    }

    // Assign complaint
    existingComplaint.supervisor = supervisor._id;
    existingComplaint.technician = null;
    existingComplaint.status = "Assigned";
    existingComplaint.assignedAt = new Date();
    existingComplaint.technicianAssignedAt = null;

    await existingComplaint.save();

    // Notify supervisor
    await createNotification({
      recipient: supervisor._id,
      title: "New Complaint Assigned",
      message: `A ${existingComplaint.category} complaint from ${existingComplaint.block}, Room ${existingComplaint.room} has been assigned to you.`,
      type: "supervisor_assigned",
      complaint: existingComplaint._id,
    });

    return res.json({
      message: "Complaint assigned to block supervisor successfully.",
      complaint: {
        _id: existingComplaint._id,
        block: existingComplaint.block,
        floor: existingComplaint.floor,
        room: existingComplaint.room,
        category: existingComplaint.category,
        description: existingComplaint.description,
        image: existingComplaint.image,
        priority: existingComplaint.priority,
        status: existingComplaint.status,
        supervisor: {
          _id: supervisor._id,
          name: supervisor.name,
          email: supervisor.email,
          assignedBlocks: supervisor.assignedBlocks,
        },
        technician: null,
        createdAt: existingComplaint.createdAt,
        assignedAt: existingComplaint.assignedAt,
        technicianAssignedAt: null,
        resolvedAt: existingComplaint.resolvedAt,
      },
    });
  } catch (error) {
    console.log("Assign Complaint Error:", error);

    return res.status(500).json({
      message: "Server error while assigning complaint",
    });
  }
};



// =====================================================
// DELETE COMPLAINT
// =====================================================

const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    await Complaint.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Complaint deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete complaint",
      error: error.message,
    });
  }
};

// =====================================================
// UPLOAD COMPLETION PHOTO
// =====================================================

const uploadCompletionPhoto = async (req, res) => {
  try {
    const { completionImage } = req.body;

    if (!completionImage) {
      return res.status(400).json({
        message: "Completion photo is required",
      });
    }

    const complaint = await Complaint.findOneAndUpdate(
      {
        _id: req.params.id,
        technician: req.user.userId,
      },
      {
        completionImage,
      },
      {
        new: true,
      }
    );

    if (!complaint) {
      return res.status(404).json({
        message:
          "Complaint not found or not assigned to you",
      });
    }

    res.json({
      message:
        "Completion photo uploaded successfully",
      complaint,
    });
  } catch (error) {
    console.log("Completion photo error:", error);

    res.status(500).json({
      message:
        "Failed to upload completion photo",
      error: error.message,
    });
  }
};

// =====================================================
// SUBMIT FEEDBACK
// =====================================================

const submitFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const complaint = await Complaint.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    if (complaint.status !== "Resolved") {
      return res.status(400).json({
        message:
          "Feedback can be given only after complaint is resolved",
      });
    }

    if (complaint.feedbackRating) {
      return res.status(400).json({
        message:
          "Feedback has already been submitted",
      });
    }

    complaint.feedbackRating =
      Number(rating);

    complaint.feedbackComment =
      comment?.trim() || "";

    await complaint.save();

    res.json({
      message: "Feedback submitted successfully",
      complaint,
    });
  } catch (error) {
    console.log("Submit feedback error:", error);

    res.status(500).json({
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createComplaint,
  supportComplaint,
  getMyComplaints,
  getAllComplaints,
  getAssignedComplaints,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
  uploadCompletionPhoto,
  submitFeedback,
};
