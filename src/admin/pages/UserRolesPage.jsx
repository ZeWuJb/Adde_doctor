"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { supabase } from "../../supabaseClient"
import { supabaseAdmin } from "../../supabaseAdmin"
import { Edit, Trash2, Plus, Settings, Users, AlertTriangle, Eye, Ban, CheckCircle, X } from "lucide-react"

const UserRolesPage = () => {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [users, setUsers] = useState([])
  const [reportedUsers, setReportedUsers] = useState([])
  const [activeTab, setActiveTab] = useState("roles")

  // Modal states
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showUserRoleModal, setShowUserRoleModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Form states
  const [currentRole, setCurrentRole] = useState({ id: null, name: "", description: "", permissions: [] })
  const [currentPermission, setCurrentPermission] = useState({ id: null, name: "", description: "" })
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserRoles, setSelectedUserRoles] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)

  const { session } = UserAuth()

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
          setError("You don't have permission to manage roles. Please contact an administrator.")
          setLoading(false)
          return
        }

        await initializeDefaultData()
        await Promise.all([fetchRoles(), fetchPermissions(), fetchUsers(), fetchReportedUsers()])
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load role management system.")
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndFetchData()
  }, [session])

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 3000)
  }

  const initializeDefaultData = async () => {
    try {
      const { data: existingPermissions } = await supabaseAdmin.from("permissions").select("id").limit(1)

      if (!existingPermissions || existingPermissions.length === 0) {
        const defaultPermissions = [
          { name: "read_users", description: "View user information" },
          { name: "write_users", description: "Create and edit users" },
          { name: "delete_users", description: "Delete users" },
          { name: "read_appointments", description: "View appointments" },
          { name: "write_appointments", description: "Create and edit appointments" },
          { name: "delete_appointments", description: "Delete appointments" },
          { name: "read_reports", description: "View reports" },
          { name: "write_reports", description: "Create and edit reports" },
          { name: "admin_access", description: "Access admin panel" },
          { name: "manage_roles", description: "Manage user roles and permissions" },
          { name: "manage_content", description: "Manage content and articles" },
          { name: "system_monitoring", description: "Monitor system health" },
          { name: "moderate_posts", description: "Moderate community posts" },
          { name: "ban_users", description: "Ban or suspend users" },
        ]

        await supabaseAdmin.from("permissions").insert(defaultPermissions)
      }

      const { data: existingRoles } = await supabaseAdmin.from("roles").select("id").limit(1)

      if (!existingRoles || existingRoles.length === 0) {
        const defaultRoles = [
          { name: "super_admin", description: "Full system access" },
          { name: "admin", description: "Administrative access" },
          { name: "moderator", description: "Content moderation access" },
          { name: "doctor", description: "Healthcare provider access" },
          { name: "nurse", description: "Nursing staff access" },
          { name: "patient", description: "Patient access" },
        ]

        const { data: createdRoles } = await supabaseAdmin.from("roles").insert(defaultRoles).select()

        if (createdRoles) {
          const superAdminRole = createdRoles.find((role) => role.name === "super_admin")
          if (superAdminRole) {
            const { data: allPermissions } = await supabaseAdmin.from("permissions").select("id")
            if (allPermissions) {
              const rolePermissions = allPermissions.map((perm) => ({
                role_id: superAdminRole.id,
                permission_id: perm.id,
              }))
              await supabaseAdmin.from("role_permissions").insert(rolePermissions)
            }
          }
        }
      }
    } catch (err) {
      console.error("Error initializing default data:", err)
    }
  }

  const fetchRoles = async () => {
    try {
      const { data: rolesData, error } = await supabaseAdmin
        .from("roles")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error

      const { data: rolePermissions } = await supabaseAdmin.from("role_permissions").select(`
          role_id,
          permissions:permission_id (
            id,
            name,
            description
          )
        `)

      const { data: userRoleCounts } = await supabaseAdmin.from("user_roles").select("role_id")

      const userCounts =
        userRoleCounts?.reduce((acc, ur) => {
          acc[ur.role_id] = (acc[ur.role_id] || 0) + 1
          return acc
        }, {}) || {}

      const rolesWithDetails = rolesData.map((role) => {
        const rolePerms = rolePermissions?.filter((rp) => rp.role_id === role.id) || []
        const permissions = rolePerms.map((rp) => rp.permissions).filter(Boolean)

        return {
          ...role,
          permissions,
          userCount: userCounts[role.id] || 0,
        }
      })

      setRoles(rolesWithDetails)
    } catch (err) {
      console.error("Error fetching roles:", err)
    }
  }

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabaseAdmin.from("permissions").select("*").order("name", { ascending: true })

      if (error) throw error
      setPermissions(data || [])
    } catch (err) {
      console.error("Error fetching permissions:", err)
    }
  }

  const fetchUsers = async () => {
    try {
      const [adminsResult, doctorsResult, mothersResult] = await Promise.all([
        supabaseAdmin.from("admins").select("user_id, full_name, email"),
        supabaseAdmin.from("doctors").select("user_id, full_name, email"),
        supabaseAdmin.from("mothers").select("user_id, full_name, email"),
      ])

      const allUsers = [
        ...(adminsResult.data || []).map((u) => ({ ...u, type: "admin" })),
        ...(doctorsResult.data || []).map((u) => ({ ...u, type: "doctor" })),
        ...(mothersResult.data || []).map((u) => ({ ...u, type: "patient" })),
      ].filter((user) => user.user_id)

      // Fetch user roles
      const { data: userRoles } = await supabaseAdmin.from("user_roles").select(`
          user_id,
          roles:role_id (
            id,
            name,
            description
          )
        `)

      // Add roles to users
      const usersWithRoles = allUsers.map((user) => {
        const userRoleData = userRoles?.filter((ur) => ur.user_id === user.user_id) || []
        return {
          ...user,
          roles: userRoleData.map((ur) => ur.roles).filter(Boolean),
        }
      })

      setUsers(usersWithRoles)
    } catch (err) {
      console.error("Error fetching users:", err)
    }
  }

  const fetchReportedUsers = async () => {
    try {
      // Fetch main reports (posts with 3+ reports)
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
        .gte("report_count", 3) // Only fetch reports with 3+ reports

      if (error) throw error

      // Group by user and format data
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
    }
  }

  // Role CRUD operations
  const handleSaveRole = async () => {
    if (!currentRole.name.trim()) {
      showToast("Role name is required", "error")
      return
    }

    try {
      setActionLoading(true)

      if (currentRole.id) {
        const { error: roleError } = await supabaseAdmin
          .from("roles")
          .update({
            name: currentRole.name.trim(),
            description: currentRole.description?.trim() || null,
          })
          .eq("id", currentRole.id)

        if (roleError) throw roleError

        await supabaseAdmin.from("role_permissions").delete().eq("role_id", currentRole.id)

        if (currentRole.permissions.length > 0) {
          const rolePermissions = currentRole.permissions.map((permId) => ({
            role_id: currentRole.id,
            permission_id: permId,
          }))
          await supabaseAdmin.from("role_permissions").insert(rolePermissions)
        }
      } else {
        const { data: newRole, error: roleError } = await supabaseAdmin
          .from("roles")
          .insert({
            name: currentRole.name.trim(),
            description: currentRole.description?.trim() || null,
          })
          .select()
          .single()

        if (roleError) throw roleError

        if (currentRole.permissions.length > 0) {
          const rolePermissions = currentRole.permissions.map((permId) => ({
            role_id: newRole.id,
            permission_id: permId,
          }))
          await supabaseAdmin.from("role_permissions").insert(rolePermissions)
        }
      }

      await fetchRoles()
      setShowRoleModal(false)
      setCurrentRole({ id: null, name: "", description: "", permissions: [] })
      showToast(`Role ${currentRole.id ? "updated" : "created"} successfully`)
    } catch (err) {
      console.error("Error saving role:", err)
      showToast(`Failed to ${currentRole.id ? "update" : "create"} role`, "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("Are you sure you want to delete this role? This will remove all user assignments.")) {
      return
    }

    try {
      setActionLoading(true)
      const { error } = await supabaseAdmin.from("roles").delete().eq("id", roleId)
      if (error) throw error

      await Promise.all([fetchRoles(), fetchUsers()])
      showToast("Role deleted successfully")
    } catch (err) {
      console.error("Error deleting role:", err)
      showToast("Failed to delete role", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Permission CRUD operations
  const handleSavePermission = async () => {
    if (!currentPermission.name.trim()) {
      showToast("Permission name is required", "error")
      return
    }

    try {
      setActionLoading(true)

      if (currentPermission.id) {
        const { error } = await supabaseAdmin
          .from("permissions")
          .update({
            name: currentPermission.name.trim(),
            description: currentPermission.description?.trim() || null,
          })
          .eq("id", currentPermission.id)

        if (error) throw error
      } else {
        const { error } = await supabaseAdmin.from("permissions").insert({
          name: currentPermission.name.trim(),
          description: currentPermission.description?.trim() || null,
        })

        if (error) throw error
      }

      await Promise.all([fetchPermissions(), fetchRoles()])
      setShowPermissionModal(false)
      setCurrentPermission({ id: null, name: "", description: "" })
      showToast(`Permission ${currentPermission.id ? "updated" : "created"} successfully`)
    } catch (err) {
      console.error("Error saving permission:", err)
      showToast(`Failed to ${currentPermission.id ? "update" : "create"} permission`, "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePermission = async (permissionId) => {
    if (!window.confirm("Are you sure you want to delete this permission? This will remove it from all roles.")) {
      return
    }

    try {
      setActionLoading(true)
      const { error } = await supabaseAdmin.from("permissions").delete().eq("id", permissionId)
      if (error) throw error

      await Promise.all([fetchPermissions(), fetchRoles()])
      showToast("Permission deleted successfully")
    } catch (err) {
      console.error("Error deleting permission:", err)
      showToast("Failed to delete permission", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // User role management
  const handleSaveUserRoles = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)

      await supabaseAdmin.from("user_roles").delete().eq("user_id", selectedUser.user_id)

      if (selectedUserRoles.length > 0) {
        const userRoleInserts = selectedUserRoles.map((roleId) => ({
          user_id: selectedUser.user_id,
          role_id: roleId,
        }))
        await supabaseAdmin.from("user_roles").insert(userRoleInserts)
      }

      await Promise.all([fetchUsers(), fetchRoles()])
      setShowUserRoleModal(false)
      setSelectedUser(null)
      setSelectedUserRoles([])
      showToast("User roles updated successfully")
    } catch (err) {
      console.error("Error saving user roles:", err)
      showToast("Failed to update user roles", "error")
    } finally {
      setActionLoading(false)
    }
  }

  // Report management functions
  const handleBanUser = async (userId) => {
    if (!window.confirm("Are you sure you want to ban this user? This action cannot be undone.")) {
      return
    }

    try {
      setActionLoading(true)
      showToast("User banned successfully")
      await fetchReportedUsers()
    } catch (err) {
      console.error("Error banning user:", err)
      showToast("Failed to ban user", "error")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) {
      return
    }

    try {
      setActionLoading(true)
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
    if (!window.confirm("Mark all reports for this user as resolved?")) {
      return
    }

    try {
      setActionLoading(true)
      const postIds = reportedUser.reports.map((r) => r.post_id)
      await supabaseAdmin.from("main_report").delete().in("post_id", postIds)

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
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-3 text-gray-600">Loading role management...</span>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Roles & Permissions</h1>
              <p className="mt-1 text-sm text-gray-600">Manage system roles, permissions, and user assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Admin Panel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
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

        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("roles")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "roles"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Roles ({roles.length})
              </button>
              <button
                onClick={() => setActiveTab("permissions")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "permissions"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Permissions ({permissions.length})
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reports"
                    ? "border-pink-500 text-pink-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Reported Users ({reportedUsers.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "roles" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">System Roles</h2>
                  <button
                    onClick={() => {
                      setCurrentRole({ id: null, name: "", description: "", permissions: [] })
                      setShowRoleModal(true)
                    }}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Permissions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {roles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {role.description || "No description"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.slice(0, 3).map((perm) => (
                                <span
                                  key={perm.id}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {perm.name}
                                </span>
                              ))}
                              {role.permissions.length > 3 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  +{role.permissions.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {role.userCount}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentRole({
                                    id: role.id,
                                    name: role.name,
                                    description: role.description || "",
                                    permissions: role.permissions.map((p) => p.id),
                                  })
                                  setShowRoleModal(true)
                                }}
                                className="text-pink-600 hover:text-pink-900 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteRole(role.id)}
                                disabled={role.userCount > 0 || actionLoading}
                                className={`transition-colors ${
                                  role.userCount > 0 || actionLoading
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-red-600 hover:text-red-900"
                                }`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {roles.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                            No roles found. Create your first role to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">System Permissions</h2>
                  <button
                    onClick={() => {
                      setCurrentPermission({ id: null, name: "", description: "" })
                      setShowPermissionModal(true)
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Permission
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {permissions.map((permission) => (
                        <tr key={permission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {permission.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {permission.description || "No description"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(permission.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setCurrentPermission({
                                    id: permission.id,
                                    name: permission.name,
                                    description: permission.description || "",
                                  })
                                  setShowPermissionModal(true)
                                }}
                                className="text-pink-600 hover:text-pink-900 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePermission(permission.id)}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-900 transition-colors disabled:text-gray-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {permissions.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                            No permissions found. Create your first permission to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">System Users</h2>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.type === "admin"
                                  ? "bg-red-100 text-red-800"
                                  : user.type === "doctor"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map((role) => (
                                <span
                                  key={role.id}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                >
                                  {role.name}
                                </span>
                              ))}
                              {user.roles.length === 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No roles
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setSelectedUserRoles(user.roles.map((r) => r.id))
                                setShowUserRoleModal(true)
                              }}
                              className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700 transition-colors"
                            >
                              Manage Roles
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "reports" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Reported Users</h2>
                  <div className="text-sm text-gray-500">Users with posts reported 5+ times</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Reports
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Reported Posts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportedUsers.map((reportedUser, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={reportedUser.user.profile_url || "/placeholder.svg?height=40&width=40"}
                                  alt={reportedUser.user.full_name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{reportedUser.user.full_name}</div>
                                <div className="text-sm text-gray-500">{reportedUser.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {reportedUser.totalReports} reports
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {reportedUser.reports.length} posts
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending Review
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedReport(reportedUser)
                                  setShowReportModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleBanUser(reportedUser.user.user_id)}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-900 transition-colors disabled:text-gray-400"
                                title="Ban User"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleResolveReports(reportedUser)}
                                disabled={actionLoading}
                                className="text-green-600 hover:text-green-900 transition-colors disabled:text-gray-400"
                                title="Mark as Resolved"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {reportedUsers.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                            No reported users found. Great! Your community is clean.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{currentRole.id ? "Edit Role" : "Add New Role"}</h3>
                <button onClick={() => setShowRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                  <input
                    type="text"
                    placeholder="Enter role name"
                    value={currentRole.name}
                    onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    placeholder="Enter role description"
                    value={currentRole.description}
                    onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                    {permissions.map((permission) => (
                      <label key={permission.id} className="flex items-start">
                        <input
                          type="checkbox"
                          checked={currentRole.permissions.includes(permission.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCurrentRole({
                                ...currentRole,
                                permissions: [...currentRole.permissions, permission.id],
                              })
                            } else {
                              setCurrentRole({
                                ...currentRole,
                                permissions: currentRole.permissions.filter((id) => id !== permission.id),
                              })
                            }
                          }}
                          className="mt-1 mr-2"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                          <div className="text-xs text-gray-500">{permission.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : currentRole.id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPermissionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {currentPermission.id ? "Edit Permission" : "Add New Permission"}
                </h3>
                <button onClick={() => setShowPermissionModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permission Name</label>
                  <input
                    type="text"
                    placeholder="Enter permission name (e.g., read_users)"
                    value={currentPermission.name}
                    onChange={(e) => setCurrentPermission({ ...currentPermission, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    placeholder="Enter permission description"
                    value={currentPermission.description}
                    onChange={(e) => setCurrentPermission({ ...currentPermission, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermission}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : currentPermission.id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUserRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Manage Roles for {selectedUser.full_name}</h3>
                <button onClick={() => setShowUserRoleModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Assign Roles:</p>
                {roles.map((role) => (
                  <label key={role.id} className="flex items-start">
                    <input
                      type="checkbox"
                      checked={selectedUserRoles.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserRoles([...selectedUserRoles, role.id])
                        } else {
                          setSelectedUserRoles(selectedUserRoles.filter((id) => id !== role.id))
                        }
                      }}
                      className="mt-1 mr-2"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                      <div className="text-xs text-gray-500">{role.description}</div>
                      <div className="text-xs text-gray-400">{role.permissions.length} permissions</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUserRoleModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserRoles}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-xl bg-white">
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
                    <p className="text-sm text-gray-600 mb-2">{report.post.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        {report.report_count} reports
                      </span>
                      <button
                        onClick={() => handleDeletePost(report.post_id)}
                        disabled={actionLoading}
                        className="text-red-600 hover:text-red-900 text-sm disabled:text-gray-400"
                      >
                        Delete Post
                      </button>
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

export default UserRolesPage
