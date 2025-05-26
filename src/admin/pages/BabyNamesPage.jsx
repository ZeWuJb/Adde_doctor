"use client"

import { useState, useContext } from "react"
import { AdminContext } from "../../context/AdminContext"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { Plus, Search, Edit, Trash2, Baby, Filter, Download } from "lucide-react"
import ConfirmationModal from "../components/ConfirmationModal"
import BabyNameFormModal from "../components/BabyNameFormModal"

const BabyNamesPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { babyNames, loading, error, deleteBabyName, refreshData } = useContext(AdminContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState("All")
  const [religionFilter, setReligionFilter] = useState("All")
  const [showFormModal, setShowFormModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedBabyName, setSelectedBabyName] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
  }

  // Filter baby names based on search and filters
  const filteredBabyNames =
    babyNames?.filter((name) => {
      const matchesSearch =
        name.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGender = genderFilter === "All" || name.gender === genderFilter
      const matchesReligion = religionFilter === "All" || name.religion === religionFilter
      return matchesSearch && matchesGender && matchesReligion
    }) || []

  const handleAddNew = () => {
    setSelectedBabyName(null)
    setIsEditing(false)
    setShowFormModal(true)
  }

  const handleEdit = (babyName) => {
    setSelectedBabyName(babyName)
    setIsEditing(true)
    setShowFormModal(true)
  }

  const handleDelete = (babyName) => {
    setSelectedBabyName(babyName)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (selectedBabyName) {
      const result = await deleteBabyName(selectedBabyName.id)
      if (result.success) {
        setShowDeleteModal(false)
        setSelectedBabyName(null)
        refreshData()
      }
    }
  }

  const exportToCSV = () => {
    const headers = ["Name", "Description", "Gender", "Religion", "Created At"]
    const csvContent = [
      headers.join(","),
      ...filteredBabyNames.map((name) =>
        [
          `"${name.name}"`,
          `"${name.description}"`,
          name.gender,
          name.religion,
          new Date(name.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "baby_names.csv"
    a.click()
    window.URL.revokeObjectURL(url)
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
                <p className="ml-3 text-lg text-gray-700">Loading baby names...</p>
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">Baby Names Management</h1>
                  <p className="text-pink-100">Manage baby name suggestions for expecting mothers</p>
                </div>
                <div className="mt-4 sm:mt-0 flex space-x-3">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                  <button
                    onClick={handleAddNew}
                    className="flex items-center px-4 py-2 bg-white text-pink-600 hover:bg-pink-50 rounded-lg transition-all duration-200 font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Name
                  </button>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Gender Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none"
                  >
                    <option value="All">All Genders</option>
                    <option value="Boy">Boy</option>
                    <option value="Girl">Girl</option>
                  </select>
                </div>

                {/* Religion Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={religionFilter}
                    onChange={(e) => setReligionFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent appearance-none"
                  >
                    <option value="All">All Religions</option>
                    <option value="Christian">Christian</option>
                    <option value="Muslim">Muslim</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-center md:justify-start">
                  <span className="text-sm text-gray-600">
                    {filteredBabyNames.length} of {babyNames?.length || 0} names
                  </span>
                </div>
              </div>
            </div>

            {/* Baby Names Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {filteredBabyNames.length === 0 ? (
                <div className="p-12 text-center">
                  <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No baby names found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || genderFilter !== "All" || religionFilter !== "All"
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first baby name"}
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Name
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                          Gender
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Religion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBabyNames.map((babyName) => (
                        <tr key={babyName.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
                                  <Baby className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{babyName.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={babyName.description}>
                              {babyName.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                babyName.gender === "Boy" ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                              }`}
                            >
                              {babyName.gender}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {babyName.religion}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(babyName.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(babyName)}
                                className="text-pink-600 hover:text-pink-900 p-1 rounded-full hover:bg-pink-50 transition-all"
                                title="Edit name"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(babyName)}
                                className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-all"
                                title="Delete name"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      {showFormModal && (
        <BabyNameFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          babyName={selectedBabyName}
          isEditing={isEditing}
        />
      )}

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          title="Delete Baby Name"
          message={`Are you sure you want to delete "${selectedBabyName?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </div>
  )
}

export default BabyNamesPage
