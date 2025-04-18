import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "c5bec961-a3e0-4ca2-8423-a053c2490e20-00-1zr6crl2nsrj0.picard.replit.dev",
    ], // Allow the local tunnel host
    host: true, // Allow external access
  },
});
