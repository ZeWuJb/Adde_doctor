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
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(null)
  const location = useLocation()

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
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading doctors...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location?.pathname || "/doctors"}
      />
      <div className="flex-1 md:ml-64">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Doctors Management</h1>
            <p className="text-gray-600">Manage and monitor all doctors in the system</p>
          </div>
          {actionSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>{actionSuccess}</span>
              </div>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                <span>{error}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                aria-label="Search doctors by name, specialty, email, or description"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <button
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              onClick={handleAddDoctor}
              aria-label="Add new doctor"
            >
              <Plus className="h-5 w-5 mr-2" aria-hidden="true" />
              Add New Doctor
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Doctor
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Specialty
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Consultations
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDoctors && filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {doctor.profile_url ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={doctor.profile_url || "/placeholder.svg"}
                                  alt={`Profile picture of ${doctor.full_name || "Doctor"}`}
                                  onError={(e) => {
                                    e.target.parentNode.innerHTML = `<div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-gray-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>`
                                  }}
                                />
                              ) : (
                                <User size={20} className="text-gray-500" />
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
                          <div className="text-sm text-gray-900">{doctor.description || "No description"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(doctor.payment_required_amount)}</div>
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
                          <button
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleEditDoctor(doctor)}
                            aria-label={`Edit ${doctor.full_name || "doctor"}`}
                          >
                            <Edit className="h-4 w-4 inline mr-1" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteClick(doctor)}
                            aria-label={`Delete ${doctor.full_name || "doctor"}`}
                          >
                            <Trash2 className="h-4 w-4 inline mr-1" aria-hidden="true" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        {searchTerm ? "No doctors match your search criteria" : "No doctors found in the system"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
