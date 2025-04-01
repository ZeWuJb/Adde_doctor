// This service is being replaced with Supabase real-time subscriptions
// Keeping the file but marking it as deprecated
"use client"

/**
 * @deprecated This service is deprecated and will be removed in future versions.
 * Use appointmentService.js with Supabase real-time subscriptions instead.
 */
class SocketService {
  constructor() {
    console.warn("SocketService is deprecated. Use Supabase real-time subscriptions instead.")
    this.connected = false
    this.callbacks = {
      onNewAppointment: null,
      onAppointmentAccepted: null,
      onAppointmentDeclined: null,
      onConnectionChange: null,
      onError: null,
    }
  }

  async initialize() {
    console.warn("SocketService is deprecated. Use Supabase real-time subscriptions instead.")
    return false
  }

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
    if (callback) callback(false)
  }

  onError(callback) {
    this.callbacks.onError = callback
  }

  acceptAppointment() {
    console.warn("SocketService is deprecated. Use appointmentService.acceptTemporaryAppointment instead.")
    return false
  }

  declineAppointment() {
    console.warn("SocketService is deprecated. Use appointmentService.rejectTemporaryAppointment instead.")
    return false
  }

  disconnect() {
    // No-op
  }
}

// Create a singleton instance
const socketService = new SocketService()
export default socketService

