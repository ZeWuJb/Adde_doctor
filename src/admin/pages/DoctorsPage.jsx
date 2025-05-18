"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { Search, Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"
import { supabase } from "../../supabaseClient"

const DoctorsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const location = useLocation()

  // Add the fetchDoctors function outside of useEffect so it can be called from the subscription
  const fetchDoctors = async () => {
    try {
      setLoading(true)
      // Fetch doctors from Supabase
      const { data: doctorsData, error: doctorsError } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false })

      if (doctorsError) throw doctorsError

      // Get appointment counts for each doctor
      const doctorsWithCounts = await Promise.all(
        doctorsData.map(async (doctor) => {
          // Get appointment count
          const { count: appointmentsCount, error: appointmentsError } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)

          if (appointmentsError) {
            console.error("Error fetching appointment count:", appointmentsError.message)
          }

          // Get unique patient count
          const { data: uniquePatients, error: patientsError } = await supabase
            .from("appointments")
            .select("mother_id")
            .eq("doctor_id", doctor.id)

          if (patientsError) {
            console.error("Error fetching patient count:", patientsError.message)
          }

          const uniquePatientCount = uniquePatients ? new Set(uniquePatients.map((p) => p.mother_id)).size : 0

          return {
            id: doctor.id,
            name: doctor.full_name,
            specialty: doctor.speciality || "General",
            email: doctor.email,
            phone: doctor.phone_number || "N/A",
            patients: uniquePatientCount,
            appointments: appointmentsCount || 0,
            joinDate: doctor.created_at,
            status: doctor.status || "Active",
            avatar: doctor.profile_url || "https://randomuser.me/api/portraits/men/32.jpg",
          }
        }),
      )

      setDoctors(doctorsWithCounts)
      setFilteredDoctors(doctorsWithCounts)
    } catch (err) {
      console.error("Error fetching doctors:", err.message)
      setError("Failed to fetch doctors data. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // Update the useEffect to fetch real data from Supabase instead of using mock data
  useEffect(() => {
    fetchDoctors()
  }, [])

  // Add a subscription for real-time updates
  useEffect(() => {
    // Set up real-time subscription for doctors
    const doctorsSubscription = supabase
      .channel("doctors-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, (payload) => {
        console.log("Doctor change received:", payload)
        // Refresh the doctors data when changes occur
        fetchDoctors()
      })
      .subscribe()

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(doctorsSubscription)
    }
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDoctors(doctors)
    } else {
      const filtered = doctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredDoctors(filtered)
    }
  }, [searchTerm, doctors])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading doctors...</p>
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

        {/* Doctors Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Doctors Management</h1>
            <p className="text-gray-600">Manage and monitor all doctors in the system</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700">
              <Plus className="h-5 w-5 mr-2" />
              Add New Doctor
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                      Patients
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
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={doctor.avatar || "/placeholder.svg"}
                              alt={doctor.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                            <div className="text-sm text-gray-500">Joined {formatDate(doctor.joinDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.specialty}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{doctor.email}</div>
                        <div className="text-sm text-gray-500">{doctor.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.patients}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            doctor.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          <Edit className="h-4 w-4 inline mr-1" />
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4 inline mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DoctorsPage
