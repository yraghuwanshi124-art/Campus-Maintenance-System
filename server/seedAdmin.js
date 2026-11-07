const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB");

    const email = "admin@medicaps.ac.in";
    const password = "admin123";

    // Check if admin already exists
    let admin = await User.findOne({ email: email.toLowerCase() });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (admin) {
      admin.password = hashedPassword;
      admin.role = "admin";
      admin.isVerified = true;
      admin.registrationEmailVerified = true;
      admin.assignedBlocks = ["Block A", "Block B", "Block C", "Block D"];
      await admin.save();
      console.log(`Admin account '${email}' updated successfully with password: ${password}`);
    } else {
      admin = await User.create({
        name: "Campus Administrator",
        email: email.toLowerCase(),
        phoneNumber: "9876543210",
        password: hashedPassword,
        role: "admin",
        assignedBlocks: ["Block A", "Block B", "Block C", "Block D"],
        classSection: "ADMIN",
        isVerified: true,
        registrationEmailVerified: true,
      });
      console.log(`Admin account '${email}' created successfully with password: ${password}`);
    }

    // Also support admin@test.com for convenience
    let testAdmin = await User.findOne({ email: "admin@test.com" });
    if (!testAdmin) {
      await User.create({
        name: "Test Administrator",
        email: "admin@test.com",
        phoneNumber: "9876543211",
        password: hashedPassword,
        role: "admin",
        assignedBlocks: ["Block A", "Block B", "Block C", "Block D"],
        classSection: "ADMIN",
        isVerified: true,
        registrationEmailVerified: true,
      });
      console.log(`Fallback admin 'admin@test.com' created with password: ${password}`);
    } else {
      testAdmin.password = hashedPassword;
      testAdmin.role = "admin";
      testAdmin.isVerified = true;
      await testAdmin.save();
      console.log(`Fallback admin 'admin@test.com' updated with password: ${password}`);
    }

  } catch (error) {
    console.error("Error seeding admin:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAdmin();

