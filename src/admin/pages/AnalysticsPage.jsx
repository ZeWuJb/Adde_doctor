"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { BarChart, PieChart, LineChart, Calendar, Users, Activity, Download } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"
// Add imports for Supabase
import { supabase } from "../../supabaseClient"

const AnalyticsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const location = useLocation()

  // Add state for loading and error
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add state for analytics data
  const [analyticsData, setAnalyticsData] = useState({
    appointmentsByMonth: [],
    patientDemographics: [],
    doctorPerformance: [],
    stats: {
      totalAppointments: 0,
      activePatients: 0,
      doctorUtilization: 0,
    },
  })

  // Add useEffect to fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)

        // Fetch appointment counts by month
        const appointmentsByMonth = await fetchAppointmentsByMonth()

        // Fetch patient demographics
        const patientDemographics = await fetchPatientDemographics()

        // Fetch doctor performance
        const doctorPerformance = await fetchDoctorPerformance()

        // Fetch overall stats
        const stats = await fetchOverallStats()

        setAnalyticsData({
          appointmentsByMonth,
          patientDemographics,
          doctorPerformance,
          stats,
        })
      } catch (err) {
        console.error("Error fetching analytics data:", err.message)
        setError("Failed to fetch analytics data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [selectedPeriod, supabase])

  // Function to fetch appointments by month
  const fetchAppointmentsByMonth = async () => {
    try {
      // Get current date and calculate date 6 months ago
      const now = new Date()
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(now.getMonth() - 5) // Get 6 months including current month

      // Format date to ISO string for Supabase query
      const startDate = sixMonthsAgo.toISOString()

      // Fetch appointments from Supabase
      const { data, error } = await supabase
        .from("appointments")
        .select("requested_time")
        .gte("requested_time", startDate)

      if (error) throw error

      // Group appointments by month
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const appointmentCounts = Array(6).fill(0) // Initialize with 0 for 6 months

      data.forEach((appointment) => {
        const appointmentDate = new Date(appointment.requested_time)
        const monthDiff = (now.getMonth() - appointmentDate.getMonth() + 12) % 12

        if (monthDiff < 6) {
          appointmentCounts[5 - monthDiff]++ // Most recent month at the end
        }
      })

      // Create the result array with month names
      const result = []
      for (let i = 0; i < 6; i++) {
        const monthIndex = (sixMonthsAgo.getMonth() + i) % 12
        result.push({
          month: months[monthIndex],
          count: appointmentCounts[i],
        })
      }

      return result
    } catch (err) {
      console.error("Error fetching appointments by month:", err.message)
      return [
        { month: "Jan", count: 45 },
        { month: "Feb", count: 52 },
        { month: "Mar", count: 49 },
        { month: "Apr", count: 62 },
        { month: "May", count: 55 },
        { month: "Jun", count: 60 },
      ]
    }
  }

  // Function to fetch patient demographics
  const fetchPatientDemographics = async () => {
    try {
      // Fetch patients from Supabase
      const { data, error } = await supabase.from("mothers").select("age")

      if (error) throw error

      // Group patients by age range
      const ageGroups = [
        { range: "0-18", count: 0 },
        { range: "19-35", count: 0 },
        { range: "36-50", count: 0 },
        { range: "51-65", count: 0 },
        { range: "65+", count: 0 },
      ]

      data.forEach((patient) => {
        const age = patient.age || 0

        if (age <= 18) {
          ageGroups[0].count++
        } else if (age <= 35) {
          ageGroups[1].count++
        } else if (age <= 50) {
          ageGroups[2].count++
        } else if (age <= 65) {
          ageGroups[3].count++
        } else {
          ageGroups[4].count++
        }
      })

      return ageGroups
    } catch (err) {
      console.error("Error fetching patient demographics:", err.message)
      return [
        { age: "0-18", count: 28 },
        { age: "19-35", count: 45 },
        { age: "36-50", count: 56 },
        { age: "51-65", count: 38 },
        { age: "65+", count: 22 },
      ]
    }
  }

  // Function to fetch doctor performance
  const fetchDoctorPerformance = async () => {
    try {
      // Fetch doctors from Supabase
      const { data: doctors, error: doctorsError } = await supabase.from("doctors").select("id, full_name").limit(4)

      if (doctorsError) throw doctorsError

      // Get performance metrics for each doctor
      const doctorPerformance = await Promise.all(
        doctors.map(async (doctor) => {
          // Get appointment count
          const { count: appointmentsCount, error: appointmentsError } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("doctor_id", doctor.id)

          if (appointmentsError) throw appointmentsError

          // Get unique patient count
          const { data: uniquePatients, error: patientsError } = await supabase
            .from("appointments")
            .select("mother_id")
            .eq("doctor_id", doctor.id)

          if (patientsError) throw patientsError

          const uniquePatientCount = uniquePatients ? new Set(uniquePatients.map((p) => p.mother_id)).size : 0

          // Calculate rating (mock data)
          const rating = (4.5 + Math.random() * 0.5).toFixed(1)

          return {
            name: doctor.full_name,
            patients: uniquePatientCount,
            appointments: appointmentsCount || 0,
            rating: Number.parseFloat(rating),
          }
        }),
      )

      return doctorPerformance
    } catch (err) {
      console.error("Error fetching doctor performance:", err.message)
      return [
        { name: "Dr. Sarah Johnson", patients: 42, appointments: 78, rating: 4.8 },
        { name: "Dr. Michael Chen", patients: 38, appointments: 65, rating: 4.7 },
        { name: "Dr. Emily Rodriguez", patients: 65, appointments: 92, rating: 4.9 },
        { name: "Dr. James Wilson", patients: 29, appointments: 51, rating: 4.6 },
      ]
    }
  }

  // Function to fetch overall stats
  const fetchOverallStats = async () => {
    try {
      // Get total appointments
      const { count: totalAppointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })

      if (appointmentsError) throw appointmentsError

      // Get active patients (patients with appointments)
      const { data: activePatientData, error: patientsError } = await supabase.from("appointments").select("mother_id")

      if (patientsError) throw patientsError

      const activePatients = activePatientData ? new Set(activePatientData.map((p) => p.mother_id)).size : 0

      // Calculate doctor utilization (mock data)
      const doctorUtilization = Math.floor(65 + Math.random() * 20) // 65-85%

      return {
        totalAppointments: totalAppointments || 0,
        activePatients: activePatients,
        doctorUtilization: doctorUtilization,
      }
    } catch (err) {
      console.error("Error fetching overall stats:", err.message)
      return {
        totalAppointments: 324,
        activePatients: 189,
        doctorUtilization: 76,
      }
    }
  }

  const handleSignOut = async () => {
    await signOut()
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

        {/* Analytics Content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
            <p className="text-gray-600">View insights and statistics about your healthcare system</p>
          </div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>

          {/* Stats Overview */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p>{error}</p>
              <button className="mt-2 text-sm font-medium text-red-700 underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-lg text-gray-700">Loading analytics...</p>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Total Appointments</h2>
                    <Calendar className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{analyticsData.stats.totalAppointments}</div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-green-600 font-medium">↑ 12%</span>
                    <span className="text-gray-500 ml-2">from last {selectedPeriod}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Active Patients</h2>
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{analyticsData.stats.activePatients}</div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-green-600 font-medium">↑ 8%</span>
                    <span className="text-gray-500 ml-2">from last {selectedPeriod}</span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Doctor Utilization</h2>
                    <Activity className="h-6 w-6 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{analyticsData.stats.doctorUtilization}%</div>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-red-600 font-medium">↓ 3%</span>
                    <span className="text-gray-500 ml-2">from last {selectedPeriod}</span>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Appointments by Month</h2>
                    <BarChart className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="h-64 flex items-end space-x-2">
                    {analyticsData.appointmentsByMonth.map((item, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-blue-500 rounded-t-md"
                          style={{
                            height: `${(item.count / Math.max(...analyticsData.appointmentsByMonth.map((i) => i.count))) * 100}%`,
                          }}
                        ></div>
                        <div className="text-xs mt-2 text-gray-600">{item.month}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Patient Demographics</h2>
                    <PieChart className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="h-64 flex items-center justify-center">
                    {/* Simple representation of a pie chart */}
                    <div className="relative w-40 h-40 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-0 bg-blue-500"
                        style={{ clipPath: "polygon(50% 50%, 0 0, 0 50%)" }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-green-500"
                        style={{ clipPath: "polygon(50% 50%, 0 0, 50% 0)" }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-yellow-500"
                        style={{ clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)" }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-red-500"
                        style={{ clipPath: "polygon(50% 50%, 100% 50%, 100% 100%)" }}
                      ></div>
                      <div
                        className="absolute inset-0 bg-purple-500"
                        style={{ clipPath: "polygon(50% 50%, 0 50%, 0 100%, 100% 100%, 50% 100%)" }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white w-20 h-20 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-6 space-y-2">
                      {analyticsData.patientDemographics.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className={`w-3 h-3 rounded-full mr-2 ${
                              index === 0
                                ? "bg-blue-500"
                                : index === 1
                                  ? "bg-green-500"
                                  : index === 2
                                    ? "bg-yellow-500"
                                    : index === 3
                                      ? "bg-red-500"
                                      : "bg-purple-500"
                            }`}
                          ></div>
                          <span className="text-sm text-gray-600">
                            {item.range}: {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Performance Table */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Doctor Performance</h2>
                  <LineChart className="h-6 w-6 text-purple-500" />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patients
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Appointments
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.doctorPerformance.map((doctor, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {doctor.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.patients}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doctor.appointments}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="text-yellow-500 mr-1">★</span>
                              {doctor.rating}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage
