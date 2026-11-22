import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ["mongoose", "bcryptjs", "@google/genai", "nodemailer", "node-cron"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-router-dom": path.resolve(__dirname, "src/components/routerCompat.jsx"),
    };
    return config;
  },
};

export default nextConfig;
