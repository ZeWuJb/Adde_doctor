"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  fetchDoctorAppointments,
  getDoctorIdFromUserId,
  updateAppointmentStatus,
  updatePaymentStatus,
} from "../services/appointmentService"
import {
  Calendar,
  Search,
  Filter,
  ChevronDown,
  Video,
  Check,
  X,
  AlertCircle,
  Clock,
  User,
  DollarSign,
} from "lucide-react"
import { useSocketNotifications } from "../hooks/useSocketNotifications"
import socketService from "../services/socketService"

const AppointmentsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  const { pendingAppointments } = useSocketNotifications()

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

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
  }, [session])

  // Then, load appointments once we have the doctor ID
  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
        const result = await fetchDoctorAppointments(doctorId)

        if (result.success) {
          setAppointments(result.data)
          setFilteredAppointments(result.data)
        } else {
          setError("Failed to load appointments")
        }
      } catch (err) {
        console.error("Error loading appointments:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadAppointments()
  }, [doctorId])

  // Update appointments when new pending appointments are received
  useEffect(() => {
    if (pendingAppointments.length > 0) {
      setAppointments((prevAppointments) => {
        const updatedAppointments = [...prevAppointments]

        pendingAppointments.forEach((pendingAppt) => {
          const existingIndex = updatedAppointments.findIndex((appt) => appt.id === pendingAppt.appointmentId)

          if (existingIndex === -1) {
            updatedAppointments.push({
              id: pendingAppt.appointmentId,
              requested_time: pendingAppt.requested_time,
              status: "pending",
              payment_status: "unpaid",
              mothers: {
                id: pendingAppt.mother_id,
                full_name: pendingAppt.mother_name || "New Patient",
                profile_url: pendingAppt.profile_url || null,
              },
            })
          }
        })

        return updatedAppointments
      })
    }
  }, [pendingAppointments])

  // Apply filters when they change
  useEffect(() => {
    if (!appointments.length) return

    let filtered = [...appointments]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((appointment) =>
        appointment.mothers.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((appointment) => appointment.status === statusFilter)
    }

    // Apply date filter
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    if (dateFilter === "today") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate >= today && appointmentDate < tomorrow
      })
    } else if (dateFilter === "upcoming") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate >= today
      })
    } else if (dateFilter === "thisWeek") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate >= today && appointmentDate < nextWeek
      })
    } else if (dateFilter === "past") {
      filtered = filtered.filter((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        return appointmentDate < today
      })
    }

    setFilteredAppointments(filtered)
  }, [appointments, searchTerm, statusFilter, dateFilter])

  // Update the handleAccept function to use socketService
  const handleAccept = async (id) => {
    try {
      // First update in the database
      const result = await updateAppointmentStatus(id, "accepted")

      if (result.success) {
        // Then notify via socket
        socketService.acceptAppointment(id)

        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id
              ? { ...appointment, status: "accepted", video_conference_link: result.data.video_conference_link }
              : appointment,
          ),
        )
      } else {
        setError("Failed to accept appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error accepting appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  // Update the handleReject function to use socketService
  const handleReject = async (id) => {
    try {
      // First update in the database
      const result = await updateAppointmentStatus(id, "declined")

      if (result.success) {
        // Then notify via socket
        socketService.declineAppointment(id)

        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id ? { ...appointment, status: "declined" } : appointment,
          ),
        )
      } else {
        setError("Failed to decline appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error declining appointment:", err.message)
      setError("An unexpected error occurred. Please try again.")
    }
  }

  const handleUpdatePayment = async (id, status) => {
    try {
      const result = await updatePaymentStatus(id, status)

      if (result.success) {
        setAppointments((prevAppointments) =>
          prevAppointments.map((appointment) =>
            appointment.id === id ? { ...appointment, payment_status: status } : appointment,
          ),
        )
      } else {
        setError(`Failed to update payment status. Please try again.`)
      }
    } catch (err) {
      console.error("Error updating payment status:", err.message)
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

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date()
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentBadgeClass = (status) => {
    return status === "paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Maternal Care Appointments</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
          >
            <Filter className="mr-2" />
            Filters
            <ChevronDown className={`ml-2 transform ${showFilters ? "rotate-180" : ""} transition-transform`} />
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="thisWeek">This Week</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <ul className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <li key={appointment.id} className="hover:bg-gray-50 transition-colors">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={appointment.mothers.profile_url || "/placeholder.svg?height=48&width=48"}
                            alt={appointment.mothers.full_name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-lg font-medium text-gray-900">{appointment.mothers.full_name}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {formatDate(appointment.requested_time)}
                            <Clock className="flex-shrink-0 mx-1.5 h-4 w-4 text-gray-400" />
                            {formatTime(appointment.requested_time)}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {appointment.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAccept(appointment.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(appointment.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Decline
                            </button>
                          </>
                        )}
                        {appointment.status === "accepted" && isUpcoming(appointment.requested_time) && (
                          <button
                            onClick={() => joinMeeting(appointment.video_conference_link)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join Meeting
                          </button>
                        )}
                        {appointment.payment_status === "unpaid" && (
                          <button
                            onClick={() => handleUpdatePayment(appointment.id, "paid")}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(appointment.status)}`}
                      >
                        <User className="h-3 w-3 mr-1" />
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>

                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentBadgeClass(appointment.payment_status)}`}
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        {appointment.payment_status.charAt(0).toUpperCase() + appointment.payment_status.slice(1)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="mt-1 text-gray-500">There are no appointments matching your current filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppointmentsPage

