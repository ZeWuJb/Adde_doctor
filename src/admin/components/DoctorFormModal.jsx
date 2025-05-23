"use client"

import { useState, useEffect } from "react"
import PropTypes from "prop-types"
import { X, Camera, AlertCircle, Check } from "lucide-react"
import { supabase } from "../../supabaseClient"
import { uploadImageAsBase64, validateImage } from "../../services/imageService"

const DoctorFormModal = ({ isOpen, onClose, doctor = null, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    speciality: "",
    description: "",
    payment_required_amount: 0.0,
    type: "doctor",
    profile_url: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (doctor) {
      setFormData({
        full_name: doctor.full_name || "",
        email: doctor.email || "",
        speciality: doctor.speciality || "",
        description: doctor.description || "",
        payment_required_amount: doctor.payment_required_amount || 0.0,
        type: doctor.type || "doctor",
        profile_url: doctor.profile_url || "",
      })
    } else {
      setFormData({
        full_name: "",
        email: "",
        speciality: "",
        description: "",
        payment_required_amount: 0.0,
        type: "doctor",
        profile_url: "",
      })
    }
  }, [doctor, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "payment_required_amount" ? Number.parseFloat(value) || 0.0 : value,
    }))
  }

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate image
    const validation = validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setUploadingImage(true)
    try {
      const { success, base64, error } = await uploadImageAsBase64(file)
      if (!success) throw error

      setFormData((prev) => ({
        ...prev,
        profile_url: base64,
      }))
    } catch (err) {
      console.error("Error uploading image:", err.message)
      setError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.full_name || !formData.email || !formData.speciality) {
        throw new Error("Please fill in all required fields (Full Name, Email, Specialty)")
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Validate payment_required_amount
      if (formData.payment_required_amount < 0 || formData.payment_required_amount > 99999999.99) {
        throw new Error("Payment amount must be between 0.00 and 99999999.99")
      }

      const doctorData = {
        full_name: formData.full_name,
        email: formData.email,
        speciality: formData.speciality,
        description: formData.description,
        payment_required_amount: Number.parseFloat(formData.payment_required_amount.toFixed(2)),
        type: formData.type,
        profile_url: formData.profile_url,
      }

      let result
      if (doctor) {
        const { data, error } = await supabase.from("doctors").update(doctorData).eq("id", doctor.id).select().single()

        if (error) {
          if (error.code === "23505") {
            throw new Error("This email is already in use by another doctor.")
          }
          throw error
        }
        result = { success: true, data }
      } else {
        doctorData.created_at = new Date().toISOString()
        const { data, error } = await supabase.from("doctors").insert(doctorData).select().single()

        if (error) {
          if (error.code === "23505") {
            throw new Error("This email is already in use by another doctor.")
          }
          throw error
        }
        result = { success: true, data }
      }

      setSuccess(doctor ? "Doctor updated successfully" : "Doctor added successfully")
      onSave(result)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Error saving doctor:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 opacity-75 transition-opacity" aria-hidden="true"></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"></span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{doctor ? "Edit Doctor" : "Add New Doctor"}</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                <div className="flex items-center">
                  <Check className="h-5 w-5 mr-2" aria-hidden="true" />
                  <span>{success}</span>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <img
                    src={formData.profile_url || "/placeholder.svg?height=100&width=100"}
                    alt="Doctor profile picture"
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                  />
                  <label
                    htmlFor="doctor-profile-image"
                    className="absolute bottom-0 right-0 bg-pink-600 text-white p-1.5 rounded-full cursor-pointer shadow-md hover:bg-pink-700"
                    aria-label="Upload profile image"
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    <input
                      type="file"
                      id="doctor-profile-image"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfileImageChange}
                      disabled={uploadingImage}
                    />
                  </label>
                  {uploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                      <div className="w-5 h-5 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-1">
                    Specialty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="speciality"
                    name="speciality"
                    value={formData.speciality}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    required
                    aria-required="true"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                    rows="4"
                  />
                </div>
                <div>
                  <label htmlFor="payment_required_amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Required ($)
                  </label>
                  <input
                    type="number"
                    id="payment_required_amount"
                    name="payment_required_amount"
                    value={formData.payment_required_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    max="99999999.99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                  disabled={loading || uploadingImage}
                >
                  {loading ? "Saving..." : doctor ? "Update Doctor" : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

DoctorFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  doctor: PropTypes.shape({
    id: PropTypes.string, // UUID from schema
    full_name: PropTypes.string,
    email: PropTypes.string,
    speciality: PropTypes.string,
    description: PropTypes.string,
    payment_required_amount: PropTypes.number,
    type: PropTypes.oneOf(["doctor", "nurse"]),
    profile_url: PropTypes.string,
    created_at: PropTypes.string,
    user_id: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
}

export default DoctorFormModal
