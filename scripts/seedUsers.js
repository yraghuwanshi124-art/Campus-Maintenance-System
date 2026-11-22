const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../server/models/User");

const defaultUsers = [
  {
    name: "System Administrator",
    email: "admin@medicaps.ac.in",
    passwordRaw: "Admin@123",
    role: "admin",
    isVerified: true,
    registrationEmailVerified: true,
    classSection: "N/A",
  },
  {
    name: "Admin Test",
    email: "admin@test.com",
    passwordRaw: "admin123",
    role: "admin",
    isVerified: true,
    registrationEmailVerified: true,
    classSection: "N/A",
  },
  {
    name: "Maintenance Supervisor",
    email: "supervisor@medicaps.ac.in",
    passwordRaw: "Supervisor@123",
    role: "supervisor",
    isVerified: true,
    registrationEmailVerified: true,
    classSection: "N/A",
    assignedBlocks: ["A", "B", "C"],
  },
  {
    name: "Campus Electrician",
    email: "tech@medicaps.ac.in",
    passwordRaw: "Tech@123",
    role: "technician",
    specialization: "Electrician",
    isVerified: true,
    registrationEmailVerified: true,
    classSection: "N/A",
  },
  {
    name: "Campus Plumber",
    email: "plumber@medicaps.ac.in",
    passwordRaw: "Plumber@123",
    role: "technician",
    specialization: "Plumber",
    isVerified: true,
    registrationEmailVerified: true,
    classSection: "N/A",
  },
  {
    name: "Rahul Sharma",
    email: "student@medicaps.ac.in",
    passwordRaw: "Student@123",
    role: "student",
    enrollmentNumber: "EN20240001",
    phoneNumber: "9876543210",
    department: "Computer Science",
    branch: "CSE",
    semester: 4,
    classSection: "CSE-A",
    isVerified: true,
    registrationEmailVerified: true,
  },
];

async function seedDefaultUsers() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`Database already has ${userCount} users. Seeding skipped.`);
      return;
    }

    console.log("No users found in database. Seeding default demo accounts...");

    for (const u of defaultUsers) {
      const hashedPassword = await bcrypt.hash(u.passwordRaw, 10);
      const { passwordRaw, ...userData } = u;
      await User.create({
        ...userData,
        password: hashedPassword,
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    }

    console.log("Default accounts seeded successfully!");
  } catch (error) {
    console.error("Error seeding default users:", error);
  }
}

if (require.main === module) {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusfix";
  mongoose.connect(uri).then(async () => {
    await seedDefaultUsers();
    process.exit(0);
  }).catch((err) => {
    console.error("Connection failed:", err);
    process.exit(1);
  });
}

module.exports = seedDefaultUsers;
