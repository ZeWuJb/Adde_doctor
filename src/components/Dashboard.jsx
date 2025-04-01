"use client"

import { useEffect, useState } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  Calendar,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Activity,
  Users,
  Settings,
  FileText,
  HelpCircle,
  BarChart,
} from "lucide-react"

import {
  getDoctorIdFromUserId,
  fetchDoctorAppointments,
  acceptTemporaryAppointment,
  rejectTemporaryAppointment,
} from "../services/appointmentService.js"
import { fetchDoctorStatistics, fetchRecentActivity } from "../services/dashboardService"
import AvailabilityManager from "./AvailabilityManager"
import ProfilePage from "./ProfilePage"
import AppointmentsPage from "./AppointmentsPage"
import StatisticsPage from "./StatisticsPage"
import PatientsPage from "./PatientsPage"
import ReportsPage from "./ReportsPage"
import SettingsPage from "./SettingsPage"
import HelpPage from "./HelpPage"
import DashboardContent from "./DashboardContent"
import NotificationsPanel from "./NotificationPanel"
import ConnectionStatus from "./ConnectionStatus"

import { useNavigate, useLocation } from "react-router-dom"
import { useSocketNotifications } from "../hooks/useSocketNotifications"

const DoctorDashboard = () => {
  const { session, userData, signOut } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  const { pendingAppointments, removeFromPending } = useSocketNotifications()

  const navigate = useNavigate()
  const location = useLocation()

  // Use userData directly if available
  useEffect(() => {
    if (userData && userData.id) {
      setDoctorId(userData.id)
    } else if (session?.user?.id) {
      // Fallback to fetching doctor ID if userData is not available
      const fetchDoctorId = async () => {
        try {
          const result = await getDoctorIdFromUserId(session.user.id)
          if (result.success) {
            setDoctorId(result.doctorId)
          } else {
            setError("Failed to retrieve doctor information")
            setLoading(false)
          }
        } catch (err) {
          console.error("Error fetching doctor ID:", err)
          setError("An unexpected error occurred")
          setLoading(false)
        }
      }

      fetchDoctorId()
    }
  }, [session, userData])

  // Then, fetch data once we have the doctor ID
  useEffect(() => {
    const fetchData = async () => {
      if (!doctorId) return

      try {
        setLoading(true)

        // Fetch appointments
        const appointmentsResult = await fetchDoctorAppointments(doctorId)
        if (appointmentsResult.success) {
          setAppointments(appointmentsResult.data)
        } else {
          setError("Failed to fetch appointments. Please try again later.")
        }

        // Fetch statistics
        const statsResult = await fetchDoctorStatistics(doctorId)
        if (statsResult.success) {
          setStatistics(statsResult.data)
        }

        // Fetch recent activity
        const activityResult = await fetchRecentActivity(doctorId, 3)
        if (activityResult.success) {
          setRecentActivity(activityResult.data)
        }
      } catch (err) {
        console.error("Error fetching data:", err.message)
        setError("An unexpected error occurred. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [doctorId])

  // Setup a polling mechanism to refresh data periodically
  useEffect(() => {
    if (!doctorId) return

    const refreshInterval = setInterval(() => {
      // Silently refresh data in the background
      const refreshData = async () => {
        try {
          // Refresh appointments
          const appointmentsResult = await fetchDoctorAppointments(doctorId)
          if (appointmentsResult.success) {
            setAppointments(appointmentsResult.data)
          }

          // Refresh statistics
          const statsResult = await fetchDoctorStatistics(doctorId)
          if (statsResult.success) {
            setStatistics(statsResult.data)
          }

          // Refresh activity
          const activityResult = await fetchRecentActivity(doctorId, 3)
          if (activityResult.success) {
            setRecentActivity(activityResult.data)
          }
        } catch (err) {
          console.error("Error refreshing data:", err.message)
          // Don't set UI error for background refresh
        }
      }

      refreshData()
    }, 60000) // Refresh every minute

    return () => clearInterval(refreshInterval)
  }, [doctorId])

  const handleSignOut = async () => {
    await signOut()
  }

  // Modified accept handler
  const handleAccept = async (id) => {
    try {
      // Find the appointment in the local state
      const appointment = pendingAppointments.find((appt) => appt.id === id || appt.appointmentId === id)

      if (!appointment) {
        setError("Appointment not found")
        return
      }

      console.log("Accepting appointment in Dashboard:", appointment)

      // Accept the temporary appointment
      const result = await acceptTemporaryAppointment(id)

      if (result.success) {
        console.log("Successfully saved appointment to database:", result.data)

        // Update the appointment in the local state
        setAppointments((prev) => [...prev, result.data])

        // Remove from pending appointments
        removeFromPending(id)

        // Refresh statistics after accepting
        const statsResult = await fetchDoctorStatistics(doctorId)
        if (statsResult.success) {
          setStatistics(statsResult.data)
        }

        // Open video conference link in a new tab
        if (result.data.video_conference_link) {
          window.open(result.data.video_conference_link, "_blank")
        }
      } else {
        console.error("Failed to save appointment:", result.error)
        setError("Failed to accept appointment: " + (result.error?.message || "Unknown error"))
      }
    } catch (err) {
      console.error("Error accepting appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  // Modified reject handler
  const handleReject = async (id) => {
    console.log("Rejecting appointment with ID:", id)

    try {
      // Reject the temporary appointment
      const result = await rejectTemporaryAppointment(id)

      if (result.success) {
        // Remove from pending appointments
        removeFromPending(id)

        // Refresh statistics
        const statsResult = await fetchDoctorStatistics(doctorId)
        if (statsResult.success) {
          setStatistics(statsResult.data)
        }
      } else {
        setError("Failed to reject appointment: " + (result.error?.message || "Unknown error"))
      }
    } catch (err) {
      console.error("Error rejecting appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const joinMeeting = (link) => {
    if (link) {
      window.open(link, "_blank")
    } else {
      setError("Video conference link is not available.")
    }
  }

  const toggleSidebarMinimized = () => {
    setSidebarMinimized(!sidebarMinimized)
  }

  // Get page title based on current route
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "Dashboard"
      case "/profile":
        return "Doctor Profile"
      case "/appointments":
        return "Patient Appointments"
      case "/availability":
        return "Availability Schedule"
      case "/statistics":
        return "Statistics & Analytics"
      case "/patients":
        return "Expectant Mothers"
      case "/reports":
        return "Medical Reports"
      case "/settings":
        return "Account Settings"
      case "/help":
        return "Help & Support"
      default:
        return ""
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${sidebarMinimized ? "md:w-20" : "w-64"}`}
      >
        <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <div className={`flex items-center ${sidebarMinimized ? "hidden" : "block"}`}>
              <Heart className="mr-2" size={20} />
              <span className="text-xl font-bold">CareSync</span>
            </div>

            {/* Toggle Button */}
            <button
              onClick={toggleSidebarMinimized}
              className="md:flex hidden items-center justify-center w-8 h-8 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarMinimized ? (
                <ChevronRight size={18} className="text-white" />
              ) : (
                <ChevronLeft size={18} className="text-white" />
              )}
            </button>
          </div>

          {/* User Information */}
          <div className="flex flex-col items-center py-6 border-b border-gray-100">
            <div
              className={`relative ${sidebarMinimized ? "w-10 h-10" : "w-16 h-16 mb-2"} rounded-full bg-pink-50 flex items-center justify-center border-2 border-pink-100`}
            >
              {session?.user?.user_metadata?.avatar_url ? (
                <img
                  src={session.user.user_metadata.avatar_url || "/placeholder.svg?height=64&width=64"}
                  alt="Profile"
                  className={`w-full h-full rounded-full object-cover ${sidebarMinimized ? "rounded-sm" : ""}`}
                />
              ) : (
                <User size={sidebarMinimized ? 18 : 28} className="text-pink-600" />
              )}
            </div>

            {/* User Info Text - Only visible when expanded */}
            {!sidebarMinimized && (
              <>
                <h2 className="text-lg font-medium text-gray-800 mt-2">
                  {userData?.full_name || session?.userData?.full_name || "Doctor"}
                </h2>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto ${sidebarMinimized ? "px-2" : "px-4"} py-4`}>
            <ul className="space-y-1.5">
              {[
                { name: "Dashboard", icon: Activity, path: "/dashboard" },
                { name: "Profile", icon: User, path: "/profile" },
                { name: "Appointments", icon: Clock, path: "/appointments" },
                { name: "Availability", icon: Calendar, path: "/availability" },
                { name: "Statistics", icon: BarChart, path: "/statistics" },
                { name: "Patients", icon: Users, path: "/patients" },
                { name: "Reports", icon: FileText, path: "/reports" },
                { name: "Settings", icon: Settings, path: "/settings" },
                { name: "Help", icon: HelpCircle, path: "/help" },
              ].map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`flex items-center w-full py-2.5 rounded-lg transition-all ${
                      location.pathname === item.path
                        ? "bg-pink-500 text-white font-medium"
                        : "text-gray-400 hover:bg-gray-100 hover:text-pink-600"
                    } ${sidebarMinimized ? "justify-center px-2" : "px-4"}`}
                    title={item.name}
                  >
                    <item.icon
                      className={`${sidebarMinimized ? "" : "mr-3"} h-5 w-5 ${
                        location.pathname === item.path ? "text-white" : "text-gray-400"
                      }`}
                    />
                    {!sidebarMinimized && <span className="flex-1">{item.name}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sign Out Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className={`flex items-center justify-center w-full px-4 py-2 text-sm rounded-lg transition-all ${
                sidebarMinimized
                  ? "bg-red-500 hover:bg-red-600 text-white p-2"
                  : "text-red-600 hover:bg-red-50 hover:text-red-700"
              }`}
              title="Sign Out"
            >
              <LogOut
                className={`${sidebarMinimized ? "" : "mr-2"} ${sidebarMinimized ? "text-white" : "text-red-500"}`}
                size={20}
              />
              {!sidebarMinimized && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full transition-all duration-300 ${sidebarMinimized ? "md:ml-20" : "md:ml-64"}`}>
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden focus:outline-none"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className="ml-4 md:ml-0">
                <h2 className="text-lg font-medium text-gray-800">{getPageTitle()}</h2>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsPanel />

              <div className="relative">
                <button onClick={() => navigate("/profile")} className="flex items-center focus:outline-none">
                  <div className="w-9 h-9 rounded-full bg-pink-50 flex items-center justify-center border border-pink-100">
                    {session?.user?.user_metadata?.avatar_url ? (
                      <img
                        src={session.user.user_metadata.avatar_url || "/placeholder.svg?height=36&width=36"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-pink-600" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 overflow-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {(() => {
            switch (location.pathname) {
              case "/dashboard":
                return (
                  <DashboardContent
                    statistics={statistics}
                    appointments={[...appointments, ...pendingAppointments]}
                    recentActivity={recentActivity}
                    loading={loading}
                    handleAccept={handleAccept}
                    handleReject={handleReject}
                    joinMeeting={joinMeeting}
                  />
                )
              case "/profile":
                return <ProfilePage />
              case "/appointments":
                return <AppointmentsPage />
              case "/availability":
                return <AvailabilityManager />
              case "/statistics":
                return <StatisticsPage />
              case "/patients":
                return <PatientsPage />
              case "/reports":
                return <ReportsPage />
              case "/settings":
                return <SettingsPage />
              case "/help":
                return <HelpPage />
              default:
                return <div>Page not found</div>
            }
          })()}
        </main>

        {/* Connection status indicator */}
        <ConnectionStatus />
      </div>
    </div>
  )
}

export default DoctorDashboard

