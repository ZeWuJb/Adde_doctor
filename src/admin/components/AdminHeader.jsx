"use client"

import { Bell, Menu, X, User } from "lucide-react"
import PropTypes from "prop-types"

const AdminHeader = ({ sidebarOpen, setSidebarOpen, session }) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-gray-600 md:hidden focus:outline-none">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="flex items-center ml-auto">
          <button className="relative p-1 mr-4 text-gray-600 hover:text-gray-900 focus:outline-none">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button className="flex items-center focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {session?.user?.user_metadata?.avatar_url ? (
                  <img
                    src={session.user.user_metadata.avatar_url || "/placeholder.svg"}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={16} className="text-gray-500" />
                )}
              </div>
            </button>
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
