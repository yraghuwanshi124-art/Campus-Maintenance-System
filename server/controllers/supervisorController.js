
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const bcrypt = require("bcryptjs");

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
    const supervisor = await User.findById(
      req.user.userId
    ).select("role assignedBlocks");

    if (
      !supervisor ||
      supervisor.role !== "supervisor"
    ) {
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

    return res.json({
      technicians,
    });
  } catch (error) {
    console.error(
      "GET TECHNICIANS FOR SUPERVISOR ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch technicians.",
      error: error.message,
    });
  }
};


// ======================================================
// ASSIGN TECHNICIAN - SUPERVISOR ONLY
// ======================================================

const assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        message: "Technician ID is required.",
      });
    }

    // ----------------------------------------------
    // VERIFY SUPERVISOR
    // ----------------------------------------------

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

    // ----------------------------------------------
    // FIND COMPLAINT
    // ----------------------------------------------

    const complaint = await Complaint.findById(
      req.params.id
    );

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    // ----------------------------------------------
    // CHECK SUPERVISOR OWNERSHIP
    // ----------------------------------------------

    if (
      !complaint.supervisor ||
      complaint.supervisor.toString() !==
        supervisor._id.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to manage this complaint.",
      });
    }

    // Also verify that the complaint belongs to
    // the supervisor's assigned block.
    const supervisorOwnsComplaintBlock =
      (supervisor.assignedBlocks || []).some(
        (assignedBlock) =>
          normalizeBlock(assignedBlock) ===
          normalizeBlock(complaint.block)
      );

    if (!supervisorOwnsComplaintBlock) {
      return res.status(403).json({
        message:
          "This complaint does not belong to your assigned block.",
      });
    }

    // ----------------------------------------------
    // RESOLVED COMPLAINT CHECK
    // ----------------------------------------------

    if (complaint.status === "Resolved") {
      return res.status(400).json({
        message:
          "Resolved complaint cannot be assigned again.",
      });
    }

    // ----------------------------------------------
    // FIND REQUIRED SPECIALIZATION
    // ----------------------------------------------

    
// ----------------------------------------------
// FIND ONLY THIS SUPERVISOR'S TECHNICIAN
// ----------------------------------------------

const technician = await User.findOne({
  _id: technicianId,
  role: "technician",
  createdBySupervisor: supervisor._id,
}).select(
  "name email specialization assignedBlocks"
);

if (!technician) {
  return res.status(403).json({
    message:
      "You are not authorized to assign this technician.",
  });
}

// ----------------------------------------------
// CHECK TECHNICIAN BLOCK
// ----------------------------------------------

const technicianOwnsComplaintBlock =
  (technician.assignedBlocks || []).some(
    (assignedBlock) =>
      normalizeBlock(assignedBlock) ===
      normalizeBlock(complaint.block)
  );

if (!technicianOwnsComplaintBlock) {
  return res.status(403).json({
    message:
      "This technician does not belong to the complaint's block.",
  });
}

// ----------------------------------------------
// CHECK REQUIRED SPECIALIZATION
// ----------------------------------------------

if (
  requiredSpecialization &&
  technician.specialization !== requiredSpecialization
) {
  return res.status(400).json({
    message:
      `Please select a technician qualified for ${complaint.category} complaints.`,
  });
}


    // ----------------------------------------------
    // ASSIGN TECHNICIAN
    // ----------------------------------------------

    complaint.technician = technician._id;
    complaint.status = "Assigned";
    complaint.technicianAssignedAt = new Date();

    await complaint.save();

    // ----------------------------------------------
    // NOTIFY TECHNICIAN
    // ----------------------------------------------

    await createNotification({
      recipient: technician._id,
      title: "New Complaint Assigned",

      message:
        `A ${complaint.category} complaint in ${complaint.block}, Room ${complaint.room} has been assigned to you.`,

      type: "technician_assigned",
      complaint: complaint._id,
    });

    // ----------------------------------------------
    // RESPONSE
    // ----------------------------------------------

    return res.json({
      message:
        "Complaint assigned to technician successfully.",

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

        createdAt: complaint.createdAt,
        assignedAt: complaint.assignedAt,
        technicianAssignedAt:
          complaint.technicianAssignedAt,
        resolvedAt: complaint.resolvedAt,
      },
    });
  } catch (error) {
    console.error(
      "ASSIGN TECHNICIAN ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to assign technician.",
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
};
