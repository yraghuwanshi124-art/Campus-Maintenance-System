
// const dns = require("dns");
// dns.setServers(["8.8.8.8", "1.1.1.1"]);

// require("dotenv").config();

// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const User = require("./models/User");

// async function createTestAdmin() {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB connected");

//     const email = "admin.e.test@campusfix.com";

//     const existing = await User.findOne({ email });

//     if (existing) {
//       console.log("This email already exists. No account created.");
//       return;
//     }

//     const hashedPassword = await bcrypt.hash("admin123", 10);

//     const admin = await User.create({
//       name: "E Block Test Admin",
//       email,
//       phoneNumber: "9876543210",
//       password: hashedPassword,
//       role: "admin",
//       assignedBlocks: ["E Block"],
//       classSection: "ADMIN",
//       isVerified: true,
//       registrationEmailVerified: true,
//     });

//     console.log("TEST ADMIN CREATED SUCCESSFULLY!");
//     console.log("Email:", admin.email);
//     console.log("Assigned Block:", admin.assignedBlocks);
//   } catch (error) {
//     console.error("ERROR:", error.message);
//   } finally {
//     await mongoose.disconnect();
//   }
// }

// createTestAdmin();



// A Block

const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createTestAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const email = "admin.a.test@campusfix.com";

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("This email already exists. No account created.");
      return;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);

    const admin = await User.create({
      name: "A Block Test Admin",
      email,
      phoneNumber: "9876543211",
      password: hashedPassword,
      role: "admin",
      assignedBlocks: ["A Block"],
      classSection: "ADMIN",
      isVerified: true,
      registrationEmailVerified: true,
    });

    console.log("TEST ADMIN CREATED SUCCESSFULLY!");
    console.log("Email:", admin.email);
    console.log("Assigned Block:", admin.assignedBlocks);
  } catch (error) {
    console.error("ERROR:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestAdmin();