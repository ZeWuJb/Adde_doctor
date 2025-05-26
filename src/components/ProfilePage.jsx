"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { fetchDoctorProfile, updateDoctorProfile, uploadDoctorImage } from "../services/profileService"
import { User, Mail, Briefcase, DollarSign, Users, Calendar, Edit2, Save, X, Camera, Trash2 } from "lucide-react"
import { validateImage } from "../services/imageService"
import FormInput from "./ui/FormInput"
import FormTextarea from "./ui/FormTextarea"
import { nameValidation, numberValidation } from "../utils/validation"

const ProfilePage = () => {
  const { session } = UserAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (!session?.user?.id) return

      try {
        setLoading(true)
        const result = await fetchDoctorProfile(session.user.id)

        if (result.success) {
          setProfile(result.data)
          setEditedProfile({
            full_name: result.data.full_name || "",
            email: result.data.email || "",
            speciality: result.data.speciality || "",
            description: result.data.description || "",
            payment_required_amount: result.data.payment_required_amount || 0,
          })
        } else {
          setError("Failed to load profile information")
        }
      } catch (err) {
        console.error("Error loading profile:", err)
        setError("An unexpected error occurred while loading your profile")
      } finally {
        setLoading(false)
      }
    }

    loadDoctorProfile()
  }, [session])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validation = validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
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
    setEditedProfile((prev) => ({
      ...prev,
      profile_url: null,
    }))
  }

  const handleSaveProfile = async () => {
    if (!profile?.id) return

    try {
      setSaving(true)
      setError(null)

      const updatedProfileData = { ...editedProfile }

      if (imageFile) {
        setUploadingImage(true)
        const uploadResult = await uploadDoctorImage(profile.id, imageFile)

        if (uploadResult.success) {
          updatedProfileData.profile_url = uploadResult.url
        } else {
          setError("Failed to upload image")
          setUploadingImage(false)
          setSaving(false)
          return
        }
        setUploadingImage(false)
      }

      const result = await updateDoctorProfile(profile.id, updatedProfileData)

      if (result.success) {
        setProfile(result.data)
        setIsEditing(false)
        setImageFile(null)
        setImagePreview(null)
        setSuccess("Profile updated successfully!")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError("Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("An unexpected error occurred while saving your profile")
    } finally {
      setSaving(false)
      setUploadingImage(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedProfile({
      full_name: profile.full_name || "",
      email: profile.email || "",
      speciality: profile.speciality || "",
      description: profile.description || "",
      payment_required_amount: profile.payment_required_amount || 0,
    })
    setIsEditing(false)
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Not available"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Not available"
    }
  }

  const getImageSrc = (url) => {
    if (!url) return "/placeholder.svg?height=128&width=128"
    if (url.startsWith("data:")) return url
    if (url.startsWith("http")) return url
    return "/placeholder.svg?height=128&width=128"
  }

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading profile...</p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="p-6 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
        <h3 className="text-lg font-medium">Error Loading Profile</h3>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>
              <strong>Error:</strong> {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span>
              <strong>Success:</strong> {success}
            </span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-pink-600 to-purple-600">
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                <img
                  src={imagePreview || getImageSrc(profile?.profile_url)}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg?height=128&width=128"
                  }}
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      <Camera className="h-8 w-8 text-white" />
                    </label>
                  </div>
                )}
              </div>

              {isEditing && (imagePreview || profile?.profile_url) && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              {uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white text-pink-700 px-4 py-2 rounded-md shadow hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center gap-1 bg-white text-gray-700 px-3 py-2 rounded-md shadow hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 bg-pink-600 text-white px-3 py-2 rounded-md shadow hover:bg-pink-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Body */}
        <div className="mt-20 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="col-span-2 space-y-6">
              {!isEditing ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                    <h1 className="text-2xl font-bold text-gray-800">{profile?.full_name || "Doctor"}</h1>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <Briefcase className="h-5 w-5 mr-2 text-pink-500" />
                    <span>{profile?.speciality || "General Practitioner"}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-6">
                    <Mail className="h-5 w-5 mr-2 text-pink-500" />
                    <span>{profile?.email}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">About</label>
                    <p className="text-gray-600 leading-relaxed">
                      {profile?.description || "No description provided."}
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <FormInput
                    label="Full Name"
                    type="text"
                    name="full_name"
                    value={editedProfile.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    icon={User}
                    validation={nameValidation}
                  />

                  <FormInput
                    label="Specialty"
                    type="text"
                    name="speciality"
                    value={editedProfile.speciality}
                    onChange={handleInputChange}
                    placeholder="Your medical specialty"
                    required
                    icon={Briefcase}
                    validation={(value) => {
                      if (value.length < 2) return "Specialty must be at least 2 characters"
                      return true
                    }}
                  />

                  <FormTextarea
                    label="About"
                    name="description"
                    value={editedProfile.description}
                    onChange={handleInputChange}
                    placeholder="Write something about yourself, your experience, and approach to care..."
                    rows={4}
                    validation={(value) => {
                      if (value && value.length > 500) return "Description must be less than 500 characters"
                      return true
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Stats & Additional Info */}
            <div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Info</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Consultation Fee</h3>
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-green-500 mr-1" />
                      {!isEditing ? (
                        <span className="text-lg font-medium text-gray-800">
                          ${profile?.payment_required_amount || "0.00"}
                        </span>
                      ) : (
                        <div className="w-full">
                          <FormInput
                            type="number"
                            name="payment_required_amount"
                            value={editedProfile.payment_required_amount}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            validation={(value) => {
                              if (value && !isNaN(Number(value))) {
                                return numberValidation(value, 0, 10000)
                              }
                              return true
                            }}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Consultations Given</h3>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-500 mr-1" />
                      <span className="text-lg font-medium text-gray-800">{profile?.consultations_given || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor Type</h3>
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-purple-500 mr-1" />
                      <span className="text-lg font-medium text-gray-800 capitalize">{profile?.type || "Doctor"}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-orange-500 mr-1" />
                      <span className="text-lg font-medium text-gray-800">{formatDate(profile?.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
