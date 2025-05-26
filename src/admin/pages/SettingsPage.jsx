"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { User, Lock, Save, AlertCircle, Check, Mail } from "lucide-react"
import { supabase } from "../../supabaseClient"
import FormInput from "../../components/ui/FormInput"
import { emailValidation, passwordValidation, nameValidation, confirmPasswordValidation } from "../../utils/validation"

const SettingsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const location = useLocation()

  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    profile_url: "",
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Load admin data
  useEffect(() => {
    const loadAdminData = async () => {
      if (session?.user?.id) {
        try {
          const { data, error } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()

          if (error) {
            console.error("Error fetching admin data:", error)
            return
          }

          if (data) {
            setProfileData({
              full_name: data.full_name || "",
              email: data.email || session.user.email || "",
              profile_url: data.profile_url || "",
            })
          }
        } catch (err) {
          console.error("Error loading admin data:", err)
        }
      }
    }

    loadAdminData()
  }, [session])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("admins")
        .update({
          full_name: profileData.full_name,
          email: profileData.email,
          profile_url: profileData.profile_url,
        })
        .eq("user_id", session.user.id)

      if (error) throw error

      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err.message || "Failed to update profile")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match")
      setLoading(false)
      setTimeout(() => setError(null), 5000)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long")
      setLoading(false)
      setTimeout(() => setError(null), 5000)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      setSuccess("Password updated successfully!")
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error updating password:", err)
      setError(err.message || "Failed to update password")
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      setTimeout(() => setError(null), 5000)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB")
      setTimeout(() => setError(null), 5000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setProfileData((prev) => ({
        ...prev,
        profile_url: event.target.result,
      }))
    }
    reader.readAsDataURL(file)
  }

  const getImageSrc = (profileUrl) => {
    if (!profileUrl) return null
    if (profileUrl.startsWith("data:")) return profileUrl
    if (profileUrl.startsWith("http")) return profileUrl
    return `data:image/jpeg;base64,${profileUrl}`
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location.pathname}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          session={session}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Settings</h1>
              <p className="text-pink-100">Manage your account settings and preferences</p>
            </div>

            {/* Success Alert */}
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-green-700">{success}</span>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-pink-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">Profile Settings</h2>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      {profileData.profile_url ? (
                        <img
                          src={getImageSrc(profileData.profile_url) || "/placeholder.svg"}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-pink-100"
                          onError={(e) => {
                            e.target.style.display = "none"
                            e.target.nextSibling.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center border-4 border-pink-100 ${
                          profileData.profile_url ? "hidden" : ""
                        }`}
                      >
                        <User className="w-12 h-12 text-pink-600" />
                      </div>
                    </div>
                    <div>
                      <label className="block">
                        <span className="sr-only">Choose profile photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 transition-colors"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <FormInput
                      label="Full Name"
                      type="text"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your full name"
                      required
                      icon={User}
                      validation={nameValidation}
                    />

                    <FormInput
                      label="Email"
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your email"
                      required
                      icon={Mail}
                      validation={emailValidation}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {loading ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                  <div className="flex items-center">
                    <Lock className="h-5 w-5 text-pink-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-800">Security Settings</h2>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
                  <div className="space-y-4">
                    <FormInput
                      label="Current Password"
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter current password"
                      icon={Lock}
                    />

                    <FormInput
                      label="New Password"
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Enter new password"
                      icon={Lock}
                      validation={passwordValidation}
                    />

                    <FormInput
                      label="Confirm New Password"
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirm new password"
                      icon={Lock}
                      validation={(value) => confirmPasswordValidation(passwordData.newPassword, value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsPage
