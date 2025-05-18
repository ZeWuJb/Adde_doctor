"use client"

import { Users, Calendar, Settings, LogOut, User, PieChart, Activity, BookOpen, Shield, Server } from "lucide-react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { useEffect, useState } from "react"
import { supabase } from "../../supabaseClient"

const AdminSidebar = ({ sidebarOpen, session, userData, handleSignOut, currentPath }) => {
  // Add state for admin data
  const [adminData, setAdminData] = useState(null)
  const [, setAdminLoading] = useState(true)

  // Add useEffect to fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (session && session.user) {
        try {
          const { data, error } = await supabase.from("admins").select("*").eq("user_id", session.user.id).single()

          if (error) {
            console.error("Error fetching admin data:", error.message)
          } else {
            setAdminData(data)
          }
        } catch (err) {
          console.error("Error in fetchAdminData:", err.message)
        } finally {
          setAdminLoading(false)
        }
      }
    }

    fetchAdminData()
  }, [session])

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition-transform duration-300 ease-in-out`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center h-16 px-6 bg-gradient-to-r from-pink-500 to-purple-600">
          <h1 className="text-xl font-bold text-white">CareSync Admin</h1>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="flex flex-col items-center py-6 border-b">
            {/* Update the component to use adminData if available */}
            {/* In the profile section of the sidebar: */}
            <div className="flex items-center p-4">
              <div className="flex-shrink-0">
                {adminData?.profile_url ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={adminData.profile_url || "/placeholder.svg"}
                    alt={adminData.full_name}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-pink-600" />
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {adminData?.full_name || userData?.full_name || "Administrator"}
                </p>
                <p className="text-xs text-gray-500">
                  {adminData?.email || userData?.email || session?.user?.email || "admin@example.com"}
                </p>
              </div>
            </div>
          </div>

          <nav className="px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin-dashboard"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin-dashboard"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <PieChart
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin-dashboard" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/doctors"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/doctors"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Users
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/doctors" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Doctors</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/patients"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/patients"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <User
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/patients" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Patients</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/appointments"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/appointments"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Calendar
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/appointments" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Appointments</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/content"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/content"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <BookOpen
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/content" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Health Content</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/user-roles"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/user-roles"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Shield
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/user-roles" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>User Roles</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/system"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/system"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Server
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/system" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>System Monitoring</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/analytics"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/analytics"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Activity
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/analytics" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Analytics</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/settings"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/settings"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Settings
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/settings" ? "text-white" : "text-gray-500"}`}
                  />
                  <span>Settings</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

AdminSidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  session: PropTypes.object.isRequired,
  userData: PropTypes.object,
  handleSignOut: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
}

export default AdminSidebar
