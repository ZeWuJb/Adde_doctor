"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, X, Clock, Calendar } from "lucide-react"
import { UserAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"
import { getDoctorIdFromUserId } from "../services/appointmentService"

const NotificationsPanel = () => {
  const { session } = UserAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [doctorId, setDoctorId] = useState(null)
  const panelRef = useRef(null)

  // Add this at the beginning of the component for debugging
  useEffect(() => {
    console.log("NotificationPanel - doctorId:", doctorId)
    console.log("NotificationPanel - session:", session)
  }, [doctorId, session])

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
      }
    }

    fetchDoctorId()
  }, [session])

  // Load appointment-based notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!doctorId) return

      try {
        setLoading(true)

        // Fetch temporary appointments (new appointment requests)
        const { data: tempAppointments, error: tempError } = await supabase
          .from("temporary_appointments")
          .select(`
          *,
          mothers:mothers!temporary_appointments_mother_id_fkey (
            full_name,
            email
          )
        `)
          .eq("doctor_id", doctorId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })

        if (tempError) {
          console.error("Error fetching temporary appointments:", tempError)
        }

        // Fetch recent appointments (accepted/declined)
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
          *,
          mothers:mothers!appointments_mother_id_fkey (
            full_name,
            email
          )
        `)
          .eq("doctor_id", doctorId)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .order("created_at", { ascending: false })

        if (appointmentsError) {
          console.error("Error fetching appointments:", appointmentsError)
        }

        // Transform data into notification format
        const tempNotifications = (tempAppointments || []).map((appointment) => ({
          id: `temp_${appointment.id}`,
          type: "appointment_request",
          message: `New appointment request from ${appointment.mothers?.full_name || "Unknown"}`,
          data: appointment,
          read: false,
          created_at: appointment.created_at,
          appointmentId: appointment.id,
        }))

        const appointmentNotifications = (appointments || []).map((appointment) => ({
          id: `appt_${appointment.id}`,
          type: "appointment_update",
          message: `Appointment ${appointment.status} with ${appointment.mothers?.full_name || "Unknown"}`,
          data: appointment,
          read: true, // Mark appointment updates as read by default
          created_at: appointment.updated_at || appointment.created_at,
          appointmentId: appointment.id,
        }))

        const allNotifications = [...tempNotifications, ...appointmentNotifications]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 20)

        setNotifications(allNotifications)
        setUnreadCount(tempNotifications.length)
      } catch (err) {
        console.error("Error loading notifications:", err)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Set up real-time subscriptions
    if (doctorId) {
      // Subscribe to temporary appointments (new requests)
      const tempAppointmentSubscription = supabase
        .channel(`temp-appointments-${doctorId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "temporary_appointments",
            filter: `doctor_id=eq.${doctorId}`,
          },
          async (payload) => {
            console.log("New appointment request:", payload.new)

            // Fetch mother details
            const { data: mother } = await supabase
              .from("mothers")
              .select("full_name, email")
              .eq("user_id", payload.new.mother_id)
              .single()

            const newNotification = {
              id: `temp_${payload.new.id}`,
              type: "appointment_request",
              message: `New appointment request from ${mother?.full_name || "Unknown"}`,
              data: { ...payload.new, mothers: mother },
              read: false,
              created_at: payload.new.created_at,
              appointmentId: payload.new.id,
            }

            setNotifications((prev) => [newNotification, ...prev])
            setUnreadCount((prev) => prev + 1)
          },
        )
        .subscribe()

      // Subscribe to appointments (status updates)
      const appointmentSubscription = supabase
        .channel(`appointments-${doctorId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "appointments",
            filter: `doctor_id=eq.${doctorId}`,
          },
          async (payload) => {
            console.log("Appointment created:", payload.new)

            // Remove corresponding temporary appointment notification
            setNotifications((prev) =>
              prev.filter(
                (notif) =>
                  notif.type !== "appointment_request" ||
                  !notif.data.mother_id ||
                  notif.data.mother_id !== payload.new.mother_id,
              ),
            )
            setUnreadCount((prev) => Math.max(0, prev - 1))
          },
        )
        .subscribe()

      return () => {
        tempAppointmentSubscription.unsubscribe()
        appointmentSubscription.unsubscribe()
      }
    }
  }, [doctorId])

  const handleMarkAsRead = async (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )

    if (notifications.find((n) => n.id === notificationId && !n.read)) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  const handleDeleteNotification = async (notificationId) => {
    const notification = notifications.find((n) => n.id === notificationId)
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))

    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return "just now"

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hr ago`

    const days = Math.floor(hours / 24)
    return `${days} day${days > 1 ? "s" : ""} ago`
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment_request":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "appointment_update":
        return <Calendar className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg z-50 overflow-hidden border border-gray-100">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded-md transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-pink-500"></div>
              </div>
            ) : notifications.length > 0 ? (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                          {notification.message}
                        </p>

                        {notification.data?.requested_time && (
                          <p className="text-xs text-gray-500 mt-1">
                            Requested time: {new Date(notification.data.requested_time).toLocaleString()}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{getTimeAgo(notification.created_at)}</span>
                          <span className="text-xs text-gray-500">{formatTime(notification.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 p-1"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-xs text-gray-400 hover:text-red-600 p-1"
                          title="Delete notification"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>No notifications</p>
                <p className="text-xs mt-1">New appointment requests will appear here</p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-100 text-center">
            <button onClick={() => setIsOpen(false)} className="text-xs text-gray-600 hover:text-gray-800">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationsPanel
