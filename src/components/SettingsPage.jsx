"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import { fetchDoctorSettings, updateDoctorSettings, updateDoctorPassword } from "../services/settingsService"
import {
  Settings,
  Bell,
  Moon,
  Sun,
  Globe,
  Clock,
  Lock,
  Save,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Calendar,
} from "lucide-react"

const SettingsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState("general")

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(null)

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)
        } else {
          setError("Failed to retrieve doctor information")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    fetchDoctorId()
  }, [session])

  // Then, load settings once we have the doctor ID
  useEffect(() => {
    const loadSettings = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
        const result = await fetchDoctorSettings(doctorId)
        if (result.success) {
          setSettings(result.data)
        } else {
          setError("Failed to load settings")
        }
      } catch (err) {
        console.error("Error loading settings:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [doctorId])

  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const result = await updateDoctorSettings(doctorId, settings)
      if (result.success) {
        setSettings(result.data)
        setSuccess("Settings saved successfully")

        // If theme was changed, apply it
        if (settings.theme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } else {
        setError("Failed to save settings")
      }
    } catch (err) {
      console.error("Error saving settings:", err)
      setError("An unexpected error occurred")
    } finally {
      setSaving(false)

      // Clear success message after 3 seconds
      if (success) {
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      }
    }
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSavePassword = async () => {
    try {
      setSaving(true)
      setPasswordError(null)
      setPasswordSuccess(null)

      // Validate passwords
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("New passwords do not match")
        setSaving(false)
        return
      }

      if (passwordForm.newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long")
        setSaving(false)
        return
      }

      const result = await updateDoctorPassword(passwordForm.currentPassword, passwordForm.newPassword)
      if (result.success) {
        setPasswordSuccess("Password updated successfully")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setPasswordError(result.error?.message || "Failed to update password")
      }
    } catch (err) {
      console.error("Error updating password:", err)
      setPasswordError("An unexpected error occurred")
    } finally {
      setSaving(false)

      // Clear success message after 3 seconds
      if (passwordSuccess) {
        setTimeout(() => {
          setPasswordSuccess(null)
        }, 3000)
      }
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and settings</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
          <div className="flex items-center">
            <Check className="h-5 w-5 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : settings ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="md:w-64 bg-gray-50 p-6 border-r border-gray-200">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("general")}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    activeTab === "general" ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings className="h-5 w-5 mr-2" />
                  <span>General</span>
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    activeTab === "notifications" ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Bell className="h-5 w-5 mr-2" />
                  <span>Notifications</span>
                </button>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    activeTab === "appearance" ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {settings.theme === "dark" ? <Moon className="h-5 w-5 mr-2" /> : <Sun className="h-5 w-5 mr-2" />}
                  <span>Appearance</span>
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                    activeTab === "security" ? "bg-primary-50 text-primary-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Lock className="h-5 w-5 mr-2" />
                  <span>Security</span>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === "general" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                        Language
                      </label>
                      <div className="relative">
                        <select
                          id="language"
                          name="language"
                          value={settings.language}
                          onChange={handleSettingChange}
                          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                        <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="time_zone" className="block text-sm font-medium text-gray-700 mb-1">
                        Time Zone
                      </label>
                      <div className="relative">
                        <select
                          id="time_zone"
                          name="time_zone"
                          value={settings.time_zone}
                          onChange={handleSettingChange}
                          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        </select>
                        <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="calendar_view" className="block text-sm font-medium text-gray-700 mb-1">
                        Default Calendar View
                      </label>
                      <div className="relative">
                        <select
                          id="calendar_view"
                          name="calendar_view"
                          value={settings.calendar_view}
                          onChange={handleSettingChange}
                          className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="day">Day</option>
                          <option value="week">Week</option>
                          <option value="month">Month</option>
                        </select>
                        <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Email Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="notification_email"
                          checked={settings.notification_email}
                          onChange={handleSettingChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="notification_sms"
                          checked={settings.notification_sms}
                          onChange={handleSettingChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">In-App Notifications</h3>
                        <p className="text-sm text-gray-500">Receive notifications within the app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="notification_app"
                          checked={settings.notification_app}
                          onChange={handleSettingChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div>
                      <label
                        htmlFor="appointment_reminder_hours"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Appointment Reminder Time (hours before)
                      </label>
                      <input
                        type="number"
                        id="appointment_reminder_hours"
                        name="appointment_reminder_hours"
                        min="1"
                        max="72"
                        value={settings.appointment_reminder_hours}
                        onChange={handleSettingChange}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "appearance" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Appearance Settings</h2>

                  <div className="space-y-6">
                    <div>
                      <span className="block text-sm font-medium text-gray-700 mb-3">Theme</span>
                      <div className="flex space-x-4">
                        <div
                          className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${
                            settings.theme === "light"
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSettings((prev) => ({ ...prev, theme: "light" }))}
                        >
                          <Sun className="h-8 w-8 text-gray-700 mb-2" />
                          <span className="text-sm font-medium">Light</span>
                        </div>
                        <div
                          className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${
                            settings.theme === "dark"
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSettings((prev) => ({ ...prev, theme: "dark" }))}
                        >
                          <Moon className="h-8 w-8 text-gray-700 mb-2" />
                          <span className="text-sm font-medium">Dark</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h2>

                  {passwordError && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <span>{passwordError}</span>
                      </div>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
                      <div className="flex items-center">
                        <Check className="h-5 w-5 mr-2" />
                        <span>{passwordSuccess}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <button
                        onClick={handleSavePassword}
                        disabled={saving}
                        className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                      >
                        {saving ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save button for all tabs except security */}
              {activeTab !== "security" && (
                <div className="mt-8 pt-5 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SettingsPage

