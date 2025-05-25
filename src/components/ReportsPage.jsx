"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import { fetchAppointmentStats } from "../services/reportService"
import { BarChart, Calendar, Download, AlertCircle, ChevronDown, FileText } from "lucide-react"

const ReportsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointmentStats, setAppointmentStats] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // First, get the doctor ID
  useEffect(() => {
    const fetchDoctorId = async () => {
      if (!session?.user?.id) return

      try {
        const result = await getDoctorIdFromUserId(session.user.id)
        if (result.success) {
          setDoctorId(result.doctorId)
        } else {
          setError("Failed to retrieve doctor information")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching doctor ID:", err)
        setError("An unexpected error occurred")
        setLoading(false)
      }
    }

    fetchDoctorId()
  }, [session])

  // Then, load statistics once we have the doctor ID
  useEffect(() => {
    const loadStats = async () => {
      if (!doctorId) return

      try {
        setLoading(true)

        // Fetch appointment statistics
        const appointmentResult = await fetchAppointmentStats(doctorId, selectedPeriod)
        if (appointmentResult.success) {
          setAppointmentStats(appointmentResult.data)
        } else {
          setError("Failed to load appointment statistics")
        }
      } catch (err) {
        console.error("Error loading statistics:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [doctorId, selectedPeriod])

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const generateCSV = () => {
    if (!appointmentStats) return

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"

    // Headers
    csvContent +=
      "Report Period,Start Date,End Date,Total Appointments,Completed,Upcoming,Cancelled,Pending,Paid,Unpaid\n"

    // Data
    csvContent += `${selectedPeriod},${formatDate(appointmentStats.startDate)},${formatDate(appointmentStats.endDate)},`
    csvContent += `${appointmentStats.total},${appointmentStats.completed},${appointmentStats.upcoming},`
    csvContent += `${appointmentStats.cancelled},${appointmentStats.pending},${appointmentStats.paid},${appointmentStats.unpaid}\n\n`

    // Distribution data
    csvContent += "Date,Appointments\n"
    Object.entries(appointmentStats.distribution).forEach(([date, count]) => {
      csvContent += `${date},${count}\n\`  count]) => {
      csvContent += \`${date},${count}\n`
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `appointment_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Helper function to get distribution data for chart
  const getDistributionData = () => {
    if (!appointmentStats || !appointmentStats.distribution) return []

    return Object.entries(appointmentStats.distribution)
      .map(([date, count]) => ({
        date: formatDate(date),
        count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Reports</h1>
        <p className="text-gray-600">View and download reports about your practice</p>
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
        <div className="flex items-center space-x-2">
          <span className="text-gray-700">Period:</span>
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-gray-700 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={generateCSV}
          disabled={!appointmentStats}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          <Download className="h-5 w-5 mr-2" />
          Export Report
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Appointment Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-500" />
              Appointment Summary
            </h2>
            {appointmentStats && (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Period</span>
                  <span className="font-medium">
                    {formatDate(appointmentStats.startDate)} - {formatDate(appointmentStats.endDate)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Appointments</span>
                  <span className="font-medium">{appointmentStats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">{appointmentStats.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Upcoming</span>
                  <span className="font-medium text-blue-600">{appointmentStats.upcoming}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cancelled</span>
                  <span className="font-medium text-red-600">{appointmentStats.cancelled}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pending</span>
                  <span className="font-medium text-yellow-600">{appointmentStats.pending}</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid</span>
                    <span className="font-medium text-green-600">{appointmentStats.paid}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Unpaid</span>
                    <span className="font-medium text-yellow-600">{appointmentStats.unpaid}</span>
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* Appointment Distribution */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-primary-500" />
              Appointment Distribution
            </h2>
            {appointmentStats && appointmentStats.distribution && (
              <div className="h-64">
                {Object.keys(appointmentStats.distribution).length > 0 ? (
                  <div className="h-full">
                    {/* This would be a chart component in a real implementation */}
                    <div className="flex h-full items-end space-x-2">
                      {getDistributionData().map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className="bg-primary-500 w-8 rounded-t-md"
                            style={{
                              height: `${(item.count / Math.max(...getDistributionData().map((d) => d.count))) * 200}px`,
                              minHeight: "20px",
                            }}
                          ></div>
                          <div className="text-xs mt-1 transform -rotate-45 origin-top-left">{item.date}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <BarChart className="h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-gray-500">No appointment data available for this period</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Available Reports */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-500" />
              Available Reports
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Appointment Summary</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{selectedPeriod}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        Summary of all appointments including status and payment information
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={generateCSV}
                        disabled={!appointmentStats}
                        className="text-primary-600 hover:text-primary-900 disabled:opacity-50"
                      >
                        Download CSV
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Financial Report</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{selectedPeriod}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">Summary of payments received and outstanding balances</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-primary-600 hover:text-primary-900">Download CSV</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
