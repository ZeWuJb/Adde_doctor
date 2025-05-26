"use client"

import { useState, useEffect } from "react"
import { X, Camera, Trash2, AlertCircle, Check } from "lucide-react"
import { useAdmin } from "../../hooks/useAdmin"
import PropTypes from "prop-types"

const DoctorFormModal = ({ isOpen, onClose, doctor, onSave }) => {
  const { updateDoctor, addDoctorWithAuth } = useAdmin()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    speciality: "",
    description: "",
    payment_required_amount: "",
    type: "doctor",
    profile_url: "",
    password: "",
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (doctor) {
      setFormData({
        full_name: doctor.full_name || "",
        email: doctor.email || "",
        speciality: doctor.speciality || "",
        description: doctor.description || "",
        payment_required_amount: doctor.payment_required_amount || "",
        type: doctor.type || "doctor",
        profile_url: doctor.profile_url || "",
        password: "",
      })
    } else {
      setFormData({
        full_name: "",
        email: "",
        speciality: "",
        description: "",
        payment_required_amount: "",
        type: "doctor",
        profile_url: "",
        password: "",
      })
    }
    setImageFile(null)
    setImagePreview(null)
    setError(null)
    setSuccess(null)
  }, [doctor, isOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
    setError(null)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData((prev) => ({
      ...prev,
      profile_url: "",
    }))
  }

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const addPrefixToName = (name, type) => {
    if (!name || !type) return name

    const trimmedName = name.trim()
    const lowerName = trimmedName.toLowerCase()

    if (type === "doctor") {
      // Check if name already has Dr. prefix (case insensitive)
      if (!lowerName.startsWith("dr.") && !lowerName.startsWith("dr ")) {
        return `Dr. ${trimmedName}`
      }
    } else if (type === "nurse") {
      // Check if name already has Nur. prefix (case insensitive)
      if (!lowerName.startsWith("nur.") && !lowerName.startsWith("nur ")) {
        return `Nur. ${trimmedName}`
      }
    }

    return trimmedName
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!formData.full_name || !formData.email || !formData.speciality || (!doctor && !formData.password)) {
        throw new Error("Please fill in all required fields")
      }

      // Validate password for new doctors
      if (!doctor && formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long")
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      // Validate payment amount
      if (formData.payment_required_amount && isNaN(Number(formData.payment_required_amount))) {
        throw new Error("Payment amount must be a valid number")
      }

      const updatedFormData = { ...formData }

      // Add prefix to name based on type
      updatedFormData.full_name = addPrefixToName(formData.full_name, formData.type)

      // Handle image upload if there's a new image
      if (imageFile) {
        try {
          const base64Image = await convertImageToBase64(imageFile)
          updatedFormData.profile_url = base64Image
        } catch (uploadError) {
          console.error("Error converting image to base64:", uploadError.message)
          setError("Failed to process image")
          setLoading(false)
          return
        }
      }

      // Convert payment amount to number
      if (updatedFormData.payment_required_amount) {
        updatedFormData.payment_required_amount = Number(updatedFormData.payment_required_amount)
      }

      let result
      if (doctor) {
        result = await updateDoctor(doctor.id, updatedFormData)
      } else {
        // Use addDoctorWithAuth for new doctors to create auth account
        result = await addDoctorWithAuth(updatedFormData)
      }

      if (result.success) {
        setSuccess(doctor ? "Doctor updated successfully" : "Doctor added successfully")
        setTimeout(() => {
          onSave(result)
          onClose()
        }, 1500)
      } else {
        throw new Error(result.error || "Failed to save doctor")
      }
    } catch (err) {
      console.error("Error saving doctor:", err.message)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getImageSrc = (profileUrl) => {
    if (!profileUrl) return "/placeholder.svg?height=96&width=96"
    if (profileUrl.startsWith("data:")) return profileUrl
    if (profileUrl.startsWith("http")) return profileUrl
    return `data:image/jpeg;base64,${profileUrl}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">{doctor ? "Edit Doctor" : "Add New Doctor"}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2" />
                <span>{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Image</label>
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                      <img
                        src={imagePreview || getImageSrc(formData.profile_url) || "/placeholder.svg"}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg?height=96&width=96"
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>

                    {(imagePreview || formData.profile_url) && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Type Selection */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  required
                >
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.type === "doctor"
                    ? "Will automatically add 'Dr.' prefix if not present"
                    : formData.type === "nurse"
                      ? "Will automatically add 'Nur.' prefix if not present"
                      : "Select type to see prefix information"}
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  placeholder={
                    formData.type === "doctor"
                      ? "e.g., John Smith (Dr. will be added automatically)"
                      : formData.type === "nurse"
                        ? "e.g., Jane Doe (Nur. will be added automatically)"
                        : "Enter full name"
                  }
                  required
                />
              </div>

              {/* Email */}
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
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  placeholder="doctor@example.com"
                  required
                />
              </div>

              {/* Password - Only for new doctors */}
              {!doctor && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Default Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Set a default password for the doctor"
                    required={!doctor}
                    minLength={6}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Doctor can change this password after first login. Minimum 6 characters.
                  </p>
                </div>
              )}

              {/* Specialty */}
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
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  placeholder="e.g., Cardiology, Pediatrics, General Medicine"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Brief description about the doctor's experience and expertise"
                />
              </div>

              {/* Payment Amount */}
              <div>
                <label htmlFor="payment_required_amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee
                </label>
                <input
                  type="number"
                  id="payment_required_amount"
                  name="payment_required_amount"
                  value={formData.payment_required_amount}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : doctor ? "Update Doctor" : "Add Doctor"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
DoctorFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  doctor: PropTypes.object,
  onSave: PropTypes.func.isRequired,
}

export default DoctorFormModal
