"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { supabase } from "../../supabaseClient"
import { supabaseAdmin } from "../../supabaseAdmin"
import { AlertTriangle, Eye, Ban, CheckCircle, X } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import ConfirmationModal from "../components/ConfirmationModal"
import { useLocation } from "react-router-dom"
import { getImageSrc } from "../../services/imageService"
import PropTypes from "prop-types"

const UserRolesPage = () => {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reportedUsers, setReportedUsers] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Modal states
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "danger",
  })

  const { session, userData, signOut } = UserAuth()
  const location = useLocation()

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        if (!session?.user?.id) {
          setError("No user session found")
          setLoading(false)
          return
        }

        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle()

        const userIsAdmin = !!adminData
        setIsAdmin(userIsAdmin)

        if (!userIsAdmin) {
          setError("You don't have permission to manage reports. Please contact an administrator.")
          setLoading(false)
          return
        }

        await fetchReportedUsers()

        // Setup realtime notifications
        try {
          const reportSubscription = supabase
            .channel("admin-reports")
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "main_report",
                filter: "report_count.gte.3",
              },
              (payload) => {
                const newNotification = {
                  id: Date.now(),
                  message: `New report: Post has reached ${payload.new.report_count} reports`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  type: "report",
                  data: payload.new,
                }
                setNotifications((prev) => [newNotification, ...prev])
                setUnreadCount((prev) => prev + 1)
                fetchReportedUsers()
              },
            )
            .subscribe()

          return () => {
            supabase.removeChannel(reportSubscription)
          }
        } catch (err) {
          console.error("Error setting up real-time notifications:", err)
        }
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load report management system.")
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndFetchData()
  }, [session])

  const handleSignOut = async () => {
    await signOut()
  }

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast)
      }
    }, 3000)
  }

  const fetchReportedUsers = async () => {
    try {
      const { data: mainReports, error } = await supabaseAdmin
        .from("main_report")
        .select(`
          id,
          post_id,
          reason,
          report_count,
          created_at,
          posts:post_id (
            id,
            title,
            content,
            image_url,
            created_at,
            mothers:mother_id (
              user_id,
              full_name,
              email,
              profile_url
            )
          )
        `)
        .gte("report_count", 3)

      if (error) throw error

      const userReports = {}
      mainReports?.forEach((report) => {
        const userId = report.posts?.mothers?.user_id
        if (userId) {
          if (!userReports[userId]) {
            userReports[userId] = {
              user: report.posts.mothers,
              reports: [],
              totalReports: 0,
            }
          }
          userReports[userId].reports.push({
            ...report,
            post: report.posts,
          })
          userReports[userId].totalReports += report.report_count
        }
      })

      setReportedUsers(Object.values(userReports))
    } catch (err) {
      console.error("Error fetching reported users:", err)
      setError("Failed to fetch reported users")
    }
  }

  const handleBanUser = async (reportedUser) => {
    setConfirmModal({
      isOpen: true,
      title: "Ban User",
      message: `Are you sure you want to ban ${reportedUser.user.full_name}? This will permanently delete their account, all posts, and appointments. This action cannot be undone.`,
      onConfirm: () => executeBanUser(reportedUser),
      type: "danger",
    })
  }

  const executeBanUser = async (reportedUser) => {
    try {
      setActionLoading(true)
      setConfirmModal({ ...confirmModal, isOpen: false })
      const userId = reportedUser.user.user_id

      // Step 1: Delete all appointments for this user
      const { error: deleteAppointmentsError } = await supabaseAdmin
        .from("appointments")
        .delete()
        .eq("mother_id", userId)

      if (deleteAppointmentsError) {
        console.error("Error deleting appointments:", deleteAppointmentsError)
        throw deleteAppointmentsError
      }

      // Step 2: Delete all posts by this user (this will cascade delete related reports)
      const { error: deletePostsError } = await supabaseAdmin.from("posts").delete().eq("mother_id", userId)

      if (deletePostsError) {
        console.error("Error deleting user posts:", deletePostsError)
        throw deletePostsError
      }

      // Step 3: Delete the user from mothers table
      const { error: deleteUserError } = await supabaseAdmin.from("mothers").delete().eq("user_id", userId)

      if (deleteUserError) {
        console.error("Error deleting user:", deleteUserError)
        throw deleteUserError
      }

      // Step 4: Try to delete from auth.users (optional)
      try {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (authError) {
          console.warn("Could not delete auth user:", authError.message)
        }
      } catch (authErr) {
        console.warn("Auth deletion failed:", authErr.message)
      }

      showToast(`User ${reportedUser.user.full_name} has been banned successfully`)
      await fetchReportedUsers()
    } catch (err) {
      console.error("Error banning user:", err)
      showToast(`Failed to ban user: ${err.message}`, "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      onConfirm: () => executeDeletePost(postId),
      type: "warning",
    })
  }

  const executeDeletePost = async (postId) => {
    try {
      setActionLoading(true)
      setConfirmModal({ ...confirmModal, isOpen: false })

      const { error } = await supabaseAdmin.from("posts").delete().eq("id", postId)
      if (error) throw error

      showToast("Post deleted successfully")
      await fetchReportedUsers()
    } catch (err) {
      console.error("Error deleting post:", err)
      showToast("Failed to delete post", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolveReports = async (reportedUser) => {
    setConfirmModal({
      isOpen: true,
      title: "Resolve Reports",
      message: "Mark all reports for this user as resolved? The posts will remain but reports will be cleared.",
      onConfirm: () => executeResolveReports(reportedUser),
      type: "info",
    })
  }

  const executeResolveReports = async (reportedUser) => {
    try {
      setActionLoading(true)
      setConfirmModal({ ...confirmModal, isOpen: false })

      const postIds = reportedUser.reports.map((r) => r.post_id)

      if (postIds.length > 0) {
        const { error: mainReportError } = await supabaseAdmin.from("main_report").delete().in("post_id", postIds)
        if (mainReportError) throw mainReportError

        const { error: tempReportError } = await supabaseAdmin.from("temporary_report").delete().in("post_id", postIds)
        if (tempReportError) throw tempReportError
      }

      showToast("Reports resolved successfully")
      await fetchReportedUsers()
    } catch (err) {
      console.error("Error resolving reports:", err)
      showToast("Failed to resolve reports", "error")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
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
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            isCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
        >
          <AdminHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              <span className="ml-3 text-gray-600">Loading report management...</span>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
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
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
            isCollapsed ? "lg:ml-16" : "lg:ml-64"
          }`}
        >
          <AdminHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
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

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        {/* Header */}
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={(id) => {
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
            setUnreadCount((prev) => Math.max(0, prev - 1))
          }}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
              <p className="text-gray-600">Manage reported users and content</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Reported Users</h2>
                  <div className="text-sm text-gray-500">Users with posts reported 3+ times</div>
                </div>

                <div className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Reports
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reported Posts
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportedUsers.map((reportedUser, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                                  <img
                                    className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
                                    src={
                                      getImageSrc(reportedUser.user.profile_url) ||
                                      "/placeholder.svg?height=40&width=40"

                                    }
                                    alt={reportedUser.user.full_name}
                                    onError={(e) => {
                                      e.target.src = "/placeholder.svg?height=40&width=40"
                                    }}
                                  />
                                </div>
                                <div className="ml-3 sm:ml-4">
                                  <div className="text-sm font-medium text-gray-900">{reportedUser.user.full_name}</div>
                                  <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[150px] sm:max-w-none">
                                    {reportedUser.user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {reportedUser.totalReports} reports
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {reportedUser.reports.length} posts
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending Review
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-1 sm:space-y-0">
                                <button
                                  onClick={() => {
                                    setSelectedReport(reportedUser)
                                    setShowReportModal(true)
                                  }}
                                  className="text-blue-600 hover:text-blue-900 transition-colors text-xs sm:text-sm"
                                  title="View Details"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleBanUser(reportedUser)}
                                  disabled={actionLoading}
                                  className="text-red-600 hover:text-red-900 transition-colors disabled:text-gray-400 text-xs sm:text-sm"
                                  title="Ban User"
                                >
                                  <Ban className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                                  Ban
                                </button>
                                <button
                                  onClick={() => handleResolveReports(reportedUser)}
                                  disabled={actionLoading}
                                  className="text-green-600 hover:text-green-900 transition-colors disabled:text-gray-400 text-xs sm:text-sm"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                                  Resolve
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {reportedUsers.length === 0 && (
                          <tr>
                            <td colSpan="5" className="px-4 sm:px-6 py-8 text-center text-sm text-gray-500">
                              No reported users found. Great! Your community is clean.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[90%] max-w-[900px] shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reports for {selectedReport.user.full_name}</h3>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {selectedReport.reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{report.post.title}</h4>
                      <span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{report.post.content}</p>
                    {report.post.image_url && (
                      <div className="mb-3">
                        <img
                          src={getImageSrc(report.post.image_url) || "/placeholder.svg"}
                          alt="Post content"
                          className="w-full max-w-md h-48 object-cover rounded-md border"
                          onError={(e) => {
                            e.target.src = "/placeholder.svg"
                          }}
                        />
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {report.report_count} reports
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeletePost(report.post_id)}
                          disabled={actionLoading}
                          className="text-red-600 hover:text-red-900 text-sm disabled:text-gray-400"
                        >
                          Delete Post
                        </button>
                      </div>
                    </div>
                    {report.reason && (
                      <div className="mt-2 text-xs text-gray-500">
                        <strong>Reasons:</strong> {JSON.stringify(report.reason)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => handleResolveReports(selectedReport)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? "Resolving..." : "Resolve All Reports"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

UserRolesPage.propTypes = {
  session: PropTypes.object,
  userData: PropTypes.object,
  signOut: PropTypes.func,
}

export default UserRolesPage
