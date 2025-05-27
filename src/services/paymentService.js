import axios from "axios"

// Use environment variable with fallback for development
const PAYMENT_API_BASE_URL = import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:3001"

class PaymentService {
  // Initialize payment for appointment
  async initializeAppointmentPayment(appointmentData) {
    try {
      const response = await axios.post(`${PAYMENT_API_BASE_URL}/initialize-appointment-payment`, appointmentData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Error initializing appointment payment:", error)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Verify appointment payment
  async verifyAppointmentPayment(txRef) {
    try {
      const response = await axios.get(`${PAYMENT_API_BASE_URL}/verify-appointment-payment/${txRef}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Error verifying appointment payment:", error)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  // Get appointment payment status
  async getAppointmentPaymentStatus(appointmentId) {
    try {
      const response = await axios.get(`${PAYMENT_API_BASE_URL}/appointment-payment-status/${appointmentId}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Error getting appointment payment status:", error)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }
}

export default new PaymentService()
