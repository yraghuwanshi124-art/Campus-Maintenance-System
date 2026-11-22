# 🏫 CampusFix – Full-Stack Next.js Edition

CampusFix has been shifted to a unified **Next.js Full-Stack Monolithic Architecture** using Next.js App Router for the frontend and API Route Handlers for the backend.

## 🚀 Running Locally

1. **Ensure MongoDB is running:**
   ```bash
   mongod --dbpath <path_to_db_directory>
   ```

2. **Start the Next.js development server:**
   ```bash
   cd next-app
   npm install
   npm run dev
   ```

3. **Open the application:**
   - **App:** [http://localhost:3000](http://localhost:3000)
   - **API Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

## 📁 Architecture

- **`src/app/`**: Next.js App Router pages (Student, Admin, Supervisor, Technician portals, Authentication)
- **`pages/api/[...all].js`**: Unified Express API route handler serving `/api/*`
- **`server/`**: Backend models (Mongoose), controllers, middleware, and services
- **`src/components/`**: UI components with theme support and SSR safety
- **`src/context/`**: Light/Dark theme provider
- **`src/services/api.js`**: Axios client pointing to `/api` (same origin, eliminating CORS issues)
