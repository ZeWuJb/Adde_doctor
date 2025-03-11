"use client"

import { useState, useEffect, useCallback } from "react"
import { io } from "socket.io-client"
import { UserAuth } from "../context/AuthContext"

// Create a custom hook for Socket.io integration
export const useSocketNotifications = () => {
  const { session } = UserAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [pendingAppointments, setPendingAppointments] = useState([])

  // Initialize socket connection
  useEffect(() => {
    // Only connect if we have a valid doctor ID
    if (!session?.user?.id) return

    // Get doctor ID from session
    const doctorId = session.userData?.id || null
    if (!doctorId) {
      console.error("Doctor ID not available in session")
      return
    }

    console.log("Connecting to Socket.io with doctor ID:", doctorId)

    // Connect to the Socket.io server
    const socketInstance = io(import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:3000", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ["websocket"],
    })

    // Socket event handlers
    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id)
      setConnected(true)

      // Join the room with the doctor ID
      socketInstance.emit("join", doctorId)
      console.log("Joined room with doctor ID:", doctorId)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setConnected(false)
    })

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      setConnected(false)
    })

    // Listen for new appointment requests
    socketInstance.on("new_appointment", (data) => {
      console.log("New appointment request received:", data)

      // Add to notifications
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "new_appointment",
          message: `New appointment request from patient`,
          data: data,
          read: false,
          timestamp: new Date(),
        },
        ...prev,
      ])

      // Add to pending appointments
      setPendingAppointments((prev) => [data, ...prev])
    })

    // Listen for appointment acceptance
    socketInstance.on("appointment_accepted", (data) => {
      console.log("Appointment accepted:", data)

      // Add to notifications
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "appointment_accepted",
          message: `Appointment with patient was accepted`,
          data: data,
          read: false,
          timestamp: new Date(),
        },
        ...prev,
      ])

      // Remove from pending appointments
      setPendingAppointments((prev) => prev.filter((appt) => appt.appointmentId !== data.appointmentId))
    })

    // Listen for appointment declination
    socketInstance.on("appointment_declined", (data) => {
      console.log("Appointment declined:", data)

      // Add to notifications
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "appointment_declined",
          message: `Appointment with patient was declined`,
          data: data,
          read: false,
          timestamp: new Date(),
        },
        ...prev,
      ])

      // Remove from pending appointments
      setPendingAppointments((prev) => prev.filter((appt) => appt.appointmentId !== data.appointmentId))
    })

    // Save socket instance
    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      console.log("Cleaning up socket connection")
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [session])

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  // Get unread notifications count
  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    socket,
    connected,
    notifications,
    pendingAppointments,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}

// For backward compatibility, also export a component version
const AppointmentNotifications = () => {
  const { connected, notifications, unreadCount } = useSocketNotifications()

  return (
    <div className="appointment-notifications">
      <div className="status">Connection Status: {connected ? "Connected" : "Disconnected"}</div>
      <div className="unread-count">Unread Notifications: {unreadCount}</div>
      {notifications.length > 0 ? (
        <div className="notification-list">
          <h3>Recent Notifications</h3>
          <ul>
            {notifications.slice(0, 5).map((notification) => (
              <li key={notification.id} className={notification.read ? "read" : "unread"}>
                {notification.message} - {new Date(notification.timestamp).toLocaleTimeString()}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>No notifications</div>
      )}
    </div>
  )
}

export default AppointmentNotifications

