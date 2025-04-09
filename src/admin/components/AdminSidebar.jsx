"use client"

import { Users, Calendar, Settings, LogOut, User, PieChart, Activity } from "lucide-react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"

const AdminSidebar = ({ sidebarOpen, session, userData, handleSignOut, currentPath }) => {
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
            <div className="relative w-20 h-20 mb-2 rounded-full bg-gray-200 flex items-center justify-center">
              {session?.user?.user_metadata?.avatar_url ? (
                <img
                  src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={32} className="text-gray-500" />
              )}
            </div>
            {/* Update the user info display to use userData */}
            <h2 className="text-lg font-medium">
              {userData?.full_name || session?.userData?.full_name || "Administrator"}
            </h2>
            <p className="text-sm text-gray-500">{session?.user?.email}</p>
          </div>

          <nav className="px-4 py-6">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin-dashboard"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin-dashboard"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <PieChart
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin-dashboard" ? "text-white" : "text-gray-300"}`}
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
                      : "text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Users
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/doctors" ? "text-white" : "text-gray-300"}`}
                  />
                  <span>Doctors</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/appointments"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/appointments"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Calendar
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/appointments" ? "text-white" : "text-gray-300"}`}
                  />
                  <span>Appointments</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/analytics"
                  className={`flex items-center px-4 py-2 ${
                    currentPath === "/admin/analytics"
                      ? "text-white bg-pink-600 rounded-md"
                      : "text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Activity
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/analytics" ? "text-white" : "text-gray-300"}`}
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
                      : "text-gray-300 hover:bg-gray-100 hover:text-pink-600 rounded-md"
                  }`}
                >
                  <Settings
                    className={`w-5 h-5 mr-3 ${currentPath === "/admin/settings" ? "text-white" : "text-gray-300"}`}
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
