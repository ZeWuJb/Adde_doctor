"use client"

import { useEffect, useState } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  Calendar,
  Clock,
  User,
  Bell,
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

import { getDoctorIdFromUserId, fetchDoctorAppointments, updateAppointmentStatus } from "../services/appointmentService"
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

// Add this import at the top of the file:
import { useSocketNotifications } from "../services/serverio"

import { useNavigate, useLocation } from "react-router-dom"

// Update the Dashboard component to remove the unused activeTab prop
const DoctorDashboard = () => {
  // Add this near the beginning of the component function:
  const { unreadCount: unreadNotifications } = useSocketNotifications()
  // Update to use userData directly from context
  const { session, userData, signOut } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)

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

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAccept = async (id) => {
    try {
      const result = await updateAppointmentStatus(id, "accepted")

      if (result.success) {
        setAppointments(
          appointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status: "accepted", video_conference_link: result.data.video_conference_link }
              : appointment,
          ),
        )

        // Refresh statistics after accepting
        const statsResult = await fetchDoctorStatistics(doctorId)
        if (statsResult.success) {
          setStatistics(statsResult.data)
        }
      } else {
        setError("Failed to accept appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error accepting appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleReject = async (id) => {
    try {
      const result = await updateAppointmentStatus(id, "declined")

      if (result.success) {
        setAppointments(
          appointments.map((appointment) =>
            appointment.id === id ? { ...appointment, status: "declined" } : appointment,
          ),
        )

        // Refresh statistics after declining
        const statsResult = await fetchDoctorStatistics(doctorId)
        if (statsResult.success) {
          setStatistics(statsResult.data)
        }
      } else {
        setError("Failed to decline appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error declining appointment:", err.message)
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 health-sidebar transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${sidebarMinimized ? "md:w-20" : "w-60"}`}
      >
        <div className="flex flex-col h-full bg-white border-r border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-primary-600 text-white">
            <div className={`flex items-center ${sidebarMinimized ? "hidden" : "block"}`}>
              <Heart className="mr-2" size={20} />
              <span className="text-xl font-bold">CareSync</span>
            </div>

            {/* Toggle Button */}
            <button
              onClick={toggleSidebarMinimized}
              className="md:block hidden items-center justify-center w-2 h-9 bg-primary-600 rounded-md border-primary-600 transition-colors duration-300"
              aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarMinimized ? (
                <ChevronRight size={20} className="text-white" />
              ) : (
                <ChevronLeft size={20} className="text-white" />
              )}
            </button>
          </div>

          {/* User Information */}
          <div className="flex flex-col items-center py-6 border-b border-gray-100">
            <div
              className={`relative w-16 h-16 mb-2 rounded-full bg-teal-50 flex items-center justify-center border-2 border-teal-100 ${sidebarMinimized ? "w-10 h-10" : ""}`}
            >
              {session?.user?.user_metadata?.avatar_url ? (
                <img
                  src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                  alt="Profile"
                  className={`w-full h-full rounded-full object-cover ${sidebarMinimized ? "rounded-sm" : ""}`}
                />
              ) : (
                <User size={sidebarMinimized ? 18 : 28} className="text-teal-600" />
              )}
            </div>

            {/* User Info Text - Only visible when expanded */}
            {!sidebarMinimized && (
              <>
                {/* Update the user info display to use userData */}
                <h2 className="text-lg font-medium text-gray-800 mt-2">
                  {userData?.full_name || session?.userData?.full_name || "Doctor"}
                </h2>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto ${sidebarMinimized ? "px-2" : "px-4"}`}>
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
                    className={`health-nav-item flex items-center w-full py-2 rounded-md transition-all ${
                      location.pathname === item.path ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-600"
                    }`}
                    title={item.name}
                  >
                    <item.icon className="icon mr-2" size={20} />
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
                sidebarMinimized ? "bg-red-500 hover:bg-red-600 text-white p-2" : "hover:bg-red-50 text-red-700"
              }`}
              title="Sign Out"
            >
              <LogOut
                className={`${sidebarMinimized ? "" : "mr-2"} ${sidebarMinimized ? "text-white" : ""}`}
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
                <h2 className="text-lg font-medium text-gray-800">
                  {location.pathname === "/dashboard"
                    ? "Dashboard"
                    : location.pathname === "/availability"
                      ? "Availability Management"
                      : location.pathname === "/profile"
                        ? "Profile"
                        : location.pathname === "/appointments"
                          ? "Appointments"
                          : location.pathname === "/statistics"
                            ? "Statistics & Analytics"
                            : location.pathname === "/patients"
                              ? "Patients"
                              : location.pathname === "/reports"
                                ? "Reports"
                                : location.pathname === "/settings"
                                  ? "Settings"
                                  : location.pathname === "/help"
                                    ? "Help"
                                    : ""}
                </h2>
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
              <button
                className="relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              <div className="relative">
                <button onClick={() => navigate("/profile")} className="flex items-center focus:outline-none">
                  <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100">
                    {session?.user?.user_metadata?.avatar_url ? (
                      <img
                        src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-teal-600" />
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
                    appointments={appointments}
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
      </div>
    </div>
  )
}

// Remove the prop types validation since we're not using props anymore
export default DoctorDashboard

