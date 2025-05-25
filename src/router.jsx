"use client"

import { createBrowserRouter } from "react-router-dom"
import { lazy, Suspense } from "react"
import PropTypes from "prop-types"
import App from "./App"
import Signup from "./components/Signup"
import Signin from "./components/Signin"
import Dashboard from "./components/Dashboard"
import PrivateRoute from "./components/PrivateRoute"
import AdminLoading from "./components/AdminLoading"
import AdminProfilePage from "./admin/pages/AdminProfilePage"

// Error Boundary Component with PropTypes
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
      <p className="text-gray-600 mb-6">{error?.message || "An unexpected error occurred"}</p>
      <div className="space-y-3">
        <button
          onClick={resetErrorBoundary}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  </div>
)

ErrorFallback.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  resetErrorBoundary: PropTypes.func,
}

ErrorFallback.defaultProps = {
  error: null,
  resetErrorBoundary: () => window.location.reload(),
}

// Lazy load admin components - simplified without error catching to see the real error
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"))
const DoctorsPage = lazy(() => import("./admin/pages/DoctorsPage"))
const AppointmentsPage = lazy(() => import("./admin/pages/AppointmentsPage"))
const AnalyticsPage = lazy(() => import("./admin/pages/AnalysticsPage"))
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage"))
const ContentManagementPage = lazy(() => import("./admin/pages/ContentManagementPage"))
const PatientsPage = lazy(() => import("./admin/pages/PatientsPage"))
const SystemMonitoringPage = lazy(() => import("./admin/pages/SystemMonitoringPage"))
const UserRolesPage = lazy(() => import("./admin/pages/UserRolesPage"))

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/signup",
    element: <Signup />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/signin",
    element: <Signin />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/",
    element: <PrivateRoute />,
    errorElement: <ErrorFallback />,
    children: [
      // Doctor routes
      {
        path: "dashboard",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "profile",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "appointments",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "availability",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "statistics",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "reports",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "settings",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "help",
        element: <Dashboard />,
        errorElement: <ErrorFallback />,
      },

      // Admin routes - wrapped with Suspense for lazy loading
      {
        path: "admin-dashboard",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <AdminDashboard />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/doctors",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <DoctorsPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/appointments",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <AppointmentsPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/analytics",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <AnalyticsPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/settings",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <SettingsPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/content",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <ContentManagementPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/patients",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <PatientsPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/system",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <SystemMonitoringPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/user-roles",
        element: (
          <Suspense fallback={<AdminLoading />}>
            <UserRolesPage />
          </Suspense>
        ),
        errorElement: <ErrorFallback />,
      },
      {
        path: "admin/profile",
        element: <AdminProfilePage />,
        errorElement: <ErrorFallback />,
      },
    ],
  },
])

export { router }
