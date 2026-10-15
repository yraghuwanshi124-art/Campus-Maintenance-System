
const campusFixKnowledge = {
  project: {
    name: "CampusFix",
    developer: "Yash Raghuwanshi",

    description:
      "CampusFix is a campus maintenance management system designed to help students report maintenance problems and help college staff manage, assign, track, and resolve those complaints.",

    purpose:
      "The main purpose of CampusFix is to make campus maintenance complaint reporting faster, organized, transparent, and easier to track.",

    roles: [
      "Student",
      "Admin",
      "Supervisor",
      "Technician",
    ],

    technologies: [
      "React",
      "JavaScript",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "MongoDB",
      "JWT Authentication",
    ],
  },

  administrators: {
    A: {
      block: "A Block",
      name: "Rahul Sharma",
    },

    B: {
      block: "B Block",
      name: "Aman Verma",
    },

    C: {
      block: "C Block",
      name: "Priya Singh",
    },

    D: {
      block: "D Block",
      name: "Ankit Jain",
    },

    V: {
      block: "V Block",
      name: "Neha Patel",
    },
  },

  supervisor: {
    name: "Rajesh Kumar",

    description:
      "The Supervisor manages maintenance operations across the campus and coordinates complaint assignment and technician work.",
  },

  complaintSystem: {
    categories: [
      "Computer",
      "Fan",
      "Light",
      "AC",
      "Door",
      "Furniture",
    ],

    priorities: [
      "Low",
      "Medium",
      "High",
    ],

    statuses: [
      "Pending",
      "Assigned",
      "In Progress",
      "Resolved",
    ],

    technicianMapping: {
      Computer: "Computer Technician",
      Fan: "Electrician",
      Light: "Electrician",
      AC: "AC Technician",
      Door: "Carpenter",
      Furniture: "Carpenter",
    },

    workflow: [
      "Student reports a maintenance problem.",
      "The complaint is reviewed by the authorized college staff.",
      "The complaint is assigned to an appropriate technician.",
      "The technician works on the reported issue.",
      "The technician updates the complaint status.",
      "After the issue is resolved, the complaint is marked as Resolved.",
      "The student can provide feedback after resolution.",
    ],
  },

  studentFeatures: [
    "Report a Problem",
    "Track My Complaints",
    "View All Complaints",
    "View My Activity",
    "Manage Profile",
    "View Notifications",
    "Use CampusFix AI Chatbot",
  ],

  complaintHelp: {
    create:
      "To report a problem, open Report a Problem, select the relevant location and category, describe the issue, select the priority, and submit the complaint.",

    tracking:
      "Students can track their complaints from the Track My Complaints or All Complaints section.",

    feedback:
      "After a complaint is resolved, the student can provide feedback about the resolution.",

    priority: {
      Low: "A problem that is not immediately urgent.",
      Medium: "A normal maintenance problem that should be handled in a reasonable time.",
      High: "An important or urgent maintenance problem that requires higher attention.",
    },

    status: {
      Pending:
        "The complaint has been submitted and is waiting for further processing.",

      Assigned:
        "The complaint has been assigned to a technician.",

      "In Progress":
        "The assigned technician is currently working on the complaint.",

      Resolved:
        "The maintenance issue has been resolved.",
    },
  },

  roleInformation: {
    Student:
      "Students can report maintenance problems, track their complaints, view complaint activity, receive notifications, and use the CampusFix AI chatbot.",

    Admin:
      "Admins manage complaints and campus maintenance operations for their assigned block.",

    Supervisor:
      "The Supervisor coordinates maintenance operations across the campus and manages technician assignment.",

    Technician:
      "Technicians handle maintenance complaints according to their specialization and update the progress and resolution of assigned complaints.",
  },

  dashboardInformation: {
    dashboard:
      "The Student Dashboard provides access to the main CampusFix features and complaint information.",

    report:
      "Report a Problem allows students to submit a new maintenance complaint.",

    complaints:
      "Track My Complaints allows students to monitor the status of their submitted complaints.",

    activity:
      "My Activity provides information about the student's complaint-related activity.",

    notifications:
      "Notifications inform students about important updates related to their complaints.",

    chatbot:
      "CampusFix AI helps students find information about CampusFix, complaints, maintenance, blocks, administrators, technicians, and other campus maintenance processes.",
  },

  privacy: {
    rule:
      "CampusFix protects student personal information. Private student information such as phone numbers, email addresses, enrollment numbers, and other personal details should not be disclosed to unauthorized users.",
  },

  generalHelp: {
    contact:
      "For a maintenance problem, students should first report the issue through CampusFix instead of contacting individual technicians directly.",

    emergency:
      "For an urgent campus maintenance problem, submit the complaint with High priority and provide a clear description of the issue and its location.",
  },
};

export default campusFixKnowledge;