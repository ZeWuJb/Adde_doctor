import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          admin: [
            "./src/admin/AdminDashboard.jsx",
            "./src/admin/pages/DoctorsPage.jsx",
            "./src/admin/pages/AppointmentsPage.jsx",
            "./src/admin/pages/AnalysticsPage.jsx",
            "./src/admin/pages/SettingsPage.jsx",
            "./src/admin/pages/ContentManagementPage.jsx",
            "./src/admin/pages/PatientsPage.jsx",
            "./src/admin/pages/SystemMonitoringPage.jsx",
            "./src/admin/pages/UserRolesPage.jsx",
          ],
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "lucide-react"],
  },
  server: {
    host: "localhost",
    port: 3000,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 24678,
      // Add this to increase the header size limit
      clientPort: 24678,
      // Increase timeout for WebSocket connections
      timeout: 120000,
    },
  },
})
