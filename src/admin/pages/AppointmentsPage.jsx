"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { Search, Filter, Calendar, AlertCircle, ChevronDown, User } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"
import { useAdmin } from "../../hooks/useAdmin"

const AppointmentsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { loading, error, appointments } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const location = useLocation()

  useEffect(() => {
    console.log("Filtering appointments. Total appointments:", appointments.length)

    if (!appointments.length) {
      setFilteredAppointments([])
      return
    }

    const filtered = appointments.filter((appt) => {
      const matchesSearch = searchTerm
        ? appt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      const matchesStatus = statusFilter === "all" ? true : appt.status === statusFilter
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const appointmentDate = new Date(appt.requested_time)

      let matchesDate = true
      switch (dateFilter) {
        case "today": {
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          matchesDate = appointmentDate >= today && appointmentDate < tomorrow
          break
        }
        case "upcoming": {
          matchesDate = appointmentDate >= today
          break
        }
        case "thisWeek": {
          const nextWeek = new Date(today)
          nextWeek.setDate(nextWeek.getDate() + 7)
          matchesDate = appointmentDate >= today && appointmentDate < nextWeek
          break
        }
        case "past": {
          matchesDate = appointmentDate < today
          break
        }
        default: {
          matchesDate = true
          break
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })

    console.log("Filtered appointments:", filtered.length)
    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, dateFilter])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleImageError = (e) => {
    const parent = e.target.parentNode
    const iconDiv = document.createElement("div")
    iconDiv.className = e.target.className + " flex items-center justify-center bg-gray-200"

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "60%")
    svg.setAttribute("height", "60%")
    svg.setAttribute("viewBox", "0 0 24 24")
    svg.setAttribute("fill", "none")
    svg.setAttribute("stroke", "currentColor")
    svg.setAttribute("stroke-width", "2")
    svg.setAttribute("stroke-linecap", "round")
    svg.setAttribute("stroke-linejoin", "round")

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path1.setAttribute("d", "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2")
    svg.appendChild(path1)

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    circle.setAttribute("cx", "12")
    circle.setAttribute("cy", "7")
    circle.setAttribute("r", "4")
    svg.appendChild(circle)

    iconDiv.appendChild(svg)
    parent.replaceChild(iconDiv, e.target)
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          session={session}
          userData={userData}
          handleSignOut={handleSignOut}
          currentPath={location.pathname}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <div
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
        >
          <AdminHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            session={session}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                <p className="ml-3 text-lg text-gray-700">Loading appointments...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location.pathname}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          session={session}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Appointments Management</h1>
              <p className="text-pink-100">Monitor and manage all appointments in the system</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filters
                <ChevronDown
                  className={`ml-2 h-4 w-4 transform ${showFilters ? "rotate-180" : ""} transition-transform`}
                />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">All</option>
                      <option value="today">Today</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="thisWeek">This Week</option>
                      <option value="past">Past</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-800">Appointments</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredAppointments.length} of {appointments.length} appointments
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => (
                    <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 h-12 w-12 relative rounded-full overflow-hidden">
                            {appointment.patientAvatar ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover"
                                src={
                                  appointment.patientAvatar.startsWith("data:")
                                    ? appointment.patientAvatar
                                    : `data:image/jpeg;base64,${appointment.patientAvatar}`
                                }
                                alt={appointment.patientName}
                                onError={handleImageError}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full flex items-center justify-center bg-gray-200">
                                <User className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-lg font-medium text-gray-900">{appointment.patientName}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(appointment.requested_time)} at {formatTime(appointment.requested_time)}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden">
                              {appointment.doctorAvatar ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={
                                    appointment.doctorAvatar.startsWith("data:")
                                      ? appointment.doctorAvatar
                                      : `data:image/jpeg;base64,${appointment.doctorAvatar}`
                                  }
                                  alt={appointment.doctorName}
                                  onError={handleImageError}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-200">
                                  <User className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{appointment.doctorName}</p>
                              <p className="text-xs text-gray-500">{appointment.doctorSpecialty}</p>
                            </div>
                          </div>

                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "accepted"
                                  ? "bg-blue-100 text-blue-800"
                                  : appointment.status === "cancelled" || appointment.status === "declined"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                    <p className="text-gray-600">
                      {appointments.length === 0
                        ? "No appointments found in the system."
                        : "No appointments found matching your criteria."}
                    </p>
                    {(searchTerm || statusFilter !== "all" || dateFilter !== "all") && (
                      <button
                        onClick={() => {
                          setSearchTerm("")
                          setStatusFilter("all")
                          setDateFilter("all")
                        }}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppointmentsPage
