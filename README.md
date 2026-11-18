# 🏫 CampusFix – Smart Campus Maintenance Management System

**CampusFix** is a web-based campus maintenance management system designed to simplify the process of reporting, tracking, and managing maintenance complaints within a college campus.

It provides separate portals for students, administrators, technicians, and supervisors, helping improve communication, transparency, and maintenance management.

## 🚀 Live Demo

- **Frontend:** [https://campus-maintainace-system.vercel.app/](https://campus-maintainace-system.vercel.app/)
- **Backend:** [https://campus-maintainace-system.onrender.com](https://campus-maintainace-system.onrender.com)

## ✨ Key Features

### 👨‍🎓 Student Portal

- Student registration and login
- Submit maintenance complaints
- Track complaint status
- View complaint history
- Receive notifications about complaint updates
- Upload complaint images

### 🛠️ Admin Portal

- Manage and monitor complaints
- View complaint details
- Assign and manage complaint-related actions
- Identify and manage fake complaints
- View student complaint information
- Monitor maintenance activities

### 🔧 Technician Portal

- View assigned complaints
- Access complaint details
- Manage maintenance work
- Update complaint progress

### 👨‍💼 Supervisor Portal

- Monitor maintenance operations
- View complaint progress
- Track assigned work
- Oversee maintenance activities

### 🤖 AI Chatbot

- AI-powered conversational assistant
- Integrated with Google Gemini API
- Helps students with maintenance-related queries
- Designed for future database-connected complaint tracking and personalized assistance

### 🔐 Security

- JWT-based authentication
- Role-based authorization
- Protected API routes
- Backend environment variables for sensitive credentials

## 🧑‍💻 Tech Stack

| Technology        | Purpose                    |
| ----------------- | -------------------------- |
| React.js          | Frontend                   |
| Vite              | Development and build tool |
| Tailwind CSS      | Styling                    |
| React Router      | Navigation                 |
| Axios             | API communication          |
| Node.js           | Backend runtime            |
| Express.js        | Backend framework          |
| MongoDB           | Database                   |
| Mongoose          | Database modeling          |
| JWT               | Authentication             |
| Google Gemini API | AI Chatbot                 |
| Vercel            | Frontend deployment        |
| Render            | Backend deployment         |

## 📂 Project Structure

```text
CampusFix/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.js
│   └── .env
│
└── README.md
```

*Note: Update the folder structure if your actual repository uses different folder names.*

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd CampusFix
```

### 2. Setup Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

### 3. Setup Backend

Open another terminal:

```bash
cd server
npm install
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

*Use the actual scripts defined in your package.json files.*

## 🔑 Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key

EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
```

Use the exact MongoDB environment variable name expected by your backend configuration. Never upload real API keys, passwords, or database credentials to GitHub.

## 🔄 How It Works

1. A user logs in through the application.
2. The backend verifies the user's identity and role.
3. Students can submit maintenance complaints.
4. Complaint information is stored in MongoDB.
5. Authorized administrators and technicians manage complaints.
6. Students receive updates through the notification system.
7. The AI chatbot processes user questions through the backend and Gemini API.

## 🔮 Future Enhancements

- Database-connected AI complaint tracking
- Intelligent complaint categorization
- AI-based maintenance assistance
- Advanced analytics and reporting
- Improved complaint prioritization
- Enhanced campus maintenance insights

## 👨‍💻 Developer

**Yash Raghuwanshi**

B.Tech CSE (Advanced AI – IBM Collaboration)
Medi-Caps University, Indore

GitHub: [https://github.com/yraghuwanshi124-art](https://github.com/yraghuwanshi124-art)

---

⭐ If you find this project useful, consider giving the repository a star!

**CampusFix – Making Campus Maintenance Smarter.**
