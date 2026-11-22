
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const changeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const admin = await User.findOne({
      email: "admin@test.com",
    }).select("+password");

    if (!admin) {
      console.log("Admin account not found");
      process.exit(1);
    }

    // ================= NEW ADMIN DETAILS =================

    const newEmail = "yashraghuwanshi32@gmail.com";
    const newPassword = "admin123";

    // ================= HASH PASSWORD =================

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // ================= UPDATE DIRECTLY =================

    await User.updateOne(
      { _id: admin._id },
      {
        $set: {
          email: newEmail.trim().toLowerCase(),
          password: hashedPassword,
        },
      }
    );

    console.log("Admin email updated successfully");
    console.log("Admin password updated successfully");

    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
};

changeAdmin();
