"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { fetchDoctorProfile, updateDoctorProfile, uploadProfileImage } from "../services/profileService"
import { User, Mail, Briefcase, DollarSign, Users, Calendar, Edit2, Save, X, Upload } from "lucide-react"

const ProfilePage = () => {
  const { session } = UserAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(null)
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
          setEditedProfile(result.data)
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
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleUploadImage = async () => {
    if (!imageFile || !session?.user?.id) return

    try {
      setUploadingImage(true)
      const result = await uploadProfileImage(session.user.id, imageFile)

      if (result.success) {
        // Update profile with new image URL
        setEditedProfile((prev) => ({
          ...prev,
          profile_url: result.url,
        }))
        setProfile((prev) => ({
          ...prev,
          profile_url: result.url,
        }))
        setImageFile(null)
      } else {
        setError("Failed to upload image")
      }
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("An unexpected error occurred during image upload")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      const result = await updateDoctorProfile(profile.id, editedProfile)

      if (result.success) {
        setProfile(result.data)
        setIsEditing(false)
        setError(null)
      } else {
        setError("Failed to update profile")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("An unexpected error occurred while saving your profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedProfile(profile)
    setIsEditing(false)
    setImageFile(null)
    setImagePreview(null)
  }

  if (loading && !profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
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
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-48 bg-gradient-to-r from-primary-600 to-primary-400">
          <div className="absolute -bottom-16 left-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                {!isEditing ? (
                  <img
                    src={profile?.profile_url || "/placeholder.svg?height=128&width=128"}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <img
                      src={imagePreview || profile?.profile_url || "/placeholder.svg?height=128&width=128"}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                      <Upload className="h-8 w-8 text-white" />
                    </label>
                  </>
                )}
              </div>
              {isEditing && imageFile && (
                <button
                  onClick={handleUploadImage}
                  disabled={uploadingImage}
                  className="absolute -right-2 -bottom-2 bg-primary-500 text-white p-2 rounded-full shadow hover:bg-primary-600 transition-colors"
                >
                  {uploadingImage ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="absolute top-4 right-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-md shadow hover:bg-gray-50 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 bg-white text-gray-700 px-3 py-2 rounded-md shadow hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-md shadow hover:bg-primary-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Body */}
        <div className="mt-20 px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="col-span-2">
              <h1 className="text-2xl font-bold text-gray-800 mb-4">
                {!isEditing ? (
                  profile?.full_name || "Doctor"
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm text-gray-600">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editedProfile?.full_name || ""}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded-md p-2 text-lg"
                    />
                  </div>
                )}
              </h1>

              <div className="flex items-center text-gray-600 mb-4">
                <Briefcase className="h-5 w-5 mr-2 text-primary-500" />
                {!isEditing ? (
                  <span>{profile?.speciality || "General Practitioner"}</span>
                ) : (
                  <div className="flex-1">
                    <input
                      type="text"
                      name="speciality"
                      placeholder="Speciality"
                      value={editedProfile?.speciality || ""}
                      onChange={handleInputChange}
                      className="border border-gray-300 rounded-md p-2 w-full"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <Mail className="h-5 w-5 mr-2 text-primary-500" />
                <span>{profile?.email}</span>
              </div>

              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">About</h2>
                {!isEditing ? (
                  <p className="text-gray-600 leading-relaxed">{profile?.description || "No description provided."}</p>
                ) : (
                  <textarea
                    name="description"
                    placeholder="Write something about yourself..."
                    value={editedProfile?.description || ""}
                    onChange={handleInputChange}
                    className="w-full h-32 border border-gray-300 rounded-md p-2 text-gray-600"
                  />
                )}
              </div>
            </div>

            {/* Right Column - Stats & Additional Info */}
            <div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Info</h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Consultation Fee</h3>
                    <div className="flex items-center mt-1">
                      <DollarSign className="h-5 w-5 text-green-500 mr-1" />
                      {!isEditing ? (
                        <span className="text-lg font-medium text-gray-800">
                          ${profile?.payment_required_amount || "0.00"}
                        </span>
                      ) : (
                        <input
                          type="number"
                          name="payment_required_amount"
                          step="0.01"
                          min="0"
                          value={editedProfile?.payment_required_amount || ""}
                          onChange={handleInputChange}
                          className="border border-gray-300 rounded-md p-2 w-full"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Consultations Given</h3>
                    <div className="flex items-center mt-1">
                      <Users className="h-5 w-5 text-blue-500 mr-1" />
                      <span className="text-lg font-medium text-gray-800">{profile?.consultations_given || 0}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Doctor Type</h3>
                    <div className="flex items-center mt-1">
                      <User className="h-5 w-5 text-purple-500 mr-1" />
                      <span className="text-lg font-medium text-gray-800 capitalize">{profile?.type || "Doctor"}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Member Since</h3>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-5 w-5 text-orange-500 mr-1" />
                      <span className="text-lg font-medium text-gray-800">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </span>
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

