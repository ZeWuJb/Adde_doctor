"use client"

import {
  Users,
  Calendar,
  Settings,
  LogOut,
  User,
  PieChart,
  Activity,
  BookOpen,
  Shield,
  Server,
  X,
  Baby,
} from "lucide-react"
import { Link } from "react-router-dom"
import PropTypes from "prop-types"
import { useEffect, useState, useRef } from "react"
import { supabase } from "../../supabaseClient"

const AdminSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  session,
  userData,
  handleSignOut,
  currentPath,
  isCollapsed,
  setIsCollapsed,
}) => {
  const [adminData, setAdminData] = useState(null)
  const [, setAdminLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const mouseLeaveTimeoutId = useRef(null)
  const resizeTimeoutId = useRef(null)
  const transitionTimeoutId = useRef(null)

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

  useEffect(() => {
    const handleResize = () => {
      if (resizeTimeoutId.current) {
        clearTimeout(resizeTimeoutId.current)
      }
      resizeTimeoutId.current = setTimeout(() => {
        const currentIsMobile = window.innerWidth < 1024
        setIsMobile(currentIsMobile)
        if (currentIsMobile) {
          setIsCollapsed(false) // Mobile always has expanded content
          if (setSidebarOpen) setSidebarOpen(false) // Close sidebar on mobile
        } else {
          setIsCollapsed(true) // Desktop defaults to collapsed
        }
      }, 100) // Debounce resize events
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
      if (mouseLeaveTimeoutId.current) {
        clearTimeout(mouseLeaveTimeoutId.current)
      }
      if (resizeTimeoutId.current) {
        clearTimeout(resizeTimeoutId.current)
      }
      if (transitionTimeoutId.current) {
        clearTimeout(transitionTimeoutId.current)
      }
    }
  }, [setSidebarOpen, setIsCollapsed])

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024) {
      if (mouseLeaveTimeoutId.current) {
        clearTimeout(mouseLeaveTimeoutId.current)
        mouseLeaveTimeoutId.current = null
      }
      setIsTransitioning(true)
      setIsCollapsed(false) // Expand immediately on hover
      transitionTimeoutId.current = setTimeout(() => {
        setIsTransitioning(false) // Transition complete after 100ms
      }, 100)
    }
  }

  const handleMouseLeave = () => {
    if (window.innerWidth >= 1024) {
      if (transitionTimeoutId.current) {
        clearTimeout(transitionTimeoutId.current)
      }
      setIsTransitioning(true)
      mouseLeaveTimeoutId.current = setTimeout(() => {
        setIsCollapsed(true) // Collapse with a longer delay
        setIsTransitioning(false)
      }, 300) // Increased to 300ms for slower collapse
    }
  }

  const getImageSrc = (profileUrl) => {
    if (!profileUrl) return null
    if (profileUrl.startsWith("data:")) return profileUrl
    if (profileUrl.startsWith("http")) return profileUrl
    return `data:image/jpeg;base64,${profileUrl}`
  }

  const handleNavClick = (e) => {
    if ((isCollapsed || isTransitioning) && !isMobile) {
      e.preventDefault() // Prevent navigation when collapsed or transitioning
    }
  }

  const sidebarWidth = isCollapsed && !isMobile ? "w-16" : "w-64"

  return (
    <>
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        />
      )}
      <div
        data-sidebar
        data-collapsed={isCollapsed}
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl border-r border-gray-200 transform transition-all duration-100 ease-in-out ${sidebarWidth} ${
          sidebarOpen || !isMobile ? "translate-x-0" : "-translate-x-full"
        } select-none`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="relative flex items-center justify-between h-16 px-4 bg-gradient-to-r from-pink-500 to-purple-600">
            {!(isCollapsed && !isMobile) && (
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">CareSync Admin</h1>
            )}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
                className="flex items-center justify-center w-8 h-8 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-100 ml-auto"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-col flex-1 overflow-y-auto">
            {/* Profile section */}
            <div className={`border-b border-gray-200 ${isCollapsed && !isMobile ? "py-4" : "py-6"}`}>
              <div className={`flex items-center ${isCollapsed && !isMobile ? "justify-center" : "px-4"}`}>
                <div className="flex-shrink-0">
                  {adminData?.profile_url ? (
                    <img
                      className={`rounded-full object-cover ${isCollapsed && !isMobile ? "h-8 w-8" : "h-10 w-10"}`}
                      src={getImageSrc(adminData.profile_url) || "/placeholder.svg"}
                      alt={adminData.full_name || ""}
                      onError={(e) => {
                        e.target.style.display = "none"
                        const sibling = e.target.nextSibling
                        if (sibling && sibling.style) sibling.style.display = "flex"
                      }}
                    />
                  ) : null}
                  <div
                    className={`rounded-full bg-pink-100 flex items-center justify-center ${
                      isCollapsed && !isMobile ? "h-8 w-8" : "h-10 w-10"
                    } ${adminData?.profile_url && adminData.profile_url !== "/placeholder.svg" ? "hidden" : ""}`}
                  >
                    <User className={`text-pink-600 ${isCollapsed && !isMobile ? "h-4 w-4" : "h-6 w-6"}`} />
                  </div>
                </div>
                {!(isCollapsed && !isMobile) && (
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {adminData?.full_name || userData?.full_name || "Administrator"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {adminData?.email || userData?.email || session?.user?.email || "admin@example.com"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 py-4 ${isCollapsed && !isMobile ? "px-2" : "px-4"}`}>
              <ul className="space-y-1">
                {[
                  { path: "/admin-dashboard", icon: PieChart, label: "Dashboard" },
                  { path: "/admin/doctors", icon: Users, label: "Doctors" },
                  { path: "/admin/patients", icon: User, label: "Patients" },
                  { path: "/admin/appointments", icon: Calendar, label: "Appointments" },
                  { path: "/admin/content", icon: BookOpen, label: "Health Content" },
                  { path: "/admin/baby-names", icon: Baby, label: "Baby Names" },
                  { path: "/admin/user-roles", icon: Shield, label: "Report Management" },
                  { path: "/admin/system", icon: Server, label: "System Monitoring" },
                  { path: "/admin/analytics", icon: Activity, label: "Analytics" },
                  { path: "/admin/settings", icon: Settings, label: "Settings" },
                ].map((item) => {
                  const isActive = currentPath === item.path
                  const Icon = item.icon
                  const showText = !(isCollapsed && !isMobile)

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={(e) => handleNavClick(e, item.path)}
                        className={`group flex items-center ${
                          !showText ? "justify-center px-2" : "px-3"
                        } py-2.5 text-sm font-medium rounded-lg transition-all duration-100 transition-opacity duration-200 ${
                          isActive
                            ? "bg-pink-600 text-white shadow-lg transform scale-[1.02]"
                            : "text-gray-700 hover:bg-pink-50 hover:text-pink-600 hover:shadow-md hover:transform hover:scale-[1.01]"
                        } ${(isCollapsed || isTransitioning) && !isMobile ? "cursor-not-allowed opacity-60" : "cursor-pointer opacity-100"}`}
                        title={!showText ? item.label : ""}
                      >
                        <Icon
                          className={`flex-shrink-0 ${!showText ? "h-5 w-5" : "h-5 w-5 mr-3"} ${
                            isActive ? "text-white" : "text-gray-500 group-hover:text-pink-600"
                          } transition-colors duration-100`}
                        />
                        {showText && <span className="truncate">{item.label}</span>}
                        {isActive && showText && <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          {/* Sign out button */}
          <div className={`border-t border-gray-200 ${isCollapsed && !isMobile ? "p-2" : "p-4"}`}>
            <button
              onClick={handleSignOut}
              className={`group flex items-center w-full ${
                isCollapsed && !isMobile ? "justify-center px-2" : "px-3"
              } py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-100 hover:shadow-md`}
              title={isCollapsed && !isMobile ? "Sign Out" : ""}
            >
              <LogOut
                className={`flex-shrink-0 h-5 w-5 ${isCollapsed && !isMobile ? "" : "mr-2"} group-hover:text-red-600 transition-colors duration-100`}
              />
              {!(isCollapsed && !isMobile) && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

AdminSidebar.propTypes = {
  sidebarOpen: PropTypes.bool.isRequired,
  setSidebarOpen: PropTypes.func,
  session: PropTypes.object.isRequired,
  userData: PropTypes.object,
  handleSignOut: PropTypes.func.isRequired,
  currentPath: PropTypes.string.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  setIsCollapsed: PropTypes.func.isRequired,
}

export default AdminSidebar
