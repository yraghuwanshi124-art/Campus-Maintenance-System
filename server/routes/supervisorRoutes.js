
const express = require("express");

const {
  createSupervisor,
  getSupervisors,
  updateSupervisor,
  getSupervisorComplaints,
  getTechniciansForSupervisor,
  assignTechnician,
  verifyComplaint,
  setComplaintDeadline,
  deleteComplaint,
} = require("../controllers/supervisorController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// ADMIN
// =====================================================

// Create supervisor
router.post(
  "/create",
  protect,
  allowRoles("admin"),
  createSupervisor
);

// Get supervisors belonging to admin's blocks
router.get(
  "/",
  protect,
  allowRoles("admin"),
  getSupervisors
);

// Edit supervisor
router.put(
  "/:id",
  protect,
  allowRoles("admin"),
  updateSupervisor
);
// Admin updates complaint deadline
router.patch(
  "/complaints/:id/deadline",
  protect,
  allowRoles("admin"),
  setComplaintDeadline
);

// =====================================================
// SUPERVISOR
// =====================================================

// Get complaints assigned to logged-in supervisor
router.get(
  "/complaints",
  protect,
  allowRoles("supervisor"),
  getSupervisorComplaints
);

// Get technicians available to logged-in supervisor
router.get(
  "/technicians",
  protect,
  allowRoles("supervisor"),
  getTechniciansForSupervisor
);

// Assign technician to complaint
router.patch(
  "/complaints/:id/assign-technician",
  protect,
  allowRoles("supervisor"),
  assignTechnician
);

// Delete only resolved complaints assigned to logged-in supervisor
router.delete(
  "/complaints/:id",
  protect,
  allowRoles("supervisor"),
  deleteComplaint
);


router.patch(
  "/complaints/:id/verify",
  protect,
  allowRoles("supervisor"),
  verifyComplaint
);

module.exports = router;
