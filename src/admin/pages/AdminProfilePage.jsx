"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { Camera, Check, AlertCircle, Save} from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { supabase } from "../../supabaseClient"
import { useLocation} from "react-router-dom"

const AdminProfilePage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [adminData, setAdminData] = useState(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    profile_url: "",
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const fetchAdminProfile = async () => {
      if (!session || !session.user) return

      setLoading(true)
      try {
        const { data, error } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()

        if (error) throw error

        setAdminData(data)
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          profile_url: data.profile_url || "",
        })
      } catch (err) {
        console.error("Error fetching admin profile:", err.message)
        setError("Failed to load admin profile. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAdminProfile()
  }, [session])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate image
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB")
      return
    }

    setUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onload = () => {
        setFormData((prev) => ({
          ...prev,
          profile_url: reader.result,
        }))
        setUploadingImage(false)
      }
      reader.onerror = () => {
        setError("Failed to read image file")
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Error uploading image:", err.message)
      setError(err.message)
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.full_name || !formData.email) {
        throw new Error("Please fill in all required fields")
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address")
      }

      const { error } = await supabase
        .from("admins")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          profile_url: formData.profile_url,
        })
        .eq("id", adminData.id)

      if (error) {
        if (error.code === "23505") {
          throw new Error("This email is already in use by another admin.")
        }
        throw error
      }

      setSuccess("Profile updated successfully")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("Error updating admin profile:", err.message)
      setError(err.message)
    } finally {
      setSaving(false)
    }
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
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={signOut}
        currentPath={location?.pathname || "/admin/profile"}
      />
      <div className="flex-1 md:ml-64">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />
        <main className="p-6">


          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>{success}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img
                      src={formData.profile_url || "/placeholder.svg?height=100&width=100"}
                      alt="Admin profile picture"
                      className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                    />
                    <label
                      htmlFor="admin-profile-image"
                      className="absolute bottom-0 right-0 bg-pink-600 text-white p-1.5 rounded-full cursor-pointer shadow-md hover:bg-pink-700"
                      aria-label="Upload profile image"
                    >
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      <input
                        type="file"
                        id="admin-profile-image"
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

                  <div className="col-span-2">
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
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50"
                    disabled={saving || uploadingImage}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminProfilePage
