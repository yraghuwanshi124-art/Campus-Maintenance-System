
const cron = require("node-cron");

const Complaint = require("../models/Complaint");
const { createNotification } = require("../utils/notificationService");

const ONE_HOUR = 60 * 60 * 1000;

let isRunning = false;

const sendReminder = async ({
  complaint,
  recipient,
  reminderType,
  title,
  message,
}) => {
  if (!recipient) return;

  const version = complaint.deadlineVersion || 0;

  // Same reminder cannot be sent twice for the same deadline version.
  const reminderKey = [
    complaint._id.toString(),
    version,
    reminderType,
    recipient.toString(),
  ].join(":");

  // Atomically reserve this reminder before sending it.
  const reservation = await Complaint.updateOne(
    {
      _id: complaint._id,
      status: { $ne: "Resolved" },
      isFake: false,
      deadline: complaint.deadline,
      deadlineVersion: version,
      "reminderHistory.reminderKey": { $ne: reminderKey },
    },
    {
      $push: {
        reminderHistory: {
          reminderKey,
          reminderType,
          recipient,
          sentAt: new Date(),
        },
      },
    }
  );

  if (reservation.modifiedCount === 0) return;

  const notification = await createNotification({
    recipient,
    title,
    message,
    type:
      reminderType === "overdue"
        ? "overdue_escalation"
        : "deadline_reminder",
    complaint: complaint._id,
  });

  // If notification creation fails, allow a future retry.
  if (!notification) {
    await Complaint.updateOne(
      { _id: complaint._id },
      {
        $pull: {
          reminderHistory: { reminderKey },
        },
      }
    );
  }
};

const processComplaint = async (complaint) => {
  const now = Date.now();
  const deadlineTime = new Date(complaint.deadline).getTime();

  if (!Number.isFinite(deadlineTime)) return;

  const remainingTime = deadlineTime - now;

  const recipients = [
    complaint.technician,
    complaint.supervisor,
  ].filter(Boolean);

  // Deadline has passed: notify supervisor only.
  if (remainingTime <= 0) {
    await sendReminder({
      complaint,
      recipient: complaint.supervisor,
      reminderType: "overdue",
      title: "Complaint Deadline Overdue",
      message: `Complaint ${complaint._id} has crossed its resolution deadline. Please review and take action.`,
    });

    return;
  }

  // Between 24 hours and 2 hours before deadline.
  if (remainingTime <= 24 * ONE_HOUR &&
      remainingTime > 2 * ONE_HOUR) {
    for (const recipient of recipients) {
      await sendReminder({
        complaint,
        recipient,
        reminderType: "24_hours",
        title: "Resolution Deadline Approaching",
        message: `Complaint ${complaint._id} is approaching its resolution deadline. Please complete the required work on time.`,
      });
    }

    return;
  }

  // Within the final 2 hours before deadline.
  if (remainingTime <= 2 * ONE_HOUR && remainingTime > 0) {
    for (const recipient of recipients) {
      await sendReminder({
        complaint,
        recipient,
        reminderType: "2_hours",
        title: "Urgent: Deadline in 2 Hours",
        message: `Complaint ${complaint._id} must be resolved within the next 2 hours. Please take immediate action.`,
      });
    }
  }
};

const checkDeadlines = async () => {
  if (isRunning) return;

  isRunning = true;

  try {
    const complaints = await Complaint.find({
      isFake: false,
      status: { $ne: "Resolved" },
      deadline: { $ne: null },
      supervisor: { $ne: null },
    }).select(
      "_id deadline deadlineVersion supervisor technician status isFake"
    );

    for (const complaint of complaints) {
      try {
        await processComplaint(complaint);
      } catch (error) {
        console.error(
          `Reminder error for complaint ${complaint._id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("DEADLINE SCHEDULER ERROR:", error);
  } finally {
    isRunning = false;
  }
};

const startReminderScheduler = () => {
  console.log("Deadline reminder scheduler started.");

  // Check once immediately when the server starts.
  checkDeadlines();

  // Then check every 5 minutes.
  cron.schedule("*/5 * * * *", () => {
    checkDeadlines();
  });
};

module.exports = {
  startReminderScheduler,
  checkDeadlines,
};
