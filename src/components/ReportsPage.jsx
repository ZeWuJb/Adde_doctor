"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../context/AuthContext"
import { getDoctorIdFromUserId } from "../services/appointmentService"
import { fetchAppointmentStats } from "../services/reportService"
import {
  BarChart3,
  Calendar,
  Download,
  AlertCircle,
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  Activity,
  RefreshCw,
  Filter,
  FileDown,
} from "lucide-react"

const ReportsPage = () => {
  const { session } = UserAuth()
  const [doctorId, setDoctorId] = useState(null)
  const [appointmentStats, setAppointmentStats] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch doctor ID
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

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!doctorId) return

      try {
        setLoading(true)
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

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false)
      // Trigger data reload
      if (doctorId) {
        const loadStats = async () => {
          try {
            const appointmentResult = await fetchAppointmentStats(doctorId, selectedPeriod)
            if (appointmentResult.success) {
              setAppointmentStats(appointmentResult.data)
            }
          } catch (err) {
            console.error("Error refreshing data:", err)
          }
        }
        loadStats()
      }
    }, 1000)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }


  const calculatePercentage = (value, total) => {
    if (!total) return 0
    return Math.round((value / total) * 100)
  }

  // Export functions
  const exportToPDF = async () => {
    if (!appointmentStats) return

    try {
      // Create PDF content
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246) // Blue color
      doc.text("CareSyncHealth - Medical Reports", 20, 30)

      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Report Period: ${selectedPeriod.toUpperCase()}`, 20, 45)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55)
      doc.text(`Doctor: ${session?.user?.email || "N/A"}`, 20, 65)

      // Summary Section
      doc.setFontSize(16)
      doc.setTextColor(59, 130, 246)
      doc.text("Appointment Summary", 20, 85)

      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      let yPos = 100

      const summaryData = [
        ["Total Appointments", appointmentStats.total],
        [
          "Completed",
          `${appointmentStats.completed} (${calculatePercentage(appointmentStats.completed, appointmentStats.total)}%)`,
        ],
        [
          "Upcoming",
          `${appointmentStats.upcoming} (${calculatePercentage(appointmentStats.upcoming, appointmentStats.total)}%)`,
        ],
        [
          "Cancelled",
          `${appointmentStats.cancelled} (${calculatePercentage(appointmentStats.cancelled, appointmentStats.total)}%)`,
        ],
        [
          "Pending",
          `${appointmentStats.pending} (${calculatePercentage(appointmentStats.pending, appointmentStats.total)}%)`,
        ],
        ["", ""],
        ["Payment Summary", ""],
        [
          "Paid Appointments",
          `${appointmentStats.paid} (${calculatePercentage(appointmentStats.paid, appointmentStats.total)}%)`,
        ],
        [
          "Unpaid Appointments",
          `${appointmentStats.unpaid} (${calculatePercentage(appointmentStats.unpaid, appointmentStats.total)}%)`,
        ],
      ]

      summaryData.forEach(([label, value]) => {
        if (label === "Payment Summary") {
          doc.setFontSize(14)
          doc.setTextColor(59, 130, 246)
          doc.text(label, 20, yPos)
          yPos += 10
        } else if (label) {
          doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          doc.text(`${label}:`, 25, yPos)
          doc.text(String(value), 120, yPos)
          yPos += 8
        } else {
          yPos += 5
        }
      })

      // Footer
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text("This report is confidential and intended for medical practice use only.", 20, 280)
      doc.text("CareSyncHealth © 2024", 20, 290)

      // Save PDF
      doc.save(`medical_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF report")
    }
  }

  const exportToCSV = () => {
    if (!appointmentStats) return

    let csvContent = "data:text/csv;charset=utf-8,"

    // Headers
    csvContent += "CareSyncHealth Medical Report\n"
    csvContent += `Report Period,${selectedPeriod}\n`
    csvContent += `Generated Date,${new Date().toLocaleDateString()}\n`
    csvContent += `Doctor Email,${session?.user?.email || "N/A"}\n\n`

    // Summary data
    csvContent += "Metric,Count,Percentage\n"
    csvContent += `Total Appointments,${appointmentStats.total},100%\n`
    csvContent += `Completed,${appointmentStats.completed},${calculatePercentage(appointmentStats.completed, appointmentStats.total)}%\n`
    csvContent += `Upcoming,${appointmentStats.upcoming},${calculatePercentage(appointmentStats.upcoming, appointmentStats.total)}%\n`
    csvContent += `Cancelled,${appointmentStats.cancelled},${calculatePercentage(appointmentStats.cancelled, appointmentStats.total)}%\n`
    csvContent += `Pending,${appointmentStats.pending},${calculatePercentage(appointmentStats.pending, appointmentStats.total)}%\n\n`

    csvContent += "Payment Status,Count,Percentage\n"
    csvContent += `Paid,${appointmentStats.paid},${calculatePercentage(appointmentStats.paid, appointmentStats.total)}%\n`
    csvContent += `Unpaid,${appointmentStats.unpaid},${calculatePercentage(appointmentStats.unpaid, appointmentStats.total)}%\n\n`

    // Distribution data
    if (appointmentStats.distribution) {
      csvContent += "Date,Appointments\n"
      Object.entries(appointmentStats.distribution).forEach(([date, count]) => {
        csvContent += `${date},${count}\n`
      })
    }

    // Download
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `medical_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    if (!appointmentStats) return

    const reportData = {
      metadata: {
        reportType: "Medical Practice Report",
        period: selectedPeriod,
        generatedDate: new Date().toISOString(),
        doctorEmail: session?.user?.email || "N/A",
        doctorId: doctorId,
      },
      summary: {
        totalAppointments: appointmentStats.total,
        completed: {
          count: appointmentStats.completed,
          percentage: calculatePercentage(appointmentStats.completed, appointmentStats.total),
        },
        upcoming: {
          count: appointmentStats.upcoming,
          percentage: calculatePercentage(appointmentStats.upcoming, appointmentStats.total),
        },
        cancelled: {
          count: appointmentStats.cancelled,
          percentage: calculatePercentage(appointmentStats.cancelled, appointmentStats.total),
        },
        pending: {
          count: appointmentStats.pending,
          percentage: calculatePercentage(appointmentStats.pending, appointmentStats.total),
        },
      },
      payments: {
        paid: {
          count: appointmentStats.paid,
          percentage: calculatePercentage(appointmentStats.paid, appointmentStats.total),
        },
        unpaid: {
          count: appointmentStats.unpaid,
          percentage: calculatePercentage(appointmentStats.unpaid, appointmentStats.total),
        },
      },
      distribution: appointmentStats.distribution || {},
      dateRange: {
        startDate: appointmentStats.startDate,
        endDate: appointmentStats.endDate,
      },
    }

    const dataStr = JSON.stringify(reportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `medical_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getDistributionData = () => {
    if (!appointmentStats || !appointmentStats.distribution) return []
    return Object.entries(appointmentStats.distribution)
      .map(([date, count]) => ({ date: formatDate(date), count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: "text-green-600 bg-green-50",
      upcoming: "text-blue-600 bg-blue-50",
      cancelled: "text-red-600 bg-red-50",
      pending: "text-yellow-600 bg-yellow-50",
      paid: "text-green-600 bg-green-50",
      unpaid: "text-orange-600 bg-orange-50",
    }
    return colors[status] || "text-gray-600 bg-gray-50"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your medical reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent mb-2">
                  Medical Reports Dashboard
                </h1>
                <p className="text-gray-600 text-lg">Comprehensive analytics for your medical practice</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <select
                    value={selectedPeriod}
                    onChange={(e) => handlePeriodChange(e.target.value)}
                    className="bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {appointmentStats && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{appointmentStats.total}</h3>
                <p className="text-gray-600">Total Appointments</p>
                <p className="text-xs text-gray-500 mt-2">This {selectedPeriod}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {calculatePercentage(appointmentStats.completed, appointmentStats.total)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{appointmentStats.completed}</h3>
                <p className="text-gray-600">Completed</p>
                <p className="text-xs text-gray-500 mt-2">Success rate</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    {calculatePercentage(appointmentStats.paid, appointmentStats.total)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{appointmentStats.paid}</h3>
                <p className="text-gray-600">Paid Appointments</p>
                <p className="text-xs text-gray-500 mt-2">Revenue secured</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {calculatePercentage(appointmentStats.upcoming, appointmentStats.total)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{appointmentStats.upcoming}</h3>
                <p className="text-gray-600">Upcoming</p>
                <p className="text-xs text-gray-500 mt-2">Scheduled ahead</p>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <FileDown className="h-6 w-6 text-blue-600" />
                    Export Reports
                  </h2>
                  <p className="text-gray-600">Download your medical practice reports in various formats</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={exportToPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <FileText className="h-5 w-5" />
                    Export PDF
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Download className="h-5 w-5" />
                    Export CSV
                  </button>

                  <button
                    onClick={exportToJSON}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Activity className="h-5 w-5" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Appointment Status Breakdown */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  Appointment Status
                </h3>

                <div className="space-y-4">
                  {[
                    { label: "Completed", value: appointmentStats.completed, status: "completed" },
                    { label: "Upcoming", value: appointmentStats.upcoming, status: "upcoming" },
                    { label: "Cancelled", value: appointmentStats.cancelled, status: "cancelled" },
                    { label: "Pending", value: appointmentStats.pending, status: "pending" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${item.status === "completed" ? "bg-green-500" : item.status === "upcoming" ? "bg-blue-500" : item.status === "cancelled" ? "bg-red-500" : "bg-yellow-500"}`}
                        ></div>
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">{item.value}</span>
                        <span className={`ml-2 text-sm px-2 py-1 rounded-full ${getStatusColor(item.status)}`}>
                          {calculatePercentage(item.value, appointmentStats.total)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  Payment Analytics
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-gray-900">Paid Appointments</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{appointmentStats.paid}</span>
                      <span className="ml-2 text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        {calculatePercentage(appointmentStats.paid, appointmentStats.total)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="font-medium text-gray-900">Unpaid Appointments</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{appointmentStats.unpaid}</span>
                      <span className="ml-2 text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                        {calculatePercentage(appointmentStats.unpaid, appointmentStats.total)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">Collection Rate</span>
                    <span className="text-lg font-bold text-blue-900">
                      {calculatePercentage(appointmentStats.paid, appointmentStats.paid + appointmentStats.unpaid)}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${calculatePercentage(appointmentStats.paid, appointmentStats.paid + appointmentStats.unpaid)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Distribution Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                Appointment Distribution Over Time
              </h3>

              {appointmentStats.distribution && Object.keys(appointmentStats.distribution).length > 0 ? (
                <div className="h-64 flex items-end justify-center space-x-2 p-4">
                  {getDistributionData().map((item, index) => (
                    <div key={index} className="flex flex-col items-center group">
                      <div className="relative">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-purple-500 w-8 rounded-t-lg transition-all duration-300 group-hover:from-blue-600 group-hover:to-purple-600 group-hover:shadow-lg"
                          style={{
                            height: `${(item.count / Math.max(...getDistributionData().map((d) => d.count))) * 200}px`,
                            minHeight: "20px",
                          }}
                        ></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {item.count}
                        </div>
                      </div>
                      <div className="text-xs mt-2 text-gray-600 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {item.date}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <BarChart3 className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">No appointment data available</p>
                  <p className="text-sm">Data will appear here once you have appointments in this period</p>
                </div>
              )}
            </div>

            {/* Report Summary Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  Available Reports
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Appointment Summary</div>
                            <div className="text-sm text-gray-500">Complete appointment analytics</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedPeriod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Comprehensive appointment data including status, payments, and trends
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={exportToPDF}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          PDF
                        </button>
                        <button
                          onClick={exportToCSV}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                        >
                          CSV
                        </button>
                        <button
                          onClick={exportToJSON}
                          className="text-purple-600 hover:text-purple-900 transition-colors duration-200"
                        >
                          JSON
                        </button>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-green-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">Financial Report</div>
                            <div className="text-sm text-gray-500">Payment and revenue analysis</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {selectedPeriod}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Detailed financial breakdown with payment status and collection rates
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={exportToPDF}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          PDF
                        </button>
                        <button
                          onClick={exportToCSV}
                          className="text-green-600 hover:text-green-900 transition-colors duration-200"
                        >
                          CSV
                        </button>
                        <button
                          onClick={exportToJSON}
                          className="text-purple-600 hover:text-purple-900 transition-colors duration-200"
                        >
                          JSON
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportsPage
