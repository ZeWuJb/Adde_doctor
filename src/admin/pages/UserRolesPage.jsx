"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { Shield, Search, Plus, Edit, Trash2, Users, AlertCircle } from "lucide-react"

const UserRolesPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "Admin",
      description: "Full system access with all permissions",
      userCount: 3,
      permissions: ["manage_doctors", "manage_patients", "manage_content", "manage_roles", "system_monitoring"],
    },
    {
      id: 2,
      name: "Doctor",
      description: "Access to patient data and appointments",
      userCount: 42,
      permissions: ["view_patients", "manage_appointments", "view_content"],
    },
    {
      id: 3,
      name: "Patient",
      description: "Limited access to personal data and appointments",
      userCount: 189,
      permissions: ["view_profile", "book_appointments", "view_content"],
    },
    {
      id: 4,
      name: "Content Manager",
      description: "Manages health information and educational content",
      userCount: 5,
      permissions: ["manage_content", "view_content"],
    },
  ])
  const [filteredRoles, setFilteredRoles] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentRole, setCurrentRole] = useState(null)
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [],
  })
  const location = useLocation()

  // Available permissions in the system
  const availablePermissions = [
    { id: "manage_doctors", name: "Manage Doctors", description: "Add, edit, and remove doctors" },
    { id: "manage_patients", name: "Manage Patients", description: "View and manage patient information" },
    { id: "manage_content", name: "Manage Content", description: "Create and edit health information" },
    { id: "manage_roles", name: "Manage Roles", description: "Create and edit user roles" },
    { id: "system_monitoring", name: "System Monitoring", description: "Access system metrics and logs" },
    { id: "view_patients", name: "View Patients", description: "View patient information" },
    { id: "manage_appointments", name: "Manage Appointments", description: "Create and manage appointments" },
    { id: "view_content", name: "View Content", description: "View health information" },
    { id: "view_profile", name: "View Profile", description: "View personal profile" },
    { id: "book_appointments", name: "Book Appointments", description: "Schedule appointments" },
  ]

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true)

        // In a real app, fetch from your Supabase table
        // For now, we'll use the mock data defined above

        setFilteredRoles(roles)
      } catch (err) {
        console.error("Error fetching roles:", err.message)
        setError("Failed to fetch user roles. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (session && session.role === "admin") {
      fetchRoles()
    } else {
      setLoading(false)
    }
  }, [session, roles])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRoles(roles)
    } else {
      const filtered = roles.filter(
        (role) =>
          role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredRoles(filtered)
    }
  }, [searchTerm, roles])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAddRole = () => {
    // Validate inputs
    if (!newRole.name || !newRole.description) {
      setError("Please fill in all required fields")
      return
    }

    // In a real app, you would save to your database
    const roleToAdd = {
      id: roles.length + 1,
      name: newRole.name,
      description: newRole.description,
      userCount: 0,
      permissions: newRole.permissions,
    }

    setRoles([...roles, roleToAdd])

    // Reset form and close modal
    setNewRole({
      name: "",
      description: "",
      permissions: [],
    })
    setShowAddModal(false)
  }

  const handleEditRole = () => {
    // Validate inputs
    if (!currentRole.name || !currentRole.description) {
      setError("Please fill in all required fields")
      return
    }

    // In a real app, you would update your database
    const updatedRoles = roles.map((role) => (role.id === currentRole.id ? currentRole : role))

    setRoles(updatedRoles)
    setShowEditModal(false)
  }

  const handleDeleteRole = (id) => {
    // In a real app, you would delete from your database
    setRoles(roles.filter((role) => role.id !== id))
  }

  const handleEditClick = (role) => {
    setCurrentRole({ ...role })
    setShowEditModal(true)
  }

  const togglePermission = (permissionId) => {
    if (showAddModal) {
      if (newRole.permissions.includes(permissionId)) {
        setNewRole({
          ...newRole,
          permissions: newRole.permissions.filter((id) => id !== permissionId),
        })
      } else {
        setNewRole({
          ...newRole,
          permissions: [...newRole.permissions, permissionId],
        })
      }
    } else if (showEditModal) {
      if (currentRole.permissions.includes(permissionId)) {
        setCurrentRole({
          ...currentRole,
          permissions: currentRole.permissions.filter((id) => id !== permissionId),
        })
      } else {
        setCurrentRole({
          ...currentRole,
          permissions: [...currentRole.permissions, permissionId],
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading user roles...</p>
      </div>
    )
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

        {/* User Roles Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">User Role Management</h1>
            <p className="text-gray-600">Manage user roles and permissions</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
              <button className="mt-2 text-sm font-medium text-red-700 underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Role
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredRoles.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center">
                              <Shield className="h-6 w-6 text-pink-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{role.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{role.userCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.slice(0, 2).map((permission) => (
                              <span
                                key={permission}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {permission
                                  .split("_")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")}
                              </span>
                            ))}
                            {role.permissions.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                                +{role.permissions.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditClick(role)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit className="h-4 w-4 inline mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={role.userCount > 0}
                          >
                            <Trash2 className="h-4 w-4 inline mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No roles found</h3>
                <p className="text-gray-500">
                  {searchTerm ? "Try adjusting your search" : "Get started by adding your first role"}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Role</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows="2"
                    placeholder="Brief description of the role"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                  <div className="space-y-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`permission-${permission.id}`}
                            type="checkbox"
                            checked={newRole.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`permission-${permission.id}`} className="font-medium text-gray-700">
                            {permission.name}
                          </label>
                          <p className="text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Add Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && currentRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Edit Role</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                  <input
                    type="text"
                    value={currentRole.name}
                    onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter role name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={currentRole.description}
                    onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows="2"
                    placeholder="Brief description of the role"
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">Permissions</label>
                    <span className="text-xs text-gray-500">
                      {currentRole.permissions.length} of {availablePermissions.length} selected
                    </span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {availablePermissions.map((permission) => (
                      <div key={permission.id} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`edit-permission-${permission.id}`}
                            type="checkbox"
                            checked={currentRole.permissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`edit-permission-${permission.id}`} className="font-medium text-gray-700">
                            {permission.name}
                          </label>
                          <p className="text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRole}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Save Changes
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
