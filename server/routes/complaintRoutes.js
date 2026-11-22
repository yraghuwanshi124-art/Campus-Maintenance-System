
const express = require("express");

const {
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
  markComplaintAsFake,
  getFakeComplaints,
} = require("../controllers/complaintController");

const protect = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Create complaint
router.post("/", protect, allowRoles("student"), createComplaint);

// Get student's complaints
router.get("/my", protect, allowRoles("student"), getMyComplaints);

// Support an existing active complaint
router.post(
  "/:id/support",
  protect,
  allowRoles("student"),
  supportComplaint
);

// Submit feedback
router.post(
  "/:id/feedback",
  protect,
  allowRoles("student"),
  submitFeedback
);

// Get fake complaints - Admin
router.get(
  "/fake",
  protect,
  allowRoles("admin"),
  getFakeComplaints
);

// Mark complaint as fake - Admin
router.patch(
  "/:id/fake",
  protect,
  allowRoles("admin"),
  markComplaintAsFake
);



// Get all complaints - Admin
router.get(
  "/all",
  protect,
  allowRoles("admin"),
  getAllComplaints
);

// Get assigned complaints - Technician
router.get(
  "/assigned",
  protect,
  allowRoles("technician"),
  getAssignedComplaints
);

// Update complaint status - Technician
router.patch(
  "/:id/status",
  protect,
  allowRoles("technician"),
  updateComplaintStatus
);

// Upload completion photo - Technician
router.patch(
  "/:id/completion-photo",
  protect,
  allowRoles("technician"),
  uploadCompletionPhoto
);

// Assign complaint - Admin
router.patch(
  "/:id/assign",
  protect,
  allowRoles("admin"),
  assignComplaint
);

// Delete complaint
router.delete(
  "/:id",
  protect,
  allowRoles("student", "admin", "technician"),
  deleteComplaint
);

module.exports = router;
