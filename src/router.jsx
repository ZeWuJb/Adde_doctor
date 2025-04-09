import { createBrowserRouter } from "react-router-dom"
import App from "./App"
import Signup from "./components/Signup"
import Signin from "./components/Signin"
import Dashboard from "./components/Dashboard"
import PrivateRoute from "./components/PrivateRoute"
import AdminDashboard from "./admin/AdminDashboard"
import DoctorsPage from "./admin/pages/DoctorsPage" 
import AppointmentsPage from "./admin/pages/AppointmentsPage"
import AnalyticsPage from "./admin/pages/DoctorsPage" 
import SettingsPage from "./admin/pages/SettingsPage"
  


export const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signin", element: <Signin /> },
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <Dashboard /> },
      { path: "appointments", element: <Dashboard /> },
      { path: "availability", element: <Dashboard /> },
      { path: "statistics", element: <Dashboard /> },
      { path: "patients", element: <Dashboard /> },
      { path: "reports", element: <Dashboard /> },
      { path: "settings", element: <Dashboard /> },
      { path: "help", element: <Dashboard /> },
      { path: "admin-dashboard", element: <AdminDashboard /> },
      { path: "admin/doctors", element: <DoctorsPage /> },
      { path: "admin/appointments", element: <AppointmentsPage /> },
      { path: "admin/analytics", element: <AnalyticsPage /> },
      { path: "admin/settings", element: <SettingsPage /> },
    ],
  },
])
