
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP CONNECTION ERROR:", error);
  } else {
    console.log("SMTP SERVER READY");
  }
});

// console.log("EMAIL_USER:", process.env.EMAIL_USER);
// console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
// console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL);
// console.log("EMAIL_PASS length:", process.env.EMAIL_PASS?.length);
// ================= NEW COMPLAINT NOTIFICATION =================

const sendComplaintNotification = async (complaint) => {
  try {
    await transporter.sendMail({
      from: `"CampusFix" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "New Maintenance Complaint - CampusFix",

      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New Maintenance Complaint</h2>

          <p>A new complaint has been submitted to CampusFix.</p>

          <hr />

          <p><strong>Block:</strong> ${complaint.block}</p>
          ${complaint.floor ? `<p><strong>Floor:</strong> ${complaint.floor}</p>` : ""}
          <p><strong>Room:</strong> ${complaint.room}</p>
          ${complaint.mobileNumber ? `<p><strong>Student Contact:</strong> ${complaint.mobileNumber}</p>` : ""}
          <p><strong>Category:</strong> ${complaint.category}</p>
          <p><strong>Priority:</strong> ${complaint.priority}</p>

          <p>
            <strong>Description:</strong><br />
            ${complaint.description}
          </p>

          <hr />

          <p>
            Please login to the CampusFix Admin Dashboard
            to view and manage this complaint.
          </p>
        </div>
      `,
    });

    console.log("Complaint notification email sent successfully");
  } catch (error) {
    console.log("Email notification failed:", error.message);
  }
};

// ================= TECHNICIAN ASSIGNMENT =================

const sendTechnicianAssignmentEmail = async (complaint, technician) => {
  try {
    // console.log("Technician email:", process.env.TECHNICIAN_EMAIL);

    await transporter.sendMail({
      from: `"CampusFix" <${process.env.EMAIL_USER}>`,
      to: process.env.TECHNICIAN_EMAIL,
      subject: "New Complaint Assigned - CampusFix",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">

          <h2 style="color: #4f46e5;">
            New Complaint Assigned
          </h2>

          <p>Hello <strong>${technician.name}</strong>,</p>

          <p>
            A new maintenance complaint has been assigned to you
            by the administrator.
          </p>

          <hr />

          <p><strong>Block:</strong> ${complaint.block}</p>
          ${complaint.floor ? `<p><strong>Floor:</strong> ${complaint.floor}</p>` : ""}
          <p><strong>Room:</strong> ${complaint.room}</p>
          ${complaint.mobileNumber ? `<p><strong>Student Contact:</strong> ${complaint.mobileNumber}</p>` : ""}
          <p><strong>Category:</strong> ${complaint.category}</p>
          <p><strong>Priority:</strong> ${complaint.priority}</p>

          <p>
            <strong>Description:</strong><br />
            ${complaint.description}
          </p>

          <hr />

          <a
            href="http://localhost:5173/"
            style="
              display: inline-block;
              padding: 12px 22px;
              background-color: #4f46e5;
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
            "
          >
            Go to Technician Login
          </a>

          <p style="margin-top: 25px; color: #6b7280; font-size: 13px;">
            This is an automated notification from CampusFix.
          </p>

        </div>
      `,
    });

    console.log("Technician assignment email sent successfully");
  } catch (error) {
    console.log(
      "Technician email notification failed:",
      error.message
    );
  }
};

// ================= COMPLAINT RESOLVED =================

const sendComplaintResolvedEmail = async (complaint) => {
  try {
    await transporter.sendMail({
      from: `"CampusFix" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: "Complaint Resolved - CampusFix",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">

          <h2 style="color: #059669;">
            Complaint Resolved ✅
          </h2>

          <p>
            A technician has marked the following maintenance
            complaint as <strong>Resolved</strong>.
          </p>

          <hr />

          <p><strong>Block:</strong> ${complaint.block}</p>
          ${complaint.floor ? `<p><strong>Floor:</strong> ${complaint.floor}</p>` : ""}
          <p><strong>Room:</strong> ${complaint.room}</p>
          <p><strong>Category:</strong> ${complaint.category}</p>
          <p><strong>Priority:</strong> ${complaint.priority}</p>

          <p>
            <strong>Description:</strong><br />
            ${complaint.description}
          </p>

          <hr />

          <p>
            Please login to the CampusFix Admin Dashboard
            to verify the completed work.
          </p>

          <p style="
            margin-top: 25px;
            color: #6b7280;
            font-size: 13px;
          ">
            This is an automated notification from CampusFix.
          </p>

        </div>
      `,
    });

    console.log("Complaint resolved email sent successfully");
  } catch (error) {
    console.log(
      "Resolved complaint email failed:",
      error.message
    );
  }
};

// ================= REGISTRATION VERIFICATION OTP =================

const sendVerificationOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"CampusFix" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CampusFix Email Verification OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">

          <h2 style="color: #4f46e5;">
            Verify Your CampusFix Account
          </h2>

          <p>Your verification OTP is:</p>

          <h1 style="
            letter-spacing: 8px;
            color: #111827;
          ">
            ${otp}
          </h1>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request this, you can ignore this email.
          </p>

        </div>
      `,
    });

    console.log("Verification OTP sent successfully");
  } catch (error) {
    console.log("OTP email failed:", error.message);
    throw error;
  }
};

// ================= PASSWORD RESET OTP =================

const sendPasswordResetOTP = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: `"CampusFix" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "CampusFix Password Reset OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">

          <h2 style="color: #4f46e5;">
            Reset Your CampusFix Password
          </h2>

          <p>
            We received a request to reset your CampusFix password.
          </p>

          <p>
            Your password reset OTP is:
          </p>

          <div style="
            margin: 20px 0;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 10px;
            text-align: center;
          ">

            <h1 style="
              margin: 0;
              letter-spacing: 8px;
              color: #111827;
            ">
              ${otp}
            </h1>

          </div>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p style="color: #6b7280;">
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <hr />

          <p style="
            color: #9ca3af;
            font-size: 13px;
          ">
            This is an automated email from CampusFix.
          </p>

        </div>
      `,
    });

    console.log("Password reset OTP sent successfully");
  } catch (error) {
    console.log(
      "Password reset OTP email failed:",
      error.message
    );

    throw error;
  }
};


// ================= FAKE COMPLAINT WARNING =================

const sendFakeComplaintWarningEmail = async (studentEmail, studentName) => {
  try {
    await transporter.sendMail({
      from: `"CampusFix" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: "Important Warning – Fake Complaint Detected",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 25px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #1f2937;
        ">

          <h2 style="color: #dc2626;">
            Important Warning – Fake Complaint Detected
          </h2>

          <p>Dear ${studentName || "Student"},</p>

          <p>
            Your submitted maintenance complaint has been reviewed
            and verified as false by the administration.
          </p>

          <p>
            We request you not to submit false complaints, as this
            wastes the valuable time and resources of college staff.
          </p>

          <p>
            Repeated incidents may lead to disciplinary action
            according to college rules.
          </p>

          <p>
            If you believe this decision is incorrect, you may
            contact the college administration for clarification.
          </p>

          <br />

          <p>Regards,</p>
          <strong>College Administration</strong>

          <hr />

          <p style="color: #9ca3af; font-size: 12px;">
            This is an automated email from CampusFix.
          </p>

        </div>
      `,
    });

    console.log("Fake complaint warning email sent successfully");
  } catch (error) {
    console.error("Fake complaint warning email failed:", error.message);
  }
};


// ================= EXPORTS =================

module.exports = {
  sendComplaintNotification,
  sendTechnicianAssignmentEmail,
  sendComplaintResolvedEmail,
  sendVerificationOTP,
  sendPasswordResetOTP,
  sendFakeComplaintWarningEmail,
};
