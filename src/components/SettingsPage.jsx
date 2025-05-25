"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { supabase } from "../supabaseClient"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import { Bell, Lock, Save, AlertCircle, Check, Eye, EyeOff, X } from "lucide-react"

const SettingsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState("notifications")

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    reminderHours: 24,
  })

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Fetch doctor data and settings
  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!session?.user?.id) return

      try {
        setLoading(true)

        // Get doctor ID
        const doctorResult = await getDoctorIdFromUserId(session.user.id)
        if (!doctorResult.success) throw new Error("Failed to get doctor ID")

        setDoctorId(doctorResult.doctorId)

        // Try to get existing notification settings
        const { data: settings } = await supabase
          .from("doctor_settings")
          .select("*")
          .eq("doctor_id", doctorResult.doctorId)
          .single()

        if (settings) {
          setNotificationSettings({
            emailNotifications: settings.email_notifications ?? true,
            smsNotifications: settings.sms_notifications ?? false,
            appointmentReminders: settings.appointment_reminders ?? true,
            reminderHours: settings.reminder_hours || 24,
          })
        }
      } catch (err) {
        console.error("Error fetching doctor data:", err)
        setError("Failed to load settings. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchDoctorData()
  }, [session])

  const handleNotificationChange = (e) => {
    const { name, value, type, checked } = e.target
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const saveNotifications = async () => {
    try {
      setSaving(true)
      setError(null)

      const settingsData = {
        doctor_id: doctorId,
        email_notifications: notificationSettings.emailNotifications,
        sms_notifications: notificationSettings.smsNotifications,
        appointment_reminders: notificationSettings.appointmentReminders,
        reminder_hours: notificationSettings.reminderHours,
        updated_at: new Date().toISOString(),
      }

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from("doctor_settings")
        .select("id")
        .eq("doctor_id", doctorId)
        .single()

      if (existingSettings) {
        const { error } = await supabase.from("doctor_settings").update(settingsData).eq("doctor_id", doctorId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("doctor_settings").insert({
          ...settingsData,
          created_at: new Date().toISOString(),
        })

        if (error) throw error
      }

      setSuccess("Notification settings saved successfully!")
    } catch (err) {
      console.error("Error saving notification settings:", err)
      setError("Failed to save notification settings. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const savePassword = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("New passwords do not match")
        return
      }

      if (passwordForm.newPassword.length < 8) {
        setError("Password must be at least 8 characters long")
        return
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) throw error

      setSuccess("Password updated successfully!")
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      console.error("Error updating password:", err)
      setError("Failed to update password. Please try again.")
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="md:w-64 bg-gray-50 p-6 border-r border-gray-200">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex items-center px-3 py-2 w-full text-left rounded-md transition-colors ${
                  activeTab === "notifications" ? "bg-pink-100 text-pink-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Bell className="h-5 w-5 mr-2" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex items-center px-3 py-2 w-full text-left rounded-md transition-colors ${
                  activeTab === "security" ? "bg-pink-100 text-pink-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Lock className="h-5 w-5 mr-2" />
                <span>Security</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === "notifications" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Notification Preferences</h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="smsNotifications"
                        checked={notificationSettings.smsNotifications}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Appointment Reminders</h3>
                      <p className="text-sm text-gray-500">Get reminded about upcoming appointments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="appointmentReminders"
                        checked={notificationSettings.appointmentReminders}
                        onChange={handleNotificationChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label htmlFor="reminderHours" className="block text-sm font-medium text-gray-900 mb-2">
                      Reminder Time (hours before appointment)
                    </label>
                    <input
                      type="number"
                      id="reminderHours"
                      name="reminderHours"
                      min="1"
                      max="72"
                      value={notificationSettings.reminderHours}
                      onChange={handleNotificationChange}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={saveNotifications}
                      disabled={saving}
                      className="flex items-center px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {saving ? "Saving..." : "Save Notifications"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Security Settings</h2>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="block w-full px-4 py-3 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={savePassword}
                      disabled={saving}
                      className="flex items-center px-6 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 transition-colors"
                    >
                      <Lock className="h-5 w-5 mr-2" />
                      {saving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
