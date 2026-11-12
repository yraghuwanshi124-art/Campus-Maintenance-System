
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// =====================================================
// GET TECHNICIANS
// SUPERVISOR CAN SEE ONLY THEIR OWN TECHNICIANS
// =====================================================

const getTechnicians = async (req, res) => {
  try {
    const supervisor = await User.findById(
      req.user.userId
    ).select("role assignedBlocks");

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    const technicians = await User.find({
      role: "technician",
      createdBySupervisor: supervisor._id,
    }).select("name email specialization assignedBlocks");

    return res.json({
      technicians,
    });
  } catch (error) {
    console.error("GET TECHNICIANS ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch technicians.",
      error: error.message,
    });
  }
};

// =====================================================
// ADD NEW TECHNICIAN
// TECHNICIAN BELONGS TO THE CREATING SUPERVISOR
// =====================================================

const createTechnician = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
    } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        message:
          "Name, email, password and specialization are required.",
      });
    }

    const supervisor = await User.findById(
      req.user.userId
    ).select("role assignedBlocks");

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    // Each supervisor must belong to exactly one block.
    if (
      !Array.isArray(supervisor.assignedBlocks) ||
      supervisor.assignedBlocks.length !== 1
    ) {
      return res.status(403).json({
        message:
          "You must be assigned to exactly one block to create technicians.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const technician = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "technician",
      specialization,
      assignedBlocks: supervisor.assignedBlocks,
      createdBySupervisor: supervisor._id,
      classSection: "Staff",
      isVerified: true,
      registrationEmailVerified: true,
    });

    return res.status(201).json({
      message: "Technician created successfully.",
      technician: {
        _id: technician._id,
        name: technician.name,
        email: technician.email,
        specialization: technician.specialization,
        assignedBlocks: technician.assignedBlocks,
      },
    });
  } catch (error) {
    console.error("CREATE TECHNICIAN ERROR:", error);

    return res.status(500).json({
      message: "Failed to create technician.",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE TECHNICIAN
// SUPERVISOR CAN DELETE ONLY THEIR OWN TECHNICIANS
// =====================================================

const deleteTechnician = async (req, res) => {
  try {
    const supervisor = await User.findById(
      req.user.userId
    ).select("role");

    if (!supervisor || supervisor.role !== "supervisor") {
      return res.status(403).json({
        message: "Access denied. Supervisor only.",
      });
    }

    const technician = await User.findOne({
      _id: req.params.id,
      role: "technician",
      createdBySupervisor: supervisor._id,
    });

    if (!technician) {
      return res.status(404).json({
        message:
          "Technician not found or you do not have permission to delete this technician.",
      });
    }

    await User.findByIdAndDelete(technician._id);

    return res.json({
      message: "Technician deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE TECHNICIAN ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete technician.",
      error: error.message,
    });
  }
};

module.exports = {
  getTechnicians,
  createTechnician,
  deleteTechnician,
};
