const mongoose = require("mongoose");
const { startReminderScheduler } = require("./services/reminderScheduler");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/campusfix";

    cached.promise = mongoose
      .connect(uri)
      .then(async (mongooseInstance) => {
        console.log("MongoDB connected successfully");

        // Seed default accounts if database is empty
        try {
          const seedDefaultUsers = require("../scripts/seedUsers");
          await seedDefaultUsers();
        } catch (seedErr) {
          console.warn("User seeding skipped:", seedErr.message);
        }

        // Start background scheduler in persistent dev mode (on Vercel, Vercel Cron is used)
        if (typeof window === "undefined" && !process.env.VERCEL && !global._schedulerStarted) {
          try {
            startReminderScheduler();
            global._schedulerStarted = true;
          } catch (e) {
            console.warn("Scheduler start skipped:", e.message);
          }
        }

        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

module.exports = connectToDatabase;
