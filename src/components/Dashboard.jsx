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
  Video,
  BarChart,
} from "lucide-react"

import { getDoctorIdFromUserId, fetchDoctorAppointments, updateAppointmentStatus } from "../services/appointmentService"
import { fetchDoctorStatistics, fetchRecentActivity } from "../services/dashboardService"
import AvailabilityManager from "./AvailabilityManager"
import ProfilePage from "./ProfilePage"
import AppointmentsPage from "./AppointmentsPage"
import StatisticsPage from "./StatisticsPage"

// Add prop type validation for the Dashboard component
import PropTypes from "prop-types"

// Add this import at the top of the file:
import { useSocketNotifications } from "../services/serverio"

// Update the Dashboard component to accept activeTab prop for direct navigation
const DoctorDashboard = ({ activeTab: initialActiveTab }) => {
  // Add this near the beginning of the component function:
  const { notifications, unreadCount: unreadNotifications } = useSocketNotifications()
  // Update to use userData directly from context
  const { session, userData, signOut } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(initialActiveTab || "dashboard")
  const [sidebarMinimized, setSidebarMinimized] = useState(false)

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
            {/* Main Section */}
            {!sidebarMinimized && (
              <div className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">Main</div>
            )}

            <ul className="space-y-1.5">
              {/* Dashboard */}
              <li>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`health-nav-item flex items-center w-full py-2 rounded-md transition-all ${
                    activeTab === "dashboard" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-600"
                  }`}
                  title="Dashboard"
                >
                  <Activity className="icon mr-2" size={20} />
                  {!sidebarMinimized && <span className="flex-1">Dashboard</span>}
                </button>
              </li>

              {/* Profile */}
              <li>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`health-nav-item flex items-center w-full py-2 rounded-md transition-all ${
                    activeTab === "profile" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-600"
                  }`}
                  title="Profile"
                >
                  <User className="icon mr-2" size={20} />
                  {!sidebarMinimized && <span className="flex-1">Profile</span>}
                </button>
              </li>

              {/* Appointments */}
              <li>
                <button
                  onClick={() => setActiveTab("appointments")}
                  className={`health-nav-item flex items-center w-full py-2 rounded-md transition-all ${
                    activeTab === "appointments" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-600"
                  }`}
                  title="Appointments"
                >
                  <Clock className="icon mr-2" size={20} />
                  {!sidebarMinimized && <span className="flex-1">Appointments</span>}
                </button>
              </li>

              {/* Availability */}
              <li>
                <button
                  onClick={() => setActiveTab("availability")}
                  className={`health-nav-item flex items-center w-full py-2 rounded-md transition-all ${
                    activeTab === "availability" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-600"
                  }`}
                  title="Availability"
                >
                  <Calendar className="icon mr-2" size={20} />
                  {!sidebarMinimized && <span className="flex-1">Availability</span>}
                </button>
              </li>

              {/* Statistics */}
              <li>
                <button
                  onClick={() => setActiveTab("statistics")}
                  className={`health-nav-item flex items-center w-full py-2 rounded-md transition-all ${
                    activeTab === "statistics" ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-600"
                  }`}
                  title="Statistics"
                >
                  <BarChart className="icon mr-2" size={20} />
                  {!sidebarMinimized && <span className="flex-1">Statistics</span>}
                </button>
              </li>

              {/* Patients */}
              <li>
                <a
                  href="#"
                  className={`health-nav-item flex items-center w-full py-2 rounded-md hover:bg-gray-50 text-gray-600 transition-colors`}
                  title="Patients"
                >
                  <Users className="icon mr-2" size={20} />
                  {!sidebarMinimized && <span className="flex-1">Patients</span>}
                </a>
              </li>

              {/* Other Section */}
              {!sidebarMinimized && (
                <>
                  <div className="mt-8 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">
                    Other
                  </div>

                  {/* Reports */}
                  <li>
                    <a
                      href="#"
                      className={`health-nav-item flex items-center w-full py-2 rounded-md hover:bg-gray-50 text-gray-600 transition-colors`}
                      title="Reports"
                    >
                      <FileText className="icon mr-2" size={20} />
                      <span className="flex-1">Reports</span>
                    </a>
                  </li>

                  {/* Settings */}
                  <li>
                    <a
                      href="#"
                      className={`health-nav-item flex items-center w-full py-2 rounded-md hover:bg-gray-50 text-gray-600 transition-colors`}
                      title="Settings"
                    >
                      <Settings className="icon mr-2" size={20} />
                      <span className="flex-1">Settings</span>
                    </a>
                  </li>

                  {/* Help */}
                  <li>
                    <a
                      href="#"
                      className={`health-nav-item flex items-center w-full py-2 rounded-md hover:bg-gray-50 text-gray-600 transition-colors`}
                      title="Help"
                    >
                      <HelpCircle className="icon mr-2" size={20} />
                      <span className="flex-1">Help</span>
                    </a>
                  </li>
                </>
              )}
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
                  {activeTab === "dashboard"
                    ? "Dashboard"
                    : activeTab === "availability"
                      ? "Availability Management"
                      : activeTab === "profile"
                        ? "Profile"
                        : activeTab === "appointments"
                          ? "Appointments"
                          : activeTab === "statistics"
                            ? "Statistics & Analytics"
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
                <button onClick={() => setActiveTab("profile")} className="flex items-center focus:outline-none">
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

          {activeTab === "dashboard" ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">
                  Welcome, {userData?.full_name || session?.userData?.full_name || "Doctor"}!
                </h1>
                <p className="text-gray-600">Here`s your practice overview for today</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="health-stat-card p-6">
                  <div className="flex items-center">
                    <div className="health-icon-bg health-icon-bg-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-500">Today`s Appointments</h2>
                      <p className="text-2xl font-semibold text-gray-800">{statistics?.todaysAppointments || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="text-teal-600 font-medium">
                        {statistics
                          ? Math.round((statistics.todaysAppointments / (statistics.totalAppointments || 1)) * 100)
                          : 0}
                        %
                      </span>{" "}
                      of your total appointments
                    </p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5">
                      <div
                        className="h-1.5 bg-teal-500 rounded-full"
                        style={{
                          width: `${statistics ? Math.round((statistics.todaysAppointments / (statistics.totalAppointments || 1)) * 100) : 0}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="health-stat-card p-6">
                  <div className="flex items-center">
                    <div className="health-icon-bg health-icon-bg-success">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-500">Total Patients</h2>
                      <p className="text-2xl font-semibold text-gray-800">{statistics?.uniquePatients || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="text-green-600 font-medium">+12%</span> from last month
                    </p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5">
                      <div className="h-1.5 bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="health-stat-card p-6">
                  <div className="flex items-center">
                    <div className="health-icon-bg health-icon-bg-warning">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-500">Pending Requests</h2>
                      <p className="text-2xl font-semibold text-gray-800">{statistics?.pendingAppointments || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="text-yellow-600 font-medium">{statistics?.pendingAppointments || 0}</span>{" "}
                      requests need your attention
                    </p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5">
                      <div
                        className="h-1.5 bg-yellow-500 rounded-full"
                        style={{ width: `${Math.min(100, (statistics?.pendingAppointments || 0) * 10)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="health-stat-card p-6">
                  <div className="flex items-center">
                    <div className="health-icon-bg health-icon-bg-secondary">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-sm font-medium text-gray-500">Consultations Given</h2>
                      <p className="text-2xl font-semibold text-gray-800">{statistics?.consultationsGiven || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      <span className="text-blue-600 font-medium">+8%</span> from last week
                    </p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: "78%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Appointment Card */}
              {statistics?.nextAppointment && (
                <div className="mb-8 health-card p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Video className="mr-2 text-teal-600" size={20} />
                    Next Appointment
                  </h2>
                  <div className="flex items-center">
                    <img
                      src={statistics.nextAppointment.mothers.profile_url || "/placeholder.svg?height=64&width=64"}
                      alt={statistics.nextAppointment.mothers.full_name}
                      className="w-16 h-16 rounded-full mr-4 border-2 border-teal-100"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {statistics.nextAppointment.mothers.full_name}
                      </h3>
                      <div className="flex items-center text-gray-600 mt-1">
                        <Calendar className="w-4 h-4 mr-1 text-teal-600" />
                        <span className="text-sm">
                          {new Date(statistics.nextAppointment.requested_time).toLocaleDateString()}
                        </span>
                        <Clock className="w-4 h-4 ml-3 mr-1 text-teal-600" />
                        <span className="text-sm">
                          {new Date(statistics.nextAppointment.requested_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm text-gray-600 mr-2">Payment:</span>
                        <span
                          className={`health-badge ${
                            statistics.nextAppointment.payment_status === "paid"
                              ? "health-badge-success"
                              : "health-badge-warning"
                          }`}
                        >
                          {statistics.nextAppointment.payment_status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => joinMeeting(statistics.nextAppointment.video_conference_link)}
                      className="health-btn health-btn-primary flex items-center"
                    >
                      <Video className="mr-2" size={16} />
                      Join Video Call
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Activity className="mr-2 text-teal-600" size={20} />
                    Recent Activity
                  </h2>
                  <button
                    onClick={() => setActiveTab("statistics")}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View All
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                  ) : recentActivity.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                              <img
                                src={activity.mothers.profile_url || "/placeholder.svg?height=40&width=40"}
                                alt={activity.mothers.full_name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium text-gray-900">{activity.mothers.full_name}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(activity.updated_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.status === "accepted"
                                  ? "Appointment accepted"
                                  : activity.status === "declined"
                                    ? "Appointment declined"
                                    : "Requested an appointment"}
                              </p>
                              <div className="mt-2 flex items-center">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    activity.status === "accepted"
                                      ? "bg-green-100 text-green-800"
                                      : activity.status === "declined"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Activity className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No recent activity</p>
                      <p className="text-gray-400 text-sm">Your recent activities will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Calendar className="mr-2 text-teal-600" size={20} />
                    Upcoming Appointments
                  </h2>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View All
                  </button>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
                  {loading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                    </div>
                  ) : appointments.length > 0 ? (
                    <table className="health-table">
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Date & Time</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments
                          .filter((a) => new Date(a.requested_time) > new Date())
                          .sort((a, b) => new Date(a.requested_time) - new Date(b.requested_time))
                          .slice(0, 5)
                          .map((appointment) => (
                            <tr key={appointment.id}>
                              <td>
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img
                                      className="h-10 w-10 rounded-full border border-gray-200"
                                      src={appointment.mothers.profile_url || "/placeholder.svg?height=40&width=40"}
                                      alt=""
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {appointment.mothers.full_name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="text-sm text-gray-900 font-medium">
                                  {new Date(appointment.requested_time).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(appointment.requested_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`health-badge ${
                                    appointment.payment_status === "paid"
                                      ? "health-badge-success"
                                      : "health-badge-warning"
                                  }`}
                                >
                                  {appointment.payment_status}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`health-badge ${
                                    appointment.status === "accepted"
                                      ? "health-badge-success"
                                      : appointment.status === "declined"
                                        ? "health-badge-danger"
                                        : "health-badge-warning"
                                  }`}
                                >
                                  {appointment.status}
                                </span>
                              </td>
                              <td>
                                {appointment.status === "pending" ? (
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleAccept(appointment.id)}
                                      className="health-btn health-btn-success py-1 px-3 text-xs"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleReject(appointment.id)}
                                      className="health-btn health-btn-danger py-1 px-3 text-xs"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                ) : appointment.status === "accepted" ? (
                                  <button
                                    onClick={() => joinMeeting(appointment.video_conference_link)}
                                    className="health-btn health-btn-secondary py-1 px-3 text-xs flex items-center"
                                  >
                                    <Video className="mr-1" size={12} />
                                    Join Call
                                  </button>
                                ) : (
                                  <span className="text-gray-500 text-xs">Declined</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg">No appointments found</p>
                      <p className="text-gray-400 text-sm">You don`t have any appointments scheduled yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === "availability" ? (
            <AvailabilityManager />
          ) : activeTab === "profile" ? (
            <ProfilePage />
          ) : activeTab === "appointments" ? (
            <AppointmentsPage />
          ) : activeTab === "statistics" ? (
            <StatisticsPage />
          ) : null}
        </main>
      </div>
    </div>
  )
}

DoctorDashboard.propTypes = {
  activeTab: PropTypes.string,
}

export default DoctorDashboard

