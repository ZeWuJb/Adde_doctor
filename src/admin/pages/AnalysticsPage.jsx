"use client"

import { useState } from "react"
import { UserAuth } from "../../context/AuthContext"
import { BarChart, PieChart, LineChart, Calendar, Users, Activity, Download } from "lucide-react"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { useLocation } from "react-router-dom"

const AnalyticsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
  }

  // Mock data for charts
  const appointmentsByMonth = [
    { month: "Jan", count: 45 },
    { month: "Feb", count: 52 },
    { month: "Mar", count: 49 },
    { month: "Apr", count: 62 },
    { month: "May", count: 55 },
    { month: "Jun", count: 60 },
  ]

  const patientDemographics = [
    { age: "0-18", count: 28 },
    { age: "19-35", count: 45 },
    { age: "36-50", count: 56 },
    { age: "51-65", count: 38 },
    { age: "65+", count: 22 },
  ]

  const doctorPerformance = [
    { name: "Dr. Sarah Johnson", patients: 42, appointments: 78, rating: 4.8 },
    { name: "Dr. Michael Chen", patients: 38, appointments: 65, rating: 4.7 },
    { name: "Dr. Emily Rodriguez", patients: 65, appointments: 92, rating: 4.9 },
    { name: "Dr. James Wilson", patients: 29, appointments: 51, rating: 4.6 },
  ]

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Total Appointments</h2>
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900">324</div>
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
              <div className="text-3xl font-bold text-gray-900">189</div>
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
              <div className="text-3xl font-bold text-gray-900">76%</div>
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
                {appointmentsByMonth.map((item, index) => (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-blue-500 rounded-t-md"
                      style={{ height: `${(item.count / 70) * 100}%` }}
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
                  {patientDemographics.map((item, index) => (
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
                        {item.age}: {item.count}
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
                  {doctorPerformance.map((doctor, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doctor.name}</td>
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
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage
