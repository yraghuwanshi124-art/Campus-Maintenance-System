# 🏫 CampusFix – Full-Stack Next.js Edition

CampusFix is a web-based campus maintenance management system built as a unified **Next.js Full-Stack Application** using Next.js App Router for the frontend and API Route Handlers for the backend.

## 🚀 Running Locally

1. **Ensure MongoDB is running:**
   ```bash
   mongod --dbpath <path_to_db_directory>
   ```

2. **Start the Next.js development server:**
   ```bash
   npm install
   npm run dev
   ```

3. **Open the application:**
   - **App:** [http://localhost:3000](http://localhost:3000)
   - **API Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

## ☁️ Deploying to Vercel

1. Import this repository in [Vercel](https://vercel.com).
2. Set Environment Variables:
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `JWT_SECRET`: Secret key for JWT authentication
   - `GEMINI_API_KEY`: (Optional) For AI Chatbot
   - `EMAIL_USER` & `EMAIL_PASS`: (Optional) For email notifications
3. Deploy!

## 📁 Architecture

- **`src/app/`**: Next.js App Router pages (Student, Admin, Supervisor, Technician portals, Authentication)
- **`pages/api/[...all].js`**: Unified Express API route handler serving `/api/*`
- **`server/`**: Backend models (Mongoose), controllers, middleware, and services
- **`src/components/`**: UI components with theme support and SSR safety
- **`src/context/`**: Light/Dark theme provider
- **`src/services/api.js`**: Axios client pointing to `/api` (same origin, eliminating CORS issues)
