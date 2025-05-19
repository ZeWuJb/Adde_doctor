import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import Signup from "./components/Signup"
import Signin from "./components/Signin"
import Dashboard from "./components/Dashboard"
import PrivateRoute from "./components/PrivateRoute"
import AdminDashboard from "./admin/AdminDashboard"
import DoctorsPage from "./admin/pages/DoctorsPage"
import AppointmentsPage from "./admin/pages/AppointmentsPage"
import AnalyticsPage from "./admin/pages/AnalysticsPage" // Fixed typo in import
import SettingsPage from "./admin/pages/SettingsPage"
import ContentManagementPage from "./admin/pages/ContentManagementPage"
import PatientsPage from "./admin/pages/PatientsPage"
import SystemMonitoringPage from "./admin/pages/SystemMonitoringPage"
import UserRolesPage from "./admin/pages/UserRolesPage"

export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      // Doctor routes
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <Dashboard /> },
      { path: "appointments", element: <Dashboard /> },
      { path: "availability", element: <Dashboard /> },
      { path: "statistics", element: <Dashboard /> },
      { path: "patients", element: <Dashboard /> },
      { path: "reports", element: <Dashboard /> },
      { path: "settings", element: <Dashboard /> },
      { path: "help", element: <Dashboard /> },

      // Admin routes
      { path: "admin-dashboard", element: <AdminDashboard /> },
      { path: "admin/doctors", element: <DoctorsPage /> },
      { path: "admin/appointments", element: <AppointmentsPage /> },
      { path: "admin/analytics", element: <AnalyticsPage /> },
      { path: "admin/settings", element: <SettingsPage /> },
      { path: "admin/content", element: <ContentManagementPage /> },
      { path: "admin/patients", element: <PatientsPage /> },
      { path: "admin/system", element: <SystemMonitoringPage /> },
      { path: "admin/user-roles", element: <UserRolesPage /> },
    ],
  },
])
