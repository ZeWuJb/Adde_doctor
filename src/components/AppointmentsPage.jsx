"use client"
import PropTypes from "prop-types"
import { useState, useEffect, useMemo } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  acceptTemporaryAppointment,
  rejectTemporaryAppointment,
  getDoctorIdFromUserId,
} from "../services/appointmentService"
import { Calendar, Search, Filter, ChevronDown, Video, Check, X, AlertCircle, User } from "lucide-react"
import { useSocketNotifications } from "../hooks/useSocketNotifications"
import { supabase } from "../supabaseClient"
import { getImageSrc } from "../services/imageService"

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
  const [selectedAppointment, setSelectedAppointment] = useState(null) // New state for in-page video
  const { pendingAppointments, removeFromPending } = useSocketNotifications()

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

  useEffect(() => {
    const loadAppointments = async () => {
      if (!doctorId) return
      try {
        setLoading(true)

        // Fetch appointments with mother profile information
        const { data: appointmentsData, error } = await supabase
          .from("appointments")
          .select(`
            *,
            mothers:mother_id (
              user_id,
              full_name,
              email,
              profile_url
            )
          `)
          .eq("doctor_id", doctorId)
          .order("requested_time", { ascending: false })

        if (error) {
          console.error("Error fetching appointments:", error)
          setError("Failed to load appointments")
        } else {
          setAppointments(appointmentsData || [])
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

  // Enhanced pending appointments with mother data
  const [enhancedPendingAppointments, setEnhancedPendingAppointments] = useState([])

  useEffect(() => {
    const enhancePendingAppointments = async () => {
      if (pendingAppointments.length === 0) {
        setEnhancedPendingAppointments([])
        return
      }

      try {
        const motherIds = pendingAppointments.map((appt) => appt.mother_id).filter(Boolean)

        if (motherIds.length > 0) {
          const { data: mothersData, error } = await supabase
            .from("mothers")
            .select("user_id, full_name, email, profile_url")
            .in("user_id", motherIds)

          if (error) {
            console.error("Error fetching mothers data:", error)
            setEnhancedPendingAppointments(pendingAppointments)
          } else {
            const enhanced = pendingAppointments.map((appt) => ({
              ...appt,
              mothers: mothersData.find((mother) => mother.user_id === appt.mother_id),
            }))
            setEnhancedPendingAppointments(enhanced)
          }
        }
      } catch (err) {
        console.error("Error enhancing pending appointments:", err)
        setEnhancedPendingAppointments(pendingAppointments)
      }
    }

    enhancePendingAppointments()
  }, [pendingAppointments])

  const allAppointments = useMemo(() => {
    return [...appointments, ...enhancedPendingAppointments]
  }, [appointments, enhancedPendingAppointments])

  useEffect(() => {
    if (!allAppointments.length) {
      setFilteredAppointments([])
      return
    }

    const filtered = allAppointments.filter((appt) => {
      const matchesSearch = searchTerm
        ? appt.mothers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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

    setFilteredAppointments(filtered)
  }, [allAppointments, searchTerm, statusFilter, dateFilter])

  const handleAccept = async (appointment) => {
    try {
      console.log("Accepting appointment:", appointment)

      if (!appointment.doctor_id) {
        console.error("Missing doctor_id in appointment:", appointment)
        setError("Invalid appointment data: missing doctor_id")
        return
      }

      if (!appointment.mother_id) {
        console.error("Missing mother_id in appointment:", appointment)
        setError("Invalid appointment data: missing mother_id")
        return
      }

      if (!appointment.requested_time) {
        console.error("Missing requested_time in appointment:", appointment)
        setError("Invalid appointment data: missing requested_time")
        return
      }

      const result = await acceptTemporaryAppointment(appointment.id || appointment.appointmentId)

      if (result.success) {
        console.log("Successfully accepted appointment:", result.data)

        // Add mother data to the accepted appointment
        const enhancedAppointment = {
          ...result.data,
          mothers: appointment.mothers,
        }

        setAppointments((prev) => [...prev, enhancedAppointment])
        removeFromPending(appointment.id || appointment.appointmentId)

        if (result.data.video_conference_link) {
          console.log("Video conference link available:", result.data.video_conference_link)
        } else {
          console.error("No video conference link found in the saved appointment")
        }
      } else {
        console.error("Failed to accept appointment:", result.error)
        setError("Failed to accept appointment. Please check your connection.")
      }
    } catch (err) {
      console.error("Error in handleAccept:", err)
      setError("Failed to accept appointment: " + (err.message || "Unknown error"))
    }
  }

  const handleReject = async (id) => {
    try {
      const result = await rejectTemporaryAppointment(id)
      if (result.success) {
        removeFromPending(id)
      } else {
        setError("Failed to reject appointment. Please try again.")
      }
    } catch (err) {
      console.error("Error rejecting appointment:", err)
      setError("An error occurred while rejecting the appointment")
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

  // Enhanced image component for mothers
  const MotherAvatar = ({ mother, size = "h-10 w-10" }) => {
    const [imageError, setImageError] = useState(false)

    if (!mother?.profile_url || imageError) {
      return (
        <div className={`${size} rounded-full flex items-center justify-center bg-gray-200`}>
          <User className="h-6 w-6 text-gray-500" />
        </div>
      )
    }

    return (
      <img
        className={`${size} rounded-full object-cover`}
        src={getImageSrc(mother.profile_url) || "/placeholder.svg"}
        alt={mother.full_name || "Patient"}
        onError={() => setImageError(true)}
      />
    )
  }

  MotherAvatar.propTypes = {
    mother: PropTypes.shape({
      profile_url: PropTypes.string,
      full_name: PropTypes.string,
    }),
    size: PropTypes.string,
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Filter className="mr-2" />
          Filters
          <ChevronDown className={`ml-2 transform ${showFilters ? "rotate-180" : ""} transition-transform`} />
        </button>
      </div>
      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All</option>
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
                className="w-full p-2 border rounded-md"
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
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => (
              <li key={appointment.id || appointment.appointmentId}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MotherAvatar mother={appointment.mothers} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.mothers?.full_name || "Unknown Patient"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(appointment.requested_time)} at {formatTime(appointment.requested_time)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {appointment.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAccept(appointment)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(appointment.id || appointment.appointmentId)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-red-600 hover:bg-red-500 focus:outline-none focus:border-red-700 focus:shadow-outline-red active:bg-red-700 transition ease-in-out duration-150"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      {appointment.status === "accepted" && isUpcoming(appointment.requested_time) && (
                        <>
                          <button
                            onClick={() => joinMeeting(appointment.video_conference_link)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join Meeting
                          </button>
                          {/* New "Join In-Page" button */}
                          <button
                            onClick={() => setSelectedAppointment(appointment)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:border-purple-700 focus:shadow-outline-purple active:bg-purple-700 transition ease-in-out duration-150"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join In-Page
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                        Status:{" "}
                        {appointment.status
                          ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
                          : "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-sm text-gray-500">There are no appointments matching your current filters.</p>
        </div>
      )}
      {/* New section for displaying the Jitsi video conference */}
      {selectedAppointment && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h2 className="text-xl font-bold mb-4">Video Conference</h2>
          <iframe
            src={selectedAppointment.video_conference_link}
            allow="camera; microphone; fullscreen"
            width="100%"
            height="600px"
            frameBorder="0"
          ></iframe>
          <button
            onClick={() => setSelectedAppointment(null)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md"
          >
            Close Meeting
          </button>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
