"use client"

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
      onError: null,
    }
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 3000 // 3 seconds

    // Add a set to track processed appointment IDs
    this.processedAppointments = new Set()
  }

  async initialize(doctorId) {
    if (!doctorId) {
      console.error("Doctor ID is required to initialize socket connection")
      return false
    }

    // Disconnect any existing socket before creating a new one
    if (this.socket) {
      console.log("Disconnecting existing socket before initializing a new one")
      this.disconnect()
    }

    try {
      // Dynamically import socket.io-client
      const { io } = await import("socket.io-client")

      // Initialize socket connection with improved options for persistence
      this.socket = io(this.serverUrl, {
        transports: ["websocket", "polling"], // Try WebSocket first, fallback to polling
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10, // Increased from 5
        reconnectionDelay: 1000, // Start with shorter delay (1 second)
        reconnectionDelayMax: 5000, // Maximum delay between reconnection attempts
        timeout: 20000, // 20 seconds connection timeout
        query: { doctorId }, // Send doctorId as a query parameter
        forceNew: true, // Force a new connection to prevent duplicates
      })

      // Set up event listeners
      this.setupEventListeners(doctorId)

      // Start ping interval to keep connection alive
      this.startPingInterval()

      return true
    } catch (error) {
      console.error("Failed to initialize socket connection:", error)
      return false
    }
  }

  startPingInterval() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }

    // Set up a new ping interval - more frequent to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket && this.connected) {
        console.log("Sending ping to keep connection alive")
        this.socket.emit("ping", { timestamp: Date.now() })
      } else if (this.socket && !this.connected) {
        console.log("Socket exists but not connected, attempting reconnect...")
        this.socket.connect()
      }
    }, 15000) // Every 15 seconds instead of 25
  }

  setupEventListeners(doctorId) {
    if (!this.socket) return

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to socket server with ID:", this.socket.id)
      this.connected = true
      this.reconnectAttempts = 0
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

      // Try to reconnect manually if auto-reconnect fails
      this.attemptReconnect(doctorId)
    })

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
      this.connected = false

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false)
      }

      // Try to reconnect manually if auto-reconnect fails
      this.attemptReconnect(doctorId)
    })

    // Confirmation events
    this.socket.on("connection_established", (data) => {
      console.log("Connection confirmed by server:", data)
    })

    this.socket.on("joined_room", (data) => {
      console.log("Successfully joined room:", data)
    })

    this.socket.on("pong", (data) => {
      console.log("Received pong from server:", data.timestamp)
    })

    // Appointment events with deduplication
    this.socket.on("new_appointment", async (data) => {
      console.log("New appointment request received:", data)

      // Check if we've already processed this appointment
      if (this.processedAppointments.has(data.appointmentId)) {
        console.log(`Skipping duplicate appointment: ${data.appointmentId}`)
        return
      }

      // Add to processed set
      this.processedAppointments.add(data.appointmentId)

      // Validate the doctor_id matches this doctor
      if (data.doctor_id !== doctorId) {
        console.error("Received appointment for different doctor:", data.doctor_id, "Expected:", doctorId)
        return // Skip processing if doctor_id doesn't match
      }

      // REMOVED: The premature database save code that was here
      // We should NOT save to database until the doctor accepts

      // Just notify the UI about the new appointment request
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

    // Error handling
    this.socket.on("error", (error) => {
      console.error("Socket server error:", error)

      if (this.callbacks.onError) {
        this.callbacks.onError(error)
      }
    })
  }

  attemptReconnect(doctorId) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Maximum reconnection attempts reached, creating new connection")
      // Instead of giving up, try to create a completely new connection
      this.socket = null
      this.initialize(doctorId)
      return
    }

    this.reconnectAttempts++
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

    // Use exponential backoff with a maximum delay
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000)

    setTimeout(() => {
      if (!this.connected && this.socket) {
        console.log("Trying to reconnect...")

        // Try to reconnect with the existing socket
        this.socket.connect()

        // If reconnected, re-join the room
        if (this.socket.connected) {
          console.log("Reconnected, joining room again")
          this.socket.emit("join", doctorId)
          this.connected = true
          if (this.callbacks.onConnectionChange) {
            this.callbacks.onConnectionChange(true)
          }
        }
      }
    }, delay)
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

  onError(callback) {
    this.callbacks.onError = callback
  }

  // Actions
  acceptAppointment(appointmentId) {
    if (!this.socket) {
      console.error("Socket not initialized")
      return false
    }

    if (!this.connected) {
      console.error("Socket not connected")
      return false
    }

    console.log("Emitting accept_appointment event for ID:", appointmentId)

    try {
      this.socket.emit("accept_appointment", { appointmentId })

      // We don't need to update the database for socket-generated appointments
      // The database update will happen in saveAppointmentWhenAccepted

      return true
    } catch (error) {
      console.error("Error accepting appointment:", error)
      return false
    }
  }

  declineAppointment(appointmentId) {
    if (!this.socket) {
      console.error("Socket not initialized")
      return false
    }

    if (!this.connected) {
      console.error("Socket not connected")
      return false
    }

    console.log("Emitting decline_appointment event for ID:", appointmentId)

    try {
      this.socket.emit("decline_appointment", { appointmentId })

      // We don't need to update the database for socket-generated appointments
      // These are only stored in memory until accepted

      return true
    } catch (error) {
      console.error("Error declining appointment:", error)
      return false
    }
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }

    if (this.socket) {
      console.log("Disconnecting socket")
      this.socket.removeAllListeners() // Remove all event listeners
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }

    // Clear the processed appointments set when disconnecting
    this.processedAppointments.clear()
  }
}

// Create a singleton instance
const socketService = new SocketService()
export default socketService

