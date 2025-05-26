"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { Search, Plus, Edit, Trash2, AlertCircle, Check, User } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import DoctorFormModal from "../components/DoctorFormModal"
import DeleteConfirmationModal from "../components/DeleteConfirmationModal"
import { useAdmin } from "../../hooks/useAdmin"
import { formatDate, formatCurrency } from "../../services/profileService"
import { useLocation } from "react-router-dom"

const DoctorsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { loading, error, setError, doctors, deleteDoctor } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const location = useLocation()

  // Check if sidebar is collapsed
  // useEffect(() => {
  //   const checkSidebarState = () => {
  //     const sidebar = document.querySelector("[data-sidebar]")
  //     if (sidebar) {
  //       const rect = sidebar.getBoundingClientRect()
  //       setIsCollapsed(rect.width <= 64)
  //     }
  //   }

  //   checkSidebarState()
  //   window.addEventListener("resize", checkSidebarState)

  //   const observer = new MutationObserver(checkSidebarState)
  //   const sidebar = document.querySelector("[data-sidebar]")
  //   if (sidebar) {
  //     observer.observe(sidebar, { attributes: true, attributeFilter: ["class", "style"] })
  //   }

  //   return () => {
  //     window.removeEventListener("resize", checkSidebarState)
  //     observer.disconnect()
  //   }
  // }, [])

  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase().trim()
    if (lowerSearchTerm === "") {
      setFilteredDoctors(doctors)
    } else {
      const filtered = doctors.filter(
        (doctor) =>
          doctor.full_name?.toLowerCase().includes(lowerSearchTerm) ||
          (doctor.speciality || "").toLowerCase().includes(lowerSearchTerm) ||
          doctor.email?.toLowerCase().includes(lowerSearchTerm) ||
          (doctor.description || "").toLowerCase().includes(lowerSearchTerm),
      )
      setFilteredDoctors(filtered)
    }
  }, [searchTerm, doctors])

  useEffect(() => {
    if (error) {
      setTimeout(() => setError && setError(null), 3000)
    }
  }, [error, setError])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAddDoctor = () => {
    setSelectedDoctor(null)
    setIsFormModalOpen(true)
  }

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor)
    setIsFormModalOpen(true)
  }

  const handleDeleteClick = (doctor) => {
    setSelectedDoctor(doctor)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedDoctor) return

    setDeleteLoading(true)
    try {
      const result = await deleteDoctor(selectedDoctor.id)
      if (!result.success) {
        throw new Error(result.error || "Failed to delete doctor")
      }

      setActionSuccess(`Doctor ${selectedDoctor.full_name} has been deleted successfully`)
      setTimeout(() => setActionSuccess(null), 3000)
    } catch (err) {
      console.error("Error deleting doctor:", err.message)
      setError && setError(err.message)
    } finally {
      setDeleteLoading(false)
      setIsDeleteModalOpen(false)
      setSelectedDoctor(null)
    }
  }

  const handleSaveDoctor = (result) => {
    if (result.success) {
      const actionType = selectedDoctor ? "updated" : "added"
      setActionSuccess(`Doctor successfully ${actionType}`)
      setTimeout(() => setActionSuccess(null), 3000)
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
          className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
        >
          <AdminHeader
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            session={session}
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                <p className="ml-3 text-lg text-gray-700">Loading doctors...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        <AdminHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          session={session}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Doctors Management</h1>
              <p className="text-pink-100">Manage and monitor all doctors in the system</p>
            </div>

            {/* Success Alert */}
            {actionSuccess && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-green-700">{actionSuccess}</span>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <button
                className="flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                onClick={handleAddDoctor}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Doctor
              </button>
            </div>

            {/* Doctors Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-800">Doctors</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredDoctors.length} of {doctors.length} doctors
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Specialty
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consultations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDoctors && filteredDoctors.length > 0 ? (
                      filteredDoctors.map((doctor) => (
                        <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {doctor.profile_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={doctor.profile_url || "/placeholder.svg"}
                                    alt={`Profile picture of ${doctor.full_name || "Doctor"}`}
                                    onError={(e) => {
                                      e.target.parentNode.innerHTML = `<div class="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-pink-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
                                    }}
                                  />
                                ) : (
                                  <User size={20} className="text-pink-600" />
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {doctor.full_name || "Unnamed Doctor"}
                                </div>
                                <div className="text-sm text-gray-500">Joined {formatDate(doctor.created_at)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doctor.speciality || "Not specified"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{doctor.email || "No email"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {doctor.description || "No description"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatCurrency(doctor.payment_required_amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.consultations_given || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                doctor.type === "doctor" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {doctor.type || "doctor"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                className="text-pink-600 hover:text-pink-900 transition-colors"
                                onClick={() => handleEditDoctor(doctor)}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900 transition-colors"
                                onClick={() => handleDeleteClick(doctor)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No doctors found</h3>
                          <p className="text-gray-600">
                            {searchTerm ? "No doctors match your search criteria" : "No doctors found in the system"}
                          </p>
                          {searchTerm && (
                            <button
                              onClick={() => setSearchTerm("")}
                              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              Clear search
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <DoctorFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        doctor={selectedDoctor}
        onSave={handleSaveDoctor}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Doctor"
        message={`Are you sure you want to delete ${selectedDoctor?.full_name || "this doctor"}? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}

export default DoctorsPage
