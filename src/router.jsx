import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import App from "./App"
import Signup from "./components/Signup"
import Signin from "./components/Signin"
import Dashboard from "./components/Dashboard"
import PrivateRoute from "./components/PrivateRoute"
import AdminLoading from "./components/AdminLoading" 
import AdminProfilePage from "./admin/pages/AdminProfilePage"

// Lazy load admin components
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"))
const DoctorsPage = lazy(() => import("./admin/pages/DoctorsPage"))
const AppointmentsPage = lazy(() => import("./admin/pages/AppointmentsPage"))
const AnalyticsPage = lazy(() => import("./admin/pages/AnalysticsPage"))
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage"))
const ContentManagementPage = lazy(() => import("./admin/pages/ContentManagementPage"))
const PatientsPage = lazy(() => import("./admin/pages/PatientsPage"))
const SystemMonitoringPage = lazy(() => import("./admin/pages/SystemMonitoringPage"))
const UserRolesPage = lazy(() => import("./admin/pages/UserRolesPage"))

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

      // Admin routes - wrapped with Suspense for lazy loading
      {
        path: "admin-dashboard",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <AdminDashboard />
          </Suspense>
        ),
      },
      {
        path: "admin/doctors",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <DoctorsPage />
          </Suspense>
        ),
      },
      {
        path: "admin/appointments",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <AppointmentsPage />
          </Suspense>
        ),
      },
      {
        path: "admin/analytics",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <AnalyticsPage />
          </Suspense>
        ),
      },
      {
        path: "admin/settings",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: "admin/content",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <ContentManagementPage />
          </Suspense>
        ),
      },
      {
        path: "admin/patients",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <PatientsPage />
          </Suspense>
        ),
      },
      {
        path: "admin/system",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <SystemMonitoringPage />
          </Suspense>
        ),
      },
      {
        path: "admin/user-roles",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <UserRolesPage />
          </Suspense>
        ),
      },
      {
    path: "/admin/profile",
    element: (
      <PrivateRoute>
        <AdminProfilePage />
      </PrivateRoute>
    ),
  },
    ],
  },
])
