"use client"
import PropTypes from "prop-types"
import { useState, useEffect, useMemo } from "react"
import { UserAuth } from "../context/AuthContext"
import {
  acceptTemporaryAppointment,
  rejectTemporaryAppointment,
  getDoctorIdFromUserId,
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
  User,
  CreditCard,
  Clock,
  CheckCircle,
} from "lucide-react"
import { useSocketNotifications } from "../hooks/useSocketNotifications"
import { supabase } from "../supabaseClient"
import { getImageSrc } from "../services/imageService"
import PaymentStatusModal from "./PaymentStatusModal"

const AppointmentsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentAppointment, setSelectedPaymentAppointment] = useState(null)
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

  // Categorize appointments
  const categorizedAppointments = useMemo(() => {
    const pending = enhancedPendingAppointments.filter((appt) =>
      searchTerm ? appt.mothers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true,
    )

    const acceptedUnpaid = appointments.filter(
      (appt) =>
        appt.status === "accepted" &&
        appt.payment_status === "unpaid" &&
        (searchTerm ? appt.mothers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true),
    )

    const paidNotConsulted = appointments.filter(
      (appt) =>
        appt.status === "accepted" &&
        appt.payment_status === "paid" &&
        new Date(appt.requested_time) > new Date() &&
        (searchTerm ? appt.mothers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true),
    )

    const completed = appointments.filter(
      (appt) =>
        appt.status === "accepted" &&
        appt.payment_status === "paid" &&
        new Date(appt.requested_time) <= new Date() &&
        (searchTerm ? appt.mothers?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true),
    )

    return {
      pending,
      acceptedUnpaid,
      paidNotConsulted,
      completed,
    }
  }, [appointments, enhancedPendingAppointments, searchTerm])

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

        // Show payment status modal for the accepted appointment
        setSelectedPaymentAppointment(enhancedAppointment)
        setShowPaymentModal(true)
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

  const handlePaymentComplete = (paymentData) => {
    // Update the appointment with payment data
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === paymentData.id
          ? { ...appt, payment_status: "paid", video_conference_link: paymentData.video_conference_link }
          : appt,
      ),
    )
    setShowPaymentModal(false)
    setSelectedPaymentAppointment(null)
  }

  const formatDate = (dateString) => {
    // Fix timezone issue by creating date in local timezone
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    // Fix timezone issue by creating date in local timezone
    const date = new Date(dateString)
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
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

  const TabButton = ({ id, label, count, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
      {count > 0 && (
        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${isActive ? "bg-blue-500" : "bg-gray-300"}`}>
          {count}
        </span>
      )}
    </button>
  )

  TabButton.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    icon: PropTypes.elementType.isRequired,
    isActive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  }

  const AppointmentCard = ({ appointment, type }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
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
            {appointment.mothers?.email && <div className="text-xs text-gray-400">{appointment.mothers.email}</div>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {type === "pending" && (
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
          {type === "acceptedUnpaid" && (
            <button
              onClick={() => {
                setSelectedPaymentAppointment(appointment)
                setShowPaymentModal(true)
              }}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:border-orange-700 focus:shadow-outline-orange active:bg-orange-700 transition ease-in-out duration-150"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Payment Required
            </button>
          )}
          {type === "paidNotConsulted" && (
            <>
              <button
                onClick={() => joinMeeting(appointment.video_conference_link)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
              >
                <Video className="h-4 w-4 mr-1" />
                Join Meeting
              </button>
              <button
                onClick={() => setSelectedAppointment(appointment)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-500 focus:outline-none focus:border-purple-700 focus:shadow-outline-purple active:bg-purple-700 transition ease-in-out duration-150"
              >
                <Video className="h-4 w-4 mr-1" />
                Join In-Page
              </button>
            </>
          )}
          {type === "completed" && (
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-md">
              <CheckCircle className="h-4 w-4 mr-1" />
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  )

  AppointmentCard.propTypes = {
    appointment: PropTypes.object.isRequired,
    type: PropTypes.string.isRequired,
  }

  const getCurrentAppointments = () => {
    switch (activeTab) {
      case "pending":
        return categorizedAppointments.pending
      case "acceptedUnpaid":
        return categorizedAppointments.acceptedUnpaid
      case "paidNotConsulted":
        return categorizedAppointments.paidNotConsulted
      case "completed":
        return categorizedAppointments.completed
      default:
        return []
    }
  }

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case "pending":
        return "No pending appointment requests"
      case "acceptedUnpaid":
        return "No appointments waiting for payment"
      case "paidNotConsulted":
        return "No upcoming consultations"
      case "completed":
        return "No completed consultations"
      default:
        return "No appointments found"
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Appointments Dashboard</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-black"
        >
          <Filter className="mr-2" />
         <span className="text-black">Search</span>
          <ChevronDown className={`ml-2 transform ${showFilters ? "rotate-180" : ""} transition-transform`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <TabButton
          id="pending"
          label="Pending Requests"
          count={categorizedAppointments.pending.length}
          icon={Clock}
          isActive={activeTab === "pending"}
          onClick={setActiveTab}
        />
        <TabButton
          id="acceptedUnpaid"
          label="Payment Required"
          count={categorizedAppointments.acceptedUnpaid.length}
          icon={CreditCard}
          isActive={activeTab === "acceptedUnpaid"}
          onClick={setActiveTab}
        />
        <TabButton
          id="paidNotConsulted"
          label="Ready for Consultation"
          count={categorizedAppointments.paidNotConsulted.length}
          icon={Video}
          isActive={activeTab === "paidNotConsulted"}
          onClick={setActiveTab}
        />
        <TabButton
          id="completed"
          label="Completed"
          count={categorizedAppointments.completed.length}
          icon={CheckCircle}
          isActive={activeTab === "completed"}
          onClick={setActiveTab}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : getCurrentAppointments().length > 0 ? (
        <div className="space-y-4">
          {getCurrentAppointments().map((appointment) => (
            <AppointmentCard
              key={appointment.id || appointment.appointmentId}
              appointment={appointment}
              type={activeTab}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{getEmptyStateMessage()}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Try adjusting your search terms." : "New appointments will appear here."}
          </p>
        </div>
      )}

      {/* Payment Status Modal */}
      <PaymentStatusModal
        appointment={selectedPaymentAppointment}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedPaymentAppointment(null)
        }}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Video Conference Section */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Video Conference</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Close Meeting
              </button>
            </div>
            <div className="flex-1">
              <iframe
                src={selectedAppointment.video_conference_link}
                allow="camera; microphone; fullscreen"
                width="100%"
                height="100%"
                frameBorder="0"
                className="rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsPage
AppointmentsPage.propTypes = {
  session: PropTypes.shape({
    user: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
}
