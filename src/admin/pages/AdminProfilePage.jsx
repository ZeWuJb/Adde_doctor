"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Edit,
  Camera,
  Save,
  X,
  AlertCircle,
  Check,
  Shield,
} from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"
import { supabase } from "../../supabaseClient"

const AdminProfilePage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [activityLog, setActivityLog] = useState([])
  const location = useLocation()

  // Admin profile state
  const [profile, setProfile] = useState({
    id: "",
    fullName: "",
    email: "",
    phone: "",
    role: "System Administrator",
    department: "",
    joinDate: "",
    location: "",
    bio: "",
    profileImage: "",
  })

  useEffect(() => {
    if (session && session.user) {
      fetchAdminProfile()
      fetchActivityLog()
    }
  }, [session])

  const fetchAdminProfile = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()

      if (error) throw error

      setProfile({
        id: data.id,
        fullName: data.full_name || "",
        email: data.email || session.user.email,
        phone: data.phone_number || "",
        role: data.role || "System Administrator",
        department: data.department || "",
        joinDate: data.created_at || new Date().toISOString(),
        location: data.location || "",
        bio: data.bio || "",
        profileImage: data.profile_url || "",
      })
    } catch (err) {
      console.error("Error fetching admin profile:", err.message)
      setError("Failed to load profile data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityLog = async () => {
    try {
      // In a real app, you would fetch from an activity_logs table
      // For now, we'll use mock data
      const mockActivityLog = [
        {
          id: 1,
          action: "Updated system settings",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          details: "Changed notification settings",
        },
        {
          id: 2,
          action: "Added new doctor",
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          details: "Added Dr. Sarah Johnson to the system",
        },
        {
          id: 3,
          action: "Approved content article",
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          details: "Approved 'Prenatal Care Tips' article",
        },
        {
          id: 4,
          action: "System login",
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          details: "Logged in from 192.168.1.1",
        },
        {
          id: 5,
          action: "Updated role permissions",
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          details: "Modified Doctor role permissions",
        },
      ]

      setActivityLog(mockActivityLog)
    } catch (err) {
      console.error("Error fetching activity log:", err.message)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${session.user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `admin-profiles/${fileName}`

      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profiles").getPublicUrl(filePath)

      // Update profile with new image URL
      setProfile((prev) => ({
        ...prev,
        profileImage: publicUrl,
      }))
    } catch (err) {
      console.error("Error uploading image:", err.message)
      setError("Failed to upload profile image. Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from("admins")
        .update({
          full_name: profile.fullName,
          phone_number: profile.phone,
          department: profile.department,
          location: profile.location,
          bio: profile.bio,
          profile_url: profile.profileImage,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", session.user.id)

      if (error) throw error

      setSuccess("Profile updated successfully")
      setIsEditing(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error updating profile:", err.message)
      setError("Failed to update profile. Please try again.")
      setTimeout(() => setError(null), 3000)
    }
  }

  const cancelEditing = () => {
    fetchAdminProfile() // Reset to original data
    setIsEditing(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location.pathname}
      />

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Top Navigation */}
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />

        {/* Profile Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
            <p className="text-gray-600">View and manage your profile information</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center text-sm text-pink-600 hover:text-pink-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveProfile}
                          className="flex items-center text-sm text-green-600 hover:text-green-700"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex items-center text-sm text-gray-600 hover:text-gray-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row">
                    {/* Profile Image */}
                    <div className="flex flex-col items-center mb-6 md:mb-0 md:mr-8">
                      <div className="relative">
                        <img
                          src={profile.profileImage || "/placeholder.svg?height=128&width=128"}
                          alt={profile.fullName}
                          className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        {isEditing && (
                          <label
                            htmlFor="profile-image"
                            className="absolute bottom-0 right-0 bg-pink-600 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-pink-700"
                          >
                            <Camera className="h-4 w-4" />
                            <input
                              type="file"
                              id="profile-image"
                              accept="image/*"
                              className="hidden"
                              onChange={handleProfileImageChange}
                              disabled={uploadingImage}
                            />
                          </label>
                        )}
                      </div>
                      <div className="mt-4 flex items-center">
                        <Shield className="h-4 w-4 text-pink-600 mr-1" />
                        <span className="text-sm font-medium text-gray-700">{profile.role}</span>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="fullName"
                              value={profile.fullName}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            />
                          ) : (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{profile.fullName}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{profile.email}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="phone"
                              value={profile.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            />
                          ) : (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{profile.phone || "Not provided"}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{formatDate(profile.joinDate)}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="department"
                              value={profile.department}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            />
                          ) : (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{profile.department || "Not specified"}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          {isEditing ? (
                            <input
                              type="text"
                              name="location"
                              value={profile.location}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                            />
                          ) : (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                              <span>{profile.location || "Not specified"}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        {isEditing ? (
                          <textarea
                            name="bio"
                            value={profile.bio}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                          />
                        ) : (
                          <p className="text-gray-600">{profile.bio || "No bio information provided."}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div>
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-800">{activity.action}</h3>
                            <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-gray-600">{formatDate(activity.timestamp)}</p>
                            <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminProfilePage
