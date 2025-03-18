"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import socketService from "../services/socketService"

export const useSocketNotifications = () => {
  const { session } = UserAuth()
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingAppointments, setPendingAppointments] = useState([])

  useEffect(() => {
    // This effect initializes the socket connection and sets up event handlers
    const initializeSocket = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          const doctorId = result.doctorId
          console.log("Initializing socket with doctor ID:", doctorId)

          // Initialize socket connection
          const initialized = await socketService.initialize(doctorId)

          if (initialized) {
            // Set up connection status handler
            socketService.onConnectionChange((status) => {
              console.log("Socket connection status changed:", status)
              setConnected(status)
            })

            // Set up new appointment handler
            socketService.onNewAppointment((data) => {
              console.log("New appointment received:", data)
              // Add to notifications
              const newNotification = {
                id: Date.now().toString(),
                message: `New appointment request from ${data.mother_name || "a patient"}`,
                timestamp: new Date().toISOString(),
                read: false,
              }

              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)

              // Add to pending appointments (in memory only, not in database)
              setPendingAppointments((prev) => [
                ...prev,
                {
                  appointmentId: data.appointmentId,
                  doctor_id: data.doctor_id,
                  mother_id: data.mother_id,
                  mother_name: data.mother_name || "Unknown Patient",
                  requested_time: data.requested_time,
                  profile_url: null,
                },
              ])
            })

            // Set up appointment accepted handler
            socketService.onAppointmentAccepted((data) => {
              console.log("Appointment accepted:", data)
              const newNotification = {
                id: Date.now().toString(),
                message: `Appointment with ${data.mother_name || "a patient"} was accepted`,
                timestamp: new Date().toISOString(),
                read: false,
              }

              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)

              // Remove from pending appointments
              setPendingAppointments((prev) => prev.filter((app) => app.appointmentId !== data.appointmentId))
            })

            // Set up appointment declined handler
            socketService.onAppointmentDeclined((data) => {
              console.log("Appointment declined:", data)
              const newNotification = {
                id: Date.now().toString(),
                message: `Appointment with ${data.mother_name || "a patient"} was declined`,
                timestamp: new Date().toISOString(),
                read: false,
              }

              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)

              // Remove from pending appointments
              setPendingAppointments((prev) => prev.filter((app) => app.appointmentId !== data.appointmentId))
            })
          }
        } else {
          console.error("Failed to retrieve doctor information")
        }
      } catch (err) {
        console.error("Error in socket connection:", err)
      }
    }

    initializeSocket()

    return () => {
      // Disconnect socket
      socketService.disconnect()
    }
  }, [session])

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  return {
    connected,
    notifications,
    unreadCount,
    pendingAppointments,
    markAsRead,
    markAllAsRead,
  }
}

