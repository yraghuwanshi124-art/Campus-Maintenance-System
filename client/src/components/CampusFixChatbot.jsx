
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Bot,
  Send,
  User,
  Trash2,
  Sparkles,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Wrench,
  Building2,
  Clock3,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

import campusFixKnowledge from "../data/campusFixKnowledge";
import { useTheme } from "../context/ThemeContext";

// ============================================================
// CampusFix AI Chatbot
// Student-side knowledge assistant
// ============================================================

const normalizeText = (text = "") => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:()[\]{}"'`]/g, " ")
    .replace(/\s+/g, " ");
};

// ------------------------------------------------------------
// Detect Hindi / Hinglish
// ------------------------------------------------------------

const hindiWords = [
  "hai",
  "ha",
  "ho",
  "h",
  "kya",
  "kaise",
  "kaisa",
  "kaisi",
  "kaun",
  "kon",
  "konsi",
  "kaunsi",
  "kis",
  "kisko",
  "kiske",
  "mera",
  "meri",
  "mere",
  "mujhe",
  "hum",
  "ham",
  "aap",
  "ap",
  "tum",
  "tumhara",
  "tumhari",
  "batao",
  "btao",
  "bata",
  "chahiye",
  "karta",
  "karti",
  "karega",
  "karegi",
  "karenge",
  "wala",
  "wali",
  "wale",
  "se",
  "me",
  "mein",
  "par",
  "ke",
  "ki",
  "ka",
  "aur",
  "ya",
  "nahi",
  "nahin",
  "haan",
  "han",
  "kyu",
  "kyon",
  "kyunki",
  "kab",
  "kahan",
  "yaha",
  "waha",
  "abhi",
  "phir",
  "pehle",
  "baad",
  "problem",
  "complaint",
  "kaam",
  "kam",
  "karna",
  "karo",
  "kare",
  "samjhao",
  "samajh",
  "dikhao",
  "bata",
  "bta",
];

const isHindiQuestion = (text = "") => {
  if (/[\u0900-\u097F]/.test(text)) {
    return true;
  }

  const words = normalizeText(text).split(" ");

  const hindiCount = words.filter((word) =>
    hindiWords.includes(word)
  ).length;

  return hindiCount >= 1;
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const containsAny = (text, values = []) => {
  return values.some((value) => text.includes(value));
};

const hasWord = (text, words = []) => {
  const tokens = text.split(" ");

  return words.some((word) => tokens.includes(word));
};

// ------------------------------------------------------------
// Entity detection
// ------------------------------------------------------------

const detectCategory = (q) => {
  if (
    containsAny(q, [
      "ac",
      "a c",
      "air conditioner",
      "airconditioning",
      "air conditioning",
      "cooling",
      "ac machine",
    ])
  ) {
    return "AC";
  }

  if (
    containsAny(q, [
      "computer",
      "laptop",
      "desktop",
      "pc",
      "system",
      "computer system",
    ])
  ) {
    return "Computer";
  }

  if (
    containsAny(q, [
      "fan",
      "ceiling fan",
      "table fan",
      "pankha",
    ])
  ) {
    return "Fan";
  }

  if (
    containsAny(q, [
      "light",
      "bulb",
      "tube light",
      "electric light",
      "lighting",
      "bijli",
    ])
  ) {
    return "Light";
  }

  if (
    containsAny(q, [
      "door",
      "darwaza",
      "gate",
    ])
  ) {
    return "Door";
  }

  if (
    containsAny(q, [
      "furniture",
      "table",
      "chair",
      "desk",
      "bench",
    ])
  ) {
    return "Furniture";
  }

  return null;
};

const detectBlock = (q) => {
  if (
    containsAny(q, [
      "a block",
      "block a",
      "a-block",
      "a block admin",
    ])
  ) {
    return "A";
  }

  if (
    containsAny(q, [
      "b block",
      "block b",
      "b-block",
      "b block admin",
    ])
  ) {
    return "B";
  }

  if (
    containsAny(q, [
      "c block",
      "block c",
      "c-block",
      "c block admin",
    ])
  ) {
    return "C";
  }

  if (
    containsAny(q, [
      "d block",
      "block d",
      "d-block",
      "d block admin",
    ])
  ) {
    return "D";
  }

  if (
    containsAny(q, [
      "v block",
      "block v",
      "v-block",
      "v block admin",
    ])
  ) {
    return "V";
  }

  return null;
};

const detectStatus = (q) => {
  if (containsAny(q, ["pending", "wait", "waiting"])) {
    return "Pending";
  }

  if (containsAny(q, ["assigned", "assign"])) {
    return "Assigned";
  }

  if (
    containsAny(q, [
      "in progress",
      "progress",
      "working",
      "work is going",
    ])
  ) {
    return "In Progress";
  }

  if (
    containsAny(q, [
      "resolved",
      "solve ho",
      "solved",
      "fixed",
      "complete",
      "completed",
    ])
  ) {
    return "Resolved";
  }

  return null;
};

const detectPriority = (q) => {
  if (containsAny(q, ["low", "kam priority", "low priority"])) {
    return "Low";
  }

  if (
    containsAny(q, [
      "medium",
      "normal priority",
      "medium priority",
    ])
  ) {
    return "Medium";
  }

  if (
    containsAny(q, [
      "high",
      "urgent",
      "emergency",
      "high priority",
    ])
  ) {
    return "High";
  }

  return null;
};

// ------------------------------------------------------------
// Intent detection
// ------------------------------------------------------------

const detectIntent = (q) => {
  // Identity
  if (
    containsAny(q, [
      "who are you",
      "who r you",
      "what are you",
      "tum kon ho",
      "tum kaun ho",
      "aap kon ho",
      "aap kaun ho",
      "tu kon hai",
      "tu kaun hai",
      "ap kon ho",
      "ap kaun ho",
      "your name",
      "naam kya hai",
      "tumhara naam",
      "aapka naam",
      "what can you do",
      "tum kya kar sakte",
      "aap kya kar sakte",
    ])
  ) {
    return "identity";
  }

  // Greeting
  if (
    containsAny(q, [
      "hello",
      "hi",
      "hey",
      "hii",
      "hlo",
      "namaste",
      "namaskar",
      "good morning",
      "good afternoon",
      "good evening",
      "good night",
    ])
  ) {
    return "greeting";
  }

  // Thanks
  if (
    containsAny(q, [
      "thanks",
      "thank you",
      "thank u",
      "thx",
      "dhanyavad",
      "shukriya",
      "thankyou",
    ])
  ) {
    return "thanks";
  }

  // Developer
  if (
    containsAny(q, [
      "developer",
      "developed",
      "develop",
      "created by",
      "made by",
      "built by",
      "banaya kisne",
      "kisne banaya",
      "kisne bnaya",
      "creator",
      "creator of",
      "owner",
    ])
  ) {
    return "developer";
  }

  // What is CampusFix
  if (
    containsAny(q, [
      "what is campusfix",
      "what's campusfix",
      "campusfix kya hai",
      "campusfix kya h",
      "campusfix ke bare",
      "campusfix ke baare",
      "campusfix about",
      "about campusfix",
      "campusfix kya karta",
    ])
  ) {
    return "project";
  }

  // Purpose
  if (
    containsAny(q, [
      "purpose",
      "main purpose",
      "why campusfix",
      "why use campusfix",
      "benefit",
      "benefits",
      "campusfix ka purpose",
      "campusfix ka main purpose",
      "kyu banaya",
      "kyon banaya",
      "kisliye banaya",
      "kis liye banaya",
      "iska fayda",
      "iska use",
      "why was it created",
    ])
  ) {
    return "purpose";
  }

  // Technology
  if (
    containsAny(q, [
      "technology",
      "technologies",
      "tech stack",
      "technology stack",
      "stack used",
      "which technologies",
      "which tech",
      "kis technology",
      "kaunsi technology",
      "kon si technology",
      "tech use",
      "frontend",
      "backend",
      "database",
    ])
  ) {
    return "technology";
  }

  // Roles
  if (
    containsAny(q, [
      "roles",
      "role",
      "users",
      "who can use",
      "who uses",
      "kitne roles",
      "kaun kaun use",
      "kaun use kar sakta",
      "users kaun",
    ])
  ) {
    return "roles";
  }

  // Supervisor
  if (
    containsAny(q, [
      "supervisor",
      "superviser",
      "supervisor kaun",
      "supervisor kon",
      "supervisor kya karta",
      "supervisor role",
    ])
  ) {
    return "supervisor";
  }

  // Admin
  if (
    containsAny(q, [
      "admin",
      "administrator",
      "block admin",
      "admin kaun",
      "admin kon",
      "incharge",
      "in charge",
    ])
  ) {
    return "admin";
  }

  // Technician responsibility
  const category = detectCategory(q);

  if (
    category &&
    containsAny(q, [
      "technician",
      "technican",
      "tech",
      "handle",
      "handles",
      "handled",
      "responsible",
      "responsibility",
      "repair",
      "fix",
      "solve",
      "solves",
      "manage",
      "assign",
      "assigned",
      "kaun",
      "kon",
      "konsi",
      "kaunsi",
      "kis",
      "kisko",
      "kiske",
      "karta",
      "karega",
      "kare",
      "handle karta",
      "handle karega",
      "kaam",
      "work",
    ])
  ) {
    return "technician_responsibility";
  }

  // General technician
  if (
    containsAny(q, [
      "technician",
      "technican",
      "technicians",
      "technician type",
      "technician specialization",
      "technician kaun",
      "technician kon",
      "technician kya karta",
      "technician ka role",
    ])
  ) {
    return "technicians";
  }

  // Complaint categories
  if (
    containsAny(q, [
      "categories",
      "category",
      "types of complaint",
      "types of complaints",
      "complaint type",
      "complaints type",
      "kis type ki complaint",
      "kaunsi complaint",
      "konsi complaint",
      "complaint me kya",
      "what complaints",
      "what problems",
    ])
  ) {
    return "categories";
  }

  // Create complaint
  if (
    containsAny(q, [
      "create complaint",
      "report complaint",
      "report a problem",
      "report problem",
      "new complaint",
      "submit complaint",
      "complaint kaise kare",
      "complaint kaise karu",
      "complaint kaise karna",
      "problem kaise report",
      "issue kaise report",
      "complaint submit",
      "problem report",
    ])
  ) {
    return "create_complaint";
  }

  // Track complaint
  if (
    containsAny(q, [
      "track complaint",
      "track my complaint",
      "complaint track",
      "complaint status",
      "status of complaint",
      "my complaint status",
      "meri complaint",
      "mera complaint",
      "complaint kaha",
      "complaint kahan",
      "complaint kab",
      "status kya",
      "status batao",
      "status btao",
    ])
  ) {
    return "track_complaint";
  }

  // Status meaning
  if (
    containsAny(q, [
      "status meaning",
      "status ka meaning",
      "status ka matlab",
      "pending meaning",
      "assigned meaning",
      "in progress meaning",
      "resolved meaning",
      "status kya hota",
      "status ka kya matlab",
    ])
  ) {
    return "status";
  }

  // Priority
  if (
    containsAny(q, [
      "priority",
      "priority meaning",
      "priority ka meaning",
      "priority ka matlab",
      "low priority",
      "medium priority",
      "high priority",
      "priority kaise",
      "kaunsi priority",
      "konsi priority",
    ])
  ) {
    return "priority";
  }

  // Feedback
  if (
    containsAny(q, [
      "feedback",
      "feedback kaise",
      "feedback kaise du",
      "feedback dena",
      "review",
      "rating",
      "complaint feedback",
    ])
  ) {
    return "feedback";
  }

  // Workflow
  if (
    containsAny(q, [
      "workflow",
      "process",
      "complaint process",
      "complaint ka process",
      "process kya hai",
      "kaise work karta",
      "kaise kaam karta",
      "complaint flow",
      "complaint ka flow",
      "from report to resolve",
    ])
  ) {
    return "workflow";
  }

  // Dashboard
  if (
    containsAny(q, [
      "dashboard",
      "dashboard me kya",
      "dashboard features",
      "dashboard par kya",
      "student dashboard",
      "student panel",
      "home page",
    ])
  ) {
    return "dashboard";
  }

  // Notifications
  if (
    containsAny(q, [
      "notification",
      "notifications",
      "notification kya",
      "notification kaise",
      "notification kab",
      "updates",
    ])
  ) {
    return "notifications";
  }

  // Activity
  if (
    containsAny(q, [
      "my activity",
      "activity",
      "meri activity",
      "activity me kya",
      "complaint activity",
      "history",
      "complaint history",
    ])
  ) {
    return "activity";
  }

  // Privacy
  if (
    containsAny(q, [
      "privacy",
      "private",
      "personal information",
      "personal data",
      "student data",
      "student information",
      "data safe",
      "data security",
      "student details",
      "meri information",
      "mera data",
    ])
  ) {
    return "privacy";
  }

  // Emergency
  if (
    containsAny(q, [
      "emergency",
      "urgent",
      "bahut urgent",
      "important problem",
      "immediate",
      "turant",
      "jaldi",
      "urgent complaint",
    ])
  ) {
    return "emergency";
  }

  // Features
  if (
    containsAny(q, [
      "features",
      "feature",
      "what can i do",
      "what can student do",
      "student features",
      "student kya kar sakta",
      "student kya kya kar sakta",
      "kya kya kar sakte",
    ])
  ) {
    return "features";
  }

  // General help
  if (
    containsAny(q, [
      "help",
      "help me",
      "madad",
      "kuch batao",
      "kya puch sakta",
      "what should i ask",
      "what can i ask",
      "questions",
      "question",
    ])
  ) {
    return "help";
  }

  return "unknown";
};

// ============================================================
// Answer Generator
// ============================================================

const generateAnswer = (question) => {
  const q = normalizeText(question);
  const hindi = isHindiQuestion(question);
  const intent = detectIntent(q);

  const category = detectCategory(q);
  const block = detectBlock(q);
  const status = detectStatus(q);
  const priority = detectPriority(q);

  // ----------------------------------------------------------
  // Identity
  // ----------------------------------------------------------

  if (intent === "identity") {
    return hindi
      ? "Main CampusFix AI hoon 🤖. Main CampusFix project ke baare mein students ko information dene ke liye bana hoon. Aap mujhse complaints, complaint status, categories, technicians, blocks, admins, supervisor, dashboard, priority, workflow aur CampusFix ke features ke baare mein pooch sakte ho."
      : "I am CampusFix AI 🤖. I am the student-side assistant for the CampusFix project. You can ask me about complaints, complaint status, categories, technicians, blocks, admins, the supervisor, dashboard features, priorities, workflow, and CampusFix in general.";
  }

  // ----------------------------------------------------------
  // Greeting
  // ----------------------------------------------------------

  if (intent === "greeting") {
    return hindi
      ? "Hello! 👋 Main CampusFix AI hoon. Aap CampusFix se related kuch bhi pooch sakte ho. Jaise: AC complaint kaun handle karta hai, complaint kaise report karein, mera complaint status kya hai, ya CampusFix kya hai."
      : "Hello! 👋 I am CampusFix AI. You can ask me anything related to CampusFix, such as who handles AC complaints, how to report a problem, complaint status, or what CampusFix is.";
  }

  // ----------------------------------------------------------
  // Thanks
  // ----------------------------------------------------------

  if (intent === "thanks") {
    return hindi
      ? "You're welcome bhai! 😊 CampusFix se related koi aur doubt ho to pooch lena."
      : "You're welcome! 😊 If you have any other CampusFix-related question, feel free to ask.";
  }

  // ----------------------------------------------------------
  // Developer
  // ----------------------------------------------------------

  if (intent === "developer") {
    return hindi
      ? `CampusFix ko ${campusFixKnowledge.project.developer} ne develop kiya hai.`
      : `CampusFix was developed by ${campusFixKnowledge.project.developer}.`;
  }

  // ----------------------------------------------------------
  // Project
  // ----------------------------------------------------------

  if (intent === "project") {
    return hindi
      ? `${campusFixKnowledge.project.name} ek campus maintenance management system hai. Iska use students maintenance problems report karne ke liye aur college staff complaints ko manage, assign, track aur resolve karne ke liye kar sakte hain.`
      : `${campusFixKnowledge.project.name} is a campus maintenance management system. It allows students to report maintenance problems while college staff can manage, assign, track, and resolve those complaints.`;
  }

  // ----------------------------------------------------------
  // Purpose
  // ----------------------------------------------------------

  if (intent === "purpose") {
    return hindi
      ? "CampusFix ka main purpose campus maintenance complaints ko faster, organized aur transparent banana hai. Student problem report kar sakta hai, complaint ka status track kar sakta hai aur resolution ke baad feedback bhi de sakta hai."
      : "The main purpose of CampusFix is to make campus maintenance complaint reporting faster, organized, transparent, and easier to track. Students can report problems, track complaint status, and provide feedback after resolution.";
  }

  // ----------------------------------------------------------
  // Technologies
  // ----------------------------------------------------------

  if (intent === "technology") {
    return hindi
      ? `CampusFix mein ${campusFixKnowledge.project.technologies.join(
          ", "
        )} technologies use ki gayi hain. React frontend ke liye, Node.js aur Express.js backend ke liye, MongoDB database ke liye aur JWT authentication ke liye use hota hai.`
      : `CampusFix uses ${campusFixKnowledge.project.technologies.join(
          ", "
        )}. React is used for the frontend, Node.js and Express.js for the backend, MongoDB for the database, and JWT for authentication.`;
  }

  // ----------------------------------------------------------
  // Roles
  // ----------------------------------------------------------

  if (intent === "roles") {
    return hindi
      ? "CampusFix mein 4 main roles hain: Student, Admin, Supervisor aur Technician. Student complaint report karta hai, Admin apne block ki complaints manage karta hai, Supervisor maintenance operations aur technician assignment coordinate karta hai, aur Technician assigned maintenance work ko complete karta hai."
      : "CampusFix has four main roles: Student, Admin, Supervisor, and Technician. Students report problems, Admins manage complaints for their assigned block, the Supervisor coordinates maintenance operations and technician assignment, and Technicians handle assigned maintenance work.";
  }

  // ----------------------------------------------------------
  // Supervisor
  // ----------------------------------------------------------

  if (intent === "supervisor") {
    const supervisor = campusFixKnowledge.supervisor;

    return hindi
      ? `CampusFix ka common Supervisor ${supervisor.name} hai. Supervisor poore campus ki maintenance operations coordinate karta hai, complaints review karta hai aur suitable technician ko assign karta hai.`
      : `The common CampusFix Supervisor is ${supervisor.name}. The Supervisor coordinates maintenance operations across the campus, reviews complaints, and assigns suitable technicians.`;
  }

  // ----------------------------------------------------------
  // Admin
  // ----------------------------------------------------------

  if (intent === "admin") {
    if (block && campusFixKnowledge.administrators[block]) {
      const admin = campusFixKnowledge.administrators[block];

      return hindi
        ? `${admin.block} ke Admin ${admin.name} hain.`
        : `The Admin for ${admin.block} is ${admin.name}.`;
    }

    const admins = campusFixKnowledge.administrators;

    return hindi
      ? `CampusFix mein block-wise Admins hain:\n\nA Block → ${admins.A.name}\nB Block → ${admins.B.name}\nC Block → ${admins.C.name}\nD Block → ${admins.D.name}\nV Block → ${admins.V.name}`
      : `CampusFix has block-wise Admins:\n\nA Block → ${admins.A.name}\nB Block → ${admins.B.name}\nC Block → ${admins.C.name}\nD Block → ${admins.D.name}\nV Block → ${admins.V.name}`;
  }

  // ----------------------------------------------------------
  // Technician responsibility
  // ----------------------------------------------------------

  if (intent === "technician_responsibility") {
    const mapping =
      campusFixKnowledge.complaintSystem.technicianMapping;

    if (category && mapping[category]) {
      const technician = mapping[category];

      return hindi
        ? `${category} se related complaints ${technician} handle karta hai. Agar ${category} ki problem hai to complaint mein correct category select karo, phir appropriate technician ko assign kiya ja sakta hai.`
        : `${category}-related complaints are handled by the ${technician}. If you have a ${category} problem, select the correct category while submitting the complaint so it can be assigned to the appropriate technician.`;
    }

    return hindi
      ? `Technician specialization category ke according hoti hai:\n\nComputer → Computer Technician\nFan → Electrician\nLight → Electrician\nAC → AC Technician\nDoor → Carpenter\nFurniture → Carpenter`
      : `Technician specialization is based on complaint category:\n\nComputer → Computer Technician\nFan → Electrician\nLight → Electrician\nAC → AC Technician\nDoor → Carpenter\nFurniture → Carpenter`;
  }

  // ----------------------------------------------------------
  // General technicians
  // ----------------------------------------------------------

  if (intent === "technicians") {
    return hindi
      ? "CampusFix mein technician complaint category ke according assign kiya jata hai:\n\n💻 Computer → Computer Technician\n🌀 Fan → Electrician\n💡 Light → Electrician\n❄️ AC → AC Technician\n🚪 Door → Carpenter\n🪑 Furniture → Carpenter"
      : "CampusFix assigns technicians according to complaint category:\n\n💻 Computer → Computer Technician\n🌀 Fan → Electrician\n💡 Light → Electrician\n❄️ AC → AC Technician\n🚪 Door → Carpenter\n🪑 Furniture → Carpenter";
  }

  // ----------------------------------------------------------
  // Complaint Categories
  // ----------------------------------------------------------

  if (intent === "categories") {
    return hindi
      ? "CampusFix mein currently ye maintenance complaint categories hain:\n\n💻 Computer\n🌀 Fan\n💡 Light\n❄️ AC\n🚪 Door\n🪑 Furniture\n\nCategory select karne se complaint ko appropriate technician tak assign karna easy hota hai."
      : "CampusFix currently supports these maintenance complaint categories:\n\n💻 Computer\n🌀 Fan\n💡 Light\n❄️ AC\n🚪 Door\n🪑 Furniture\n\nSelecting the correct category helps the complaint reach the appropriate technician.";
  }

  // ----------------------------------------------------------
  // Create complaint
  // ----------------------------------------------------------

  if (intent === "create_complaint") {
    return hindi
      ? "Complaint report karne ke liye:\n\n1. Dashboard se 'Report a Problem' open karo.\n2. Block/location select karo.\n3. Room/location details enter karo.\n4. Correct category select karo.\n5. Problem ko clearly describe karo.\n6. Priority select karo.\n7. Agar available ho to complaint photo add karo.\n8. Complaint submit karo.\n\nSubmit karne ke baad complaint ko track kiya ja sakta hai."
      : "To report a complaint:\n\n1. Open 'Report a Problem' from the dashboard.\n2. Select the block/location.\n3. Enter the room or location details.\n4. Select the correct category.\n5. Clearly describe the problem.\n6. Select the priority.\n7. Add a complaint photo if available.\n8. Submit the complaint.\n\nAfter submission, you can track the complaint.";
  }

  // ----------------------------------------------------------
  // Track complaint
  // ----------------------------------------------------------

  if (intent === "track_complaint") {
    return hindi
      ? "Apni complaint ka status dekhne ke liye 'Track My Complaints' ya 'All Complaints' section open karo. Wahan complaint ka current status aur available complaint information dekh sakte ho.\n\nAgar chatbot ko future mein backend se connect kiya jaye, to main yahin se aapki actual complaint ka live status bhi bata sakta hoon."
      : "To track your complaint, open 'Track My Complaints' or the 'All Complaints' section. You can view the current status and available complaint information there.\n\nOnce the chatbot is connected to the backend, it can also provide your actual live complaint status here.";
  }

  // ----------------------------------------------------------
  // Status
  // ----------------------------------------------------------

  if (intent === "status") {
    if (status) {
      const statusDescription =
        campusFixKnowledge.complaintHelp.status[status];

      return hindi
        ? `${status}: ${statusDescription}`
        : `${status}: ${statusDescription}`;
    }

    return hindi
      ? "Complaint ke main statuses:\n\n🟡 Pending → Complaint submit ho gayi hai aur processing ka wait kar rahi hai.\n🔵 Assigned → Complaint technician ko assign ho gayi hai.\n🟠 In Progress → Technician complaint par kaam kar raha hai.\n🟢 Resolved → Maintenance issue resolve ho chuka hai."
      : "The main complaint statuses are:\n\n🟡 Pending → The complaint has been submitted and is waiting for processing.\n🔵 Assigned → The complaint has been assigned to a technician.\n🟠 In Progress → The technician is currently working on it.\n🟢 Resolved → The maintenance issue has been resolved.";
  }

  // ----------------------------------------------------------
  // Priority
  // ----------------------------------------------------------

  if (intent === "priority") {
    if (priority) {
      const description =
        campusFixKnowledge.complaintHelp.priority[priority];

      return hindi
        ? `${priority} priority: ${description}`
        : `${priority} priority: ${description}`;
    }

    return hindi
      ? "Priority ka matlab complaint ki urgency hai:\n\n🟢 Low → Problem urgent nahi hai.\n🟡 Medium → Normal maintenance problem hai.\n🔴 High → Important ya urgent problem hai jise higher attention chahiye."
      : "Priority represents the urgency of a complaint:\n\n🟢 Low → The problem is not immediately urgent.\n🟡 Medium → It is a normal maintenance problem.\n🔴 High → It is an important or urgent problem requiring higher attention.";
  }

  // ----------------------------------------------------------
  // Workflow
  // ----------------------------------------------------------

  if (intent === "workflow") {
    return hindi
      ? "CampusFix complaint workflow:\n\n1️⃣ Student maintenance problem report karta hai.\n2️⃣ Complaint authorized college staff review karta hai.\n3️⃣ Complaint appropriate technician ko assign hoti hai.\n4️⃣ Technician issue par work karta hai.\n5️⃣ Technician status update karta hai.\n6️⃣ Issue solve hone ke baad complaint Resolved hoti hai.\n7️⃣ Student resolution ke baad feedback de sakta hai."
      : "CampusFix complaint workflow:\n\n1️⃣ Student reports a maintenance problem.\n2️⃣ Authorized college staff reviews the complaint.\n3️⃣ The complaint is assigned to an appropriate technician.\n4️⃣ The technician works on the issue.\n5️⃣ The technician updates the status.\n6️⃣ Once fixed, the complaint is marked Resolved.\n7️⃣ The student can provide feedback after resolution.";
  }

  // ----------------------------------------------------------
  // Feedback
  // ----------------------------------------------------------

  if (intent === "feedback") {
    return hindi
      ? "Complaint Resolved hone ke baad student feedback submit kar sakta hai. Feedback ka purpose maintenance resolution ke experience ko record karna hai."
      : "After a complaint is marked Resolved, the student can submit feedback. The purpose of feedback is to record the student's experience with the maintenance resolution.";
  }

  // ----------------------------------------------------------
  // Dashboard
  // ----------------------------------------------------------

  if (intent === "dashboard") {
    return hindi
      ? "Student Dashboard se aap CampusFix ki main services access kar sakte ho:\n\n🏠 Dashboard\n👤 Profile\n📝 Report a Problem\n📋 All Complaints\n🤖 AI Chatbot\n📊 My Activity\n🔔 Notifications\n\nYahin se complaint reporting aur tracking manage ki ja sakti hai."
      : "The Student Dashboard provides access to the main CampusFix services:\n\n🏠 Dashboard\n👤 Profile\n📝 Report a Problem\n📋 All Complaints\n🤖 AI Chatbot\n📊 My Activity\n🔔 Notifications\n\nComplaint reporting and tracking can be managed from these sections.";
  }

  // ----------------------------------------------------------
  // Features
  // ----------------------------------------------------------

  if (intent === "features") {
    return hindi
      ? "Student ke liye CampusFix ke main features hain:\n\n• Maintenance complaint report karna\n• Complaints track karna\n• Complaint activity dekhna\n• Notifications receive karna\n• Profile manage karna\n• Complaint feedback dena\n• CampusFix AI se help lena"
      : "The main CampusFix features available to students are:\n\n• Report maintenance complaints\n• Track complaints\n• View complaint activity\n• Receive notifications\n• Manage profile\n• Submit complaint feedback\n• Get help from CampusFix AI";
  }

  // ----------------------------------------------------------
  // Notifications
  // ----------------------------------------------------------

  if (intent === "notifications") {
    return hindi
      ? "Notifications section mein complaint se related important updates mil sakte hain, jaise complaint assignment, progress ya resolution updates."
      : "The Notifications section can provide important complaint-related updates, such as assignment, progress, or resolution updates.";
  }

  // ----------------------------------------------------------
  // Activity
  // ----------------------------------------------------------

  if (intent === "activity") {
    return hindi
      ? "My Activity section student ki complaint-related activity aur history ko dekhne ke liye use hota hai."
      : "The My Activity section is used to view the student's complaint-related activity and history.";
  }

  // ----------------------------------------------------------
  // Privacy
  // ----------------------------------------------------------

  if (intent === "privacy") {
    return hindi
      ? "CampusFix mein student personal information ko protect karna important hai. Phone number, email, enrollment number aur other personal details unauthorized users ke saath disclose nahi ki jani chahiye. Student data access role-based hona chahiye."
      : "CampusFix is designed with student privacy in mind. Personal information such as phone numbers, email addresses, enrollment numbers, and other private details should not be disclosed to unauthorized users. Student data access should be role-based.";
  }

  // ----------------------------------------------------------
  // Emergency
  // ----------------------------------------------------------

  if (intent === "emergency") {
    return hindi
      ? "Agar maintenance problem urgent hai, complaint submit karte waqt High priority select karo aur location aur problem ka clear description do. Isse complaint ko higher attention ke liye identify kiya ja sakta hai."
      : "If a maintenance problem is urgent, select High priority while submitting the complaint and provide a clear description of the problem and its location. This helps identify the complaint for higher attention.";
  }

  // ----------------------------------------------------------
  // Help
  // ----------------------------------------------------------

  if (intent === "help") {
    return hindi
      ? "Aap mujhse CampusFix ke baare mein natural language mein pooch sakte ho. Example:\n\n• Tum kon ho?\n• CampusFix kya hai?\n• Is project ko kisne banaya?\n• AC complaint kaun handle karta hai?\n• Fan ka technician kaun hai?\n• Door ki complaint kis technician ko milegi?\n• Complaint kaise report karu?\n• Pending ka matlab kya hai?\n• High priority kab use karni hai?\n• Supervisor kya karta hai?\n• A Block ka admin kaun hai?\n• Dashboard mein kya hai?"
      : "You can ask me CampusFix questions in natural language. For example:\n\n• Who are you?\n• What is CampusFix?\n• Who developed the project?\n• Who handles AC complaints?\n• Which technician handles fan complaints?\n• Who handles door complaints?\n• How do I report a complaint?\n• What does Pending mean?\n• When should I use High priority?\n• What does the Supervisor do?\n• Who is the Admin for A Block?\n• What is available on the dashboard?";
  }

  // ----------------------------------------------------------
  // Unknown question
  // ----------------------------------------------------------

  return hindi
    ? "Main CampusFix se related questions answer karne ke liye bana hoon. Aap question ko simple words mein pooch sakte ho. Jaise: 'AC ka technician kaun hai?', 'complaint kaise karu?', 'CampusFix kya hai?', 'tum kon ho?', 'A block ka admin kaun hai?' ya 'Pending ka matlab kya hai?'."
    : "I am designed to answer CampusFix-related questions. You can ask in simple words, for example: 'Who handles AC complaints?', 'How do I report a complaint?', 'What is CampusFix?', 'Who are you?', 'Who is the Admin for A Block?', or 'What does Pending mean?'.";
};

// ============================================================
// UI Component
// ============================================================

const CampusFixChatbot = ({ darkMode: darkModeProp }) => {
  const { darkMode: contextDark } = useTheme();
  const darkMode = typeof darkModeProp === "boolean" ? darkModeProp : contextDark;
  const initialMessage = {
    id: 1,
    sender: "bot",
    text:
      "Hello! 👋 I am CampusFix AI.\n\nYou can ask me about CampusFix, complaints, technicians, blocks, admins, supervisor, dashboard, priorities, or complaint status.\n\nAap Hindi/Hinglish mein bhi mujhse baat kar sakte ho.",
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ----------------------------------------------------------
  // Quick questions
  // ----------------------------------------------------------

  const quickQuestions = useMemo(
    () => [
      "Who are you?",
      "What is CampusFix?",
      "Who developed CampusFix?",
      "AC complaint kaun handle karta hai?",
      "Fan complaint ka technician kaun hai?",
      "Door ki complaint kaun handle karega?",
      "Complaint kaise report karu?",
      "Pending ka matlab kya hai?",
      "Supervisor kya karta hai?",
      "A Block ka admin kaun hai?",
    ],
    []
  );

  // ----------------------------------------------------------
  // Auto scroll
  // ----------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  // ----------------------------------------------------------
  // Send message
  // ----------------------------------------------------------

  const sendMessage = (text = input) => {
    const cleanText = text.trim();

    if (!cleanText || typing) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: cleanText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const answer = generateAnswer(cleanText);

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: answer,
      };

      setMessages((prev) => [...prev, botMessage]);
      setTyping(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }, 500);
  };

  // ----------------------------------------------------------
  // Enter key
  // ----------------------------------------------------------

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // ----------------------------------------------------------
  // Clear chat
  // ----------------------------------------------------------

  const clearChat = () => {
    setMessages([initialMessage]);
    setInput("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // ----------------------------------------------------------
  // Theme
  // ----------------------------------------------------------

  const pageBg = darkMode
    ? "bg-slate-950 text-white"
    : "bg-slate-50 text-slate-900";

  const panelBg = darkMode
    ? "border-slate-800 bg-slate-900"
    : "border-slate-200 bg-white";

  const mutedText = darkMode
    ? "text-slate-400"
    : "text-slate-500";

  const inputBg = darkMode
    ? "border-slate-700 bg-slate-950 text-white placeholder:text-slate-600"
    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400";

  return (
    <div className={`w-full ${pageBg}`}>
      <div
        className={`mx-auto flex min-h-[650px] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border shadow-sm ${panelBg}`}
      >
        {/* ==================================================
            Header
        ================================================== */}

        <div
          className={`flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
            darkMode
              ? "border-slate-800 bg-slate-900"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
              <Bot size={28} />

              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">
                  CampusFix AI
                </h2>

                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  Student Assistant
                </span>
              </div>

              <p className={`mt-1 text-sm ${mutedText}`}>
                Ask anything about CampusFix
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              darkMode
                ? "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Trash2 size={16} />
            Clear Chat
          </button>
        </div>

        {/* ==================================================
            Quick Questions
        ================================================== */}

        <div
          className={`border-b px-5 py-4 ${
            darkMode
              ? "border-slate-800 bg-slate-900/70"
              : "border-slate-100 bg-slate-50/70"
          }`}
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={15} className="text-indigo-500" />

            <p
              className={`text-xs font-black uppercase tracking-[0.12em] ${mutedText}`}
            >
              Try asking
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => sendMessage(question)}
                disabled={typing}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                  darkMode
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                } ${typing ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================
            Chat Area
        ================================================== */}

        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6 ${
              darkMode ? "bg-slate-950/60" : "bg-slate-50/40"
            }`}
          >
            {messages.map((message) => {
              const isUser = message.sender === "user";

              return (
                <div
                  key={message.id}
                  className={`flex items-end gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                      <Bot size={18} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[70%] ${
                      isUser
                        ? "rounded-br-md bg-indigo-600 text-white"
                        : darkMode
                        ? "rounded-bl-md border border-slate-700 bg-slate-900 text-slate-200"
                        : "rounded-bl-md border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {message.text}
                    </div>
                  </div>

                  {isUser && (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        darkMode
                          ? "bg-slate-700 text-slate-200"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      <User size={18} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing */}
            {typing && (
              <div className="flex items-end gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Bot size={18} />
                </div>

                <div
                  className={`rounded-2xl rounded-bl-md border px-4 py-3 ${
                    darkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ==================================================
              Helpful Info
          ================================================== */}

          <div
            className={`grid grid-cols-1 gap-3 border-t px-4 py-4 sm:grid-cols-3 sm:px-6 ${
              darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-100 bg-white"
            }`}
          >
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <MessageCircle size={17} />
              </div>

              <div>
                <p className="text-xs font-black">
                  Natural Questions
                </p>
                <p className={`text-[11px] ${mutedText}`}>
                  Ask in your own words
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck size={17} />
              </div>

              <div>
                <p className="text-xs font-black">
                  Student Privacy
                </p>
                <p className={`text-[11px] ${mutedText}`}>
                  Personal data stays protected
                </p>
              </div>
            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                darkMode
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300">
                <Wrench size={17} />
              </div>

              <div>
                <p className="text-xs font-black">
                  Maintenance Help
                </p>
                <p className={`text-[11px] ${mutedText}`}>
                  Complaints & technicians
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              Input
          ================================================== */}

          <div
            className={`border-t p-4 sm:p-5 ${
              darkMode
                ? "border-slate-800 bg-slate-900"
                : "border-slate-100 bg-white"
            }`}
          >
            <div className="flex items-end gap-3">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={typing}
                  placeholder="Ask CampusFix AI something..."
                  className={`min-h-[50px] w-full resize-none rounded-2xl border px-4 py-3.5 pr-12 text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${inputBg} ${
                    typing ? "cursor-not-allowed opacity-60" : ""
                  }`}
                />

                <div
                  className={`pointer-events-none absolute bottom-3.5 right-4 ${mutedText}`}
                >
                  <MessageCircle size={18} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={19} />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={`text-[11px] ${mutedText}`}>
                Press Enter to send
              </p>

              <p className={`text-[11px] ${mutedText}`}>
                CampusFix AI
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusFixChatbot;