"use client"

import { useState } from "react"
import { UserAuth } from "../../context/AuthContext"
import { Settings, Bell, Moon, Sun, Globe, Lock, AlertCircle, Check, Eye, EyeOff } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"

const SettingsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const location = useLocation()

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    siteName: "CareSync Admin",
    language: "en",
    timeZone: "UTC",
    theme: "light",
  })

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appNotifications: true,
    dailyReports: true,
    weeklyReports: true,
  })

  // Security settings state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleGeneralSettingsChange = (e) => {
    const { name, value, type, checked } = e.target
    setGeneralSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleNotificationSettingsChange = (e) => {
    const { name, checked } = e.target
    setNotificationSettings((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const saveGeneralSettings = () => {
    // In a real app, this would be an API call to save settings
    setSuccess("General settings saved successfully")
    setTimeout(() => setSuccess(null), 3000)
  }

  const saveNotificationSettings = () => {
    // In a real app, this would be an API call to save settings
    setSuccess("Notification settings saved successfully")
    setTimeout(() => setSuccess(null), 3000)
  }

  const savePassword = () => {
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    // In a real app, this would be an API call to change password
    setSuccess("Password changed successfully")
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 3000)
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

        {/* Settings Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-600">Manage your system preferences and settings</p>
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

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Settings Tabs */}
              <div className="md:w-64 bg-gray-50 p-6 border-r border-gray-200">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("general")}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                      activeTab === "general" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Settings className="h-5 w-5 mr-2" />
                    <span>General</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                      activeTab === "notifications" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Bell className="h-5 w-5 mr-2" />
                    <span>Notifications</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("appearance")}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                      activeTab === "appearance" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {generalSettings.theme === "dark" ? (
                      <Moon className="h-5 w-5 mr-2" />
                    ) : (
                      <Sun className="h-5 w-5 mr-2" />
                    )}
                    <span>Appearance</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`flex items-center px-3 py-2 w-full text-left rounded-md ${
                      activeTab === "security" ? "bg-pink-50 text-pink-600" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    <span>Security</span>
                  </button>
                </nav>
              </div>

              {/* Settings Content */}
              <div className="flex-1 p-6">
                {activeTab === "general" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">General Settings</h2>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-1">
                          Site Name
                        </label>
                        <input
                          type="text"
                          id="siteName"
                          name="siteName"
                          value={generalSettings.siteName}
                          onChange={handleGeneralSettingsChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                          Language
                        </label>
                        <div className="relative">
                          <select
                            id="language"
                            name="language"
                            value={generalSettings.language}
                            onChange={handleGeneralSettingsChange}
                            className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
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
                        <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700 mb-1">
                          Time Zone
                        </label>
                        <select
                          id="timeZone"
                          name="timeZone"
                          value={generalSettings.timeZone}
                          onChange={handleGeneralSettingsChange}
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        </select>
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={saveGeneralSettings}
                          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                        >
                          Save Settings
                        </button>
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
                          <p className="text-sm text-gray-500">Receive system notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="emailNotifications"
                            checked={notificationSettings.emailNotifications}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">SMS Notifications</h3>
                          <p className="text-sm text-gray-500">Receive system notifications via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="smsNotifications"
                            checked={notificationSettings.smsNotifications}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
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
                            name="appNotifications"
                            checked={notificationSettings.appNotifications}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Daily Reports</h3>
                          <p className="text-sm text-gray-500">Receive daily summary reports</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="dailyReports"
                            checked={notificationSettings.dailyReports}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-700">Weekly Reports</h3>
                          <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="weeklyReports"
                            checked={notificationSettings.weeklyReports}
                            onChange={handleNotificationSettingsChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={saveNotificationSettings}
                          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                        >
                          Save Settings
                        </button>
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
                              generalSettings.theme === "light"
                                ? "border-pink-500 bg-pink-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setGeneralSettings((prev) => ({ ...prev, theme: "light" }))}
                          >
                            <Sun className="h-8 w-8 text-gray-700 mb-2" />
                            <span className="text-sm font-medium">Light</span>
                          </div>
                          <div
                            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${
                              generalSettings.theme === "dark"
                                ? "border-pink-500 bg-pink-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => setGeneralSettings((prev) => ({ ...prev, theme: "dark" }))}
                          >
                            <Moon className="h-8 w-8 text-gray-700 mb-2" />
                            <span className="text-sm font-medium">Dark</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={saveGeneralSettings}
                          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h2>

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
                            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
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
                            className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
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
                          className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>

                      <div className="pt-5">
                        <button
                          onClick={savePassword}
                          className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SettingsPage
