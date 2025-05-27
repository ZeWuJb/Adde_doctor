"use client"

import { useState, useEffect, useCallback } from "react"
import { X, CheckCircle, AlertCircle, Clock } from "lucide-react"
import paymentService from "../services/paymentService"
import PropTypes from "prop-types"

const PaymentStatusModal = ({ appointment, isOpen, onClose, onPaymentComplete }) => {
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkPaymentStatus = useCallback(async () => {
    if (!appointment?.id) return

    setLoading(true)
    try {
      const result = await paymentService.getAppointmentPaymentStatus(appointment.id)
      if (result.success) {
        setPaymentStatus(result.data)
        if (result.data.payment_status === "paid" && result.data.video_conference_link) {
          onPaymentComplete?.(result.data)
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
        console.error("Error checking payment status:", err)
      setError("Failed to check payment status")
    } finally {
      setLoading(false)
    }
  }, [appointment?.id, onPaymentComplete])

  useEffect(() => {
    if (isOpen && appointment) {
      checkPaymentStatus()
      // Poll for payment status every 5 seconds
      const interval = setInterval(checkPaymentStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, appointment, checkPaymentStatus])

  if (!isOpen) return null

  const getStatusIcon = () => {
    if (loading) return <Clock className="h-6 w-6 text-blue-500 animate-spin" />
    if (paymentStatus?.payment_status === "paid") return <CheckCircle className="h-6 w-6 text-green-500" />
    return <AlertCircle className="h-6 w-6 text-orange-500" />
  }

  const getStatusText = () => {
    if (loading) return "Checking payment status..."
    if (paymentStatus?.payment_status === "paid") return "Payment completed successfully!"
    return "Waiting for payment..."
  }

  const getStatusColor = () => {
    if (paymentStatus?.payment_status === "paid") return "text-green-700 bg-green-50 border-green-200"
    return "text-orange-700 bg-orange-50 border-orange-200"
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Payment Status</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="mb-4">{getStatusIcon()}</div>

          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <p className="font-medium">{getStatusText()}</p>
            {paymentStatus?.payment_status === "unpaid" && (
              <p className="text-sm mt-2">
                The patient needs to complete payment before the video consultation can begin.
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={checkPaymentStatus}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Refresh Status"}
          </button>
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentStatusModal
PaymentStatusModal.propTypes = {
  appointment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    video_conference_link: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onPaymentComplete: PropTypes.func,
}