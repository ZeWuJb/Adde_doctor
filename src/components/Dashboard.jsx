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
import ReportsPage from "./ReportsPage"
import SettingsPage from "./SettingsPage"
import HelpPage from "./HelpPage"
import DashboardContent from "./DashboardContent"
import NotificationsPanel from "./NotificationPanel"
import ConnectionStatus from "./ConnectionStatus"

import { useNavigate, useLocation } from "react-router-dom"
import { useSocketNotifications } from "../hooks/useSocketNotifications"
import { supabase } from "../supabaseClient"
import { getImageSrc } from "../services/imageService"

const DoctorDashboard = () => {
  const { session, signOut } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarMinimized, setSidebarMinimized] = useState(false)
  const { pendingAppointments, removeFromPending } = useSocketNotifications()
  const [userData, setUserData] = useState(null)
  const [isMobile, setIsMobile] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      // Auto-close sidebar on mobile when screen gets too small
      if (mobile) {
        setSidebarOpen(false)
        setSidebarMinimized(false)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Use userData directly if available
  useEffect(() => {
    if (session?.user?.id) {
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
  }, [session])

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

  // Add this after the existing useEffect for fetching doctor ID
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!doctorId) return

      try {
        // Fetch doctor profile including profile_url
        const { data: doctorProfile, error } = await supabase
          .from("doctors")
          .select("profile_url, full_name")
          .eq("id", doctorId)
          .single()

        if (error) {
          console.error("Error fetching doctor profile:", error)
          return
        }

        // Update userData with profile information
        if (doctorProfile) {
          setUserData({
            profile_url: doctorProfile.profile_url,
            full_name: doctorProfile.full_name,
          })
        }
      } catch (err) {
        console.error("Error fetching doctor profile:", err)
      }
    }

    fetchDoctorProfile()

    // Set up real-time subscription for profile updates
    if (doctorId) {
      const subscription = supabase
        .channel(`doctor-profile-${doctorId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "doctors",
            filter: `id=eq.${doctorId}`,
          },
          (payload) => {
            console.log("Doctor profile updated:", payload.new)
            setUserData({
              profile_url: payload.new.profile_url,
              full_name: payload.new.full_name,
            })
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [doctorId])

  const handleSignOut = async () => {
    try {
      console.log("Doctor dashboard: Starting sign out...")
      const result = await signOut()
      if (result.success) {
        console.log("Doctor dashboard: Sign out successful, redirecting...")
        navigate("/signin")
      } else {
        console.error("Doctor dashboard: Sign out failed:", result.error)
        // Even if signout fails, redirect to signin
        navigate("/signin")
      }
    } catch (err) {
      console.error("Doctor dashboard: Sign out error:", err)
      // Even if there's an error, redirect to signin
      navigate("/signin")
    }
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

        // Store the video conference link but don't automatically open it
        if (result.data.video_conference_link) {
          console.log("Video conference link available:", result.data.video_conference_link)
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
    if (!isMobile) {
      setSidebarMinimized(!sidebarMinimized)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
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
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          isMobile
            ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") + " w-64"
            : (sidebarOpen || !isMobile ? "translate-x-0" : "-translate-x-full") +
              (sidebarMinimized ? " w-20" : " w-64")
        }`}
      >
        <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <div className={`flex items-center ${sidebarMinimized && !isMobile ? "hidden" : "block"}`}>
              <Heart className="mr-2" size={20} />
              <span className="text-xl font-bold">CareSync</span>
            </div>

            {/* Toggle Buttons */}
            <div className="flex items-center space-x-2">
              {/* Mobile Close Button */}
              {isMobile && (
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                  aria-label="Close sidebar"
                >
                  <X size={18} className="text-white" />
                </button>
              )}

              {/* Desktop Minimize/Expand Button */}
              {!isMobile && (
                <button
                  onClick={toggleSidebarMinimized}
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                  aria-label={sidebarMinimized ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarMinimized ? (
                    <ChevronRight size={18} className="text-white" />
                  ) : (
                    <ChevronLeft size={18} className="text-white" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Information */}
          <div className="flex flex-col items-center py-6 border-b border-gray-100">
            <div
              className={`relative ${sidebarMinimized && !isMobile ? "w-10 h-10" : "w-16 h-16 mb-2"} rounded-full bg-pink-50 flex items-center justify-center border-2 border-pink-100 overflow-hidden`}
            >
              {userData?.profile_url ? (
                <img
                  src={getImageSrc(userData.profile_url) || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log("Image failed to load:", userData.profile_url)
                    e.target.style.display = "none"
                    e.target.nextSibling.style.display = "flex"
                  }}
                />
              ) : null}
              <User
                size={sidebarMinimized && !isMobile ? 18 : 28}
                className="text-pink-600"
                style={{ display: userData?.profile_url ? "none" : "flex" }}
              />
            </div>

            {/* User Info Text - Only visible when expanded */}
            {(!sidebarMinimized || isMobile) && (
              <>
                <h2 className="text-lg font-medium text-gray-800 mt-2">
                  {userData?.full_name || session?.user?.user_metadata?.full_name || "Doctor"}
                </h2>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto ${sidebarMinimized && !isMobile ? "px-2" : "px-4"} py-4`}>
            <ul className="space-y-1.5">
              {[
                { name: "Dashboard", icon: Activity, path: "/dashboard" },
                { name: "Profile", icon: User, path: "/profile" },
                { name: "Appointments", icon: Clock, path: "/appointments" },
                { name: "Availability", icon: Calendar, path: "/availability" },
                { name: "Statistics", icon: BarChart, path: "/statistics" },
                { name: "Reports", icon: FileText, path: "/reports" },
                { name: "Settings", icon: Settings, path: "/settings" },
                { name: "Help", icon: HelpCircle, path: "/help" },
              ].map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      navigate(item.path)
                      if (isMobile) setSidebarOpen(false)
                    }}
                    className={`flex items-center w-full py-2.5 rounded-lg transition-all ${
                      location.pathname === item.path
                        ? "bg-pink-500 text-white font-medium"
                        : "text-gray-400 hover:bg-gray-100 hover:text-pink-600"
                    } ${sidebarMinimized && !isMobile ? "justify-center px-2" : "px-4"}`}
                    title={item.name}
                  >
                    <item.icon
                      className={`${sidebarMinimized && !isMobile ? "" : "mr-3"} h-5 w-5 ${
                        location.pathname === item.path ? "text-white" : "text-gray-400"
                      }`}
                    />
                    {(!sidebarMinimized || isMobile) && <span className="flex-1">{item.name}</span>}
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
                sidebarMinimized && !isMobile
                  ? "bg-red-500 hover:bg-red-600 text-white p-2"
                  : "text-red-600 hover:bg-red-50 hover:text-red-700"
              }`}
              title="Sign Out"
            >
              <LogOut
                className={`${sidebarMinimized && !isMobile ? "" : "mr-2"} ${sidebarMinimized && !isMobile ? "text-white" : "text-red-500"}`}
                size={20}
              />
              {(!sidebarMinimized || isMobile) && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 w-full transition-all duration-300 ${
          isMobile ? "ml-0" : sidebarMinimized ? "ml-20" : "ml-64"
        }`}
      >
        {/* Top Navigation */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className={`p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none ${
                  isMobile ? "block" : "hidden"
                }`}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              <div className={`${isMobile ? "ml-4" : "ml-0"}`}>
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

              {/* Also update the top navigation avatar */}
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
