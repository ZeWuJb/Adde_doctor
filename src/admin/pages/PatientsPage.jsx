"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { Search, Filter, ChevronDown, User, AlertCircle, X } from "lucide-react"
import { useAdmin } from "../../hooks/useAdmin"
import { getImageSrc } from "../../services/imageService"

const PatientsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { loading, error, patients } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [filteredPatients, setFilteredPatients] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [ageFilter, setAgeFilter] = useState("all")
  const [pregnancyWeekFilter, setPregnancyWeekFilter] = useState("all")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)
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
    if (patients.length === 0) {
      setFilteredPatients([])
      return
    }

    let filtered = [...patients]

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (ageFilter !== "all") {
      if (ageFilter === "under25") {
        filtered = filtered.filter((patient) => patient.age < 25)
      } else if (ageFilter === "25to35") {
        filtered = filtered.filter((patient) => patient.age >= 25 && patient.age <= 35)
      } else if (ageFilter === "over35") {
        filtered = filtered.filter((patient) => patient.age > 35)
      }
    }

    if (pregnancyWeekFilter !== "all") {
      if (pregnancyWeekFilter === "first") {
        filtered = filtered.filter((patient) => patient.pregnancy_weeks <= 12)
      } else if (pregnancyWeekFilter === "second") {
        filtered = filtered.filter((patient) => patient.pregnancy_weeks > 12 && patient.pregnancy_weeks <= 27)
      } else if (pregnancyWeekFilter === "third") {
        filtered = filtered.filter((patient) => patient.pregnancy_weeks > 27)
      }
    }

    setFilteredPatients(filtered)
  }, [searchTerm, ageFilter, pregnancyWeekFilter, patients])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient)
    setShowPatientDetails(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateDueDate = (startDate, weeks, days) => {
    if (!startDate) return "N/A"

    const pregnancyStart = new Date(startDate)
    const dueDate = new Date(pregnancyStart)

    dueDate.setDate(dueDate.getDate() + 280)

    if (weeks) {
      dueDate.setDate(dueDate.getDate() - weeks * 7)
    }

    if (days) {
      dueDate.setDate(dueDate.getDate() - days)
    }

    return formatDate(dueDate)
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
                <p className="ml-3 text-lg text-gray-700">Loading patients...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Patients Management</h1>
              <p className="text-pink-100">View and manage patient information</p>
            </div>

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
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filters
                <ChevronDown
                  className={`ml-2 h-4 w-4 transform ${showFilters ? "rotate-180" : ""} transition-transform`}
                />
              </button>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
                    <select
                      value={ageFilter}
                      onChange={(e) => setAgeFilter(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">All Ages</option>
                      <option value="under25">Under 25</option>
                      <option value="25to35">25 to 35</option>
                      <option value="over35">Over 35</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pregnancy Trimester</label>
                    <select
                      value={pregnancyWeekFilter}
                      onChange={(e) => setPregnancyWeekFilter(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">All Trimesters</option>
                      <option value="first">First Trimester (0-12 weeks)</option>
                      <option value="second">Second Trimester (13-27 weeks)</option>
                      <option value="third">Third Trimester (28+ weeks)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Patients Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-800">Patients</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredPatients.length} of {patients.length} patients
                </p>
              </div>

              {filteredPatients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Age
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pregnancy Week
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Health Conditions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.user_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {patient.profile_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full object-cover"
                                    src={
                                      getImageSrc(patient.profile_url, "/placeholder.svg?height=40&width=40") ||
                                      "/placeholder.svg" 
                                    }
                                    alt={patient.full_name}
                                    onError={(e) => {
                                      if (e.target.src !== "/placeholder.svg?height=40&width=40") {
                                        e.target.src = "/placeholder.svg?height=40&width=40"
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                                    <User className="h-6 w-6 text-pink-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{patient.full_name}</div>
                                <div className="text-sm text-gray-500">{patient.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.age || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patient.pregnancy_weeks ? `${patient.pregnancy_weeks} weeks` : "N/A"}
                            {patient.pregnancy_days ? `, ${patient.pregnancy_days} days` : ""}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {calculateDueDate(
                              patient.pregnancy_start_date,
                              patient.pregnancy_weeks,
                              patient.pregnancy_days,
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {patient.health_conditions && patient.health_conditions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {patient.health_conditions.slice(0, 2).map((condition, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full"
                                  >
                                    {condition}
                                  </span>
                                ))}
                                {patient.health_conditions.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                    +{patient.health_conditions.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              "None"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewPatient(patient)}
                              className="text-pink-600 hover:text-pink-900 transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <User className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                  <p className="text-gray-600">
                    {searchTerm || ageFilter !== "all" || pregnancyWeekFilter !== "all"
                      ? "Try adjusting your search or filters"
                      : "No patients are registered in the system yet"}
                  </p>
                  {(searchTerm || ageFilter !== "all" || pregnancyWeekFilter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchTerm("")
                        setAgeFilter("all")
                        setPregnancyWeekFilter("all")
                      }}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Patient Details</h2>
                <button onClick={() => setShowPatientDetails(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-20 w-20">
                    {selectedPatient.profile_url ? (
                      <img
                        className="h-20 w-20 rounded-full object-cover"
                        src={
                          getImageSrc(selectedPatient.profile_url, "/placeholder.svg?height=80&width=80") ||
                          "/placeholder.svg" 
                        }
                        alt={selectedPatient.full_name}
                        onError={(e) => {
                          if (e.target.src !== "/placeholder.svg?height=80&width=80") {
                            e.target.src = "/placeholder.svg?height=80&width=80"
                          }
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center">
                        <User className="h-10 w-10 text-pink-600" />
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    <h3 className="text-lg font-medium text-gray-900">{selectedPatient.full_name}</h3>
                    <p className="text-gray-500">{selectedPatient.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Personal Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Age</p>
                          <p className="text-sm font-medium">{selectedPatient.age || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Gender</p>
                          <p className="text-sm font-medium">{selectedPatient.gender || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Height</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.height
                              ? `${selectedPatient.height} ${selectedPatient.height_unit || "cm"}`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Weight</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.weight
                              ? `${selectedPatient.weight} ${selectedPatient.weight_unit || "kg"}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Pregnancy Information</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Pregnancy Week</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.pregnancy_weeks ? `${selectedPatient.pregnancy_weeks} weeks` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Pregnancy Days</p>
                          <p className="text-sm font-medium">
                            {selectedPatient.pregnancy_days ? `${selectedPatient.pregnancy_days} days` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm font-medium">{formatDate(selectedPatient.pregnancy_start_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Due Date</p>
                          <p className="text-sm font-medium">
                            {calculateDueDate(
                              selectedPatient.pregnancy_start_date,
                              selectedPatient.pregnancy_weeks,
                              selectedPatient.pregnancy_days,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPatient.health_conditions && selectedPatient.health_conditions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Health Conditions</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient.health_conditions.map((condition, index) => (
                          <span key={index} className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                            {condition}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientsPage
