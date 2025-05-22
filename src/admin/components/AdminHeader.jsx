"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, X, User } from "lucide-react"
import PropTypes from "prop-types"
import { UserAuth } from "../../context/AuthContext"
import { Link } from "react-router-dom"

const AdminHeader = ({ sidebarOpen, setSidebarOpen, session }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { signOut } = UserAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest(".profile-dropdown")) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileDropdownOpen])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-6">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 text-gray-600 md:hidden focus:outline-none hover:text-pink-600 transition-colors"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="flex items-center ml-auto">
          <button
            className="relative p-1 mr-4 text-gray-600 hover:text-pink-600 transition-colors focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center focus:outline-none"
              aria-label="Open profile menu"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {session?.user?.user_metadata?.avatar_url ? (
                  <img
                    src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=32&width=32"
                    }}
                  />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </div>
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 profile-dropdown">
                <Link to="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

AdminHeader.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
}

export default AdminHeader
