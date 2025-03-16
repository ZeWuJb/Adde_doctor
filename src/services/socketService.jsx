"use client"
import { saveSocketAppointment, updateAppointmentStatus } from "./appointmentService"

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
    this.serverUrl = "http://192.168.127.180:3000" // Change to your server URL in production
    this.callbacks = {
      onNewAppointment: null,
      onAppointmentAccepted: null,
      onAppointmentDeclined: null,
      onConnectionChange: null,
    }
  }

  async initialize(doctorId) {
    if (!doctorId) {
      console.error("Doctor ID is required to initialize socket connection")
      return false
    }

    try {
      // Dynamically import socket.io-client
      const { io } = await import("socket.io-client")

      // Initialize socket connection
      this.socket = io(this.serverUrl, {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      // Set up event listeners
      this.setupEventListeners(doctorId)
      return true
    } catch (error) {
      console.error("Failed to initialize socket connection:", error)
      return false
    }
  }

  setupEventListeners(doctorId) {
    if (!this.socket) return

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to socket server with ID:", this.socket.id)
      this.connected = true
      this.socket.emit("join", doctorId)

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true)
      }
    })

    this.socket.on("disconnect", () => {
      console.log("Disconnected from socket server")
      this.connected = false

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false)
      }
    })

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      this.connected = false

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false)
      }
    })

    // Appointment events
    this.socket.on("new_appointment", async (data) => {
      console.log("New appointment request received:", data)

      // Validate the doctor_id matches this doctor
      if (data.doctor_id !== doctorId) {
        console.error("Received appointment for different doctor:", data.doctor_id, "Expected:", doctorId)
        return // Skip processing if doctor_id doesn't match
      }

      // Save the appointment to the database
      if (data.appointmentId && data.doctor_id && data.mother_id) {
        try {
          // Format the data for our database
          const appointmentData = {
            doctor_id: data.doctor_id,
            mother_id: data.mother_id,
            requested_time: data.requested_time,
            status: "pending",
            video_conference_link: null,
          }

          // Save to database
          await saveSocketAppointment(appointmentData)
        } catch (err) {
          console.error("Error saving socket appointment:", err)
        }
      } else {
        console.error("Missing required fields in appointment data:", data)
      }

      if (this.callbacks.onNewAppointment) {
        this.callbacks.onNewAppointment(data)
      }
    })

    this.socket.on("appointment_accepted", (data) => {
      console.log("Appointment accepted:", data)

      if (this.callbacks.onAppointmentAccepted) {
        this.callbacks.onAppointmentAccepted(data)
      }
    })

    this.socket.on("appointment_declined", (data) => {
      console.log("Appointment declined:", data)

      if (this.callbacks.onAppointmentDeclined) {
        this.callbacks.onAppointmentDeclined(data)
      }
    })
  }

  // Register callback functions
  onNewAppointment(callback) {
    this.callbacks.onNewAppointment = callback
  }

  onAppointmentAccepted(callback) {
    this.callbacks.onAppointmentAccepted = callback
  }

  onAppointmentDeclined(callback) {
    this.callbacks.onAppointmentDeclined = callback
  }

  onConnectionChange(callback) {
    this.callbacks.onConnectionChange = callback
  }

  // Actions
  acceptAppointment(appointmentId) {
    if (!this.socket || !this.connected) {
      console.error("Socket not connected")
      return false
    }

    this.socket.emit("accept_appointment", { appointmentId })

    // Also update in our database
    updateAppointmentStatus(appointmentId, "accepted")

    return true
  }

  declineAppointment(appointmentId) {
    if (!this.socket || !this.connected) {
      console.error("Socket not connected")
      return false
    }

    this.socket.emit("decline_appointment", { appointmentId })

    // Also update in our database
    updateAppointmentStatus(appointmentId, "declined")

    return true
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.connected = false
    }
  }
}

// Create a singleton instance
const socketService = new SocketService()
export default socketService





