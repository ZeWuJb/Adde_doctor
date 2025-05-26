"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { Users, Calendar, Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Heart, UserCheck, FileText, FileSpreadsheet, FileJson, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from "../../supabaseClient"
import PropTypes from "prop-types"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

const AnalyticsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [selectedExportFormat, setSelectedExportFormat] = useState("pdf")
  const [analyticsData, setAnalyticsData] = useState({
    totalAdmins: 0,
    totalDoctors: 0,
    totalMothers: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    totalPosts: 0,
    totalReports: 0,
    monthlyGrowth: 0,
    userGrowth: 0,
    appointmentGrowth: 0,
    systemMetrics: {
      uptime: "99.9%",
      responseTime: "98ms",
      successRate: "97.8%",
    },
    recentActivity: [],
  })
  const location = useLocation()

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Calculate date range based on selected period
      const now = new Date()
      const startDate = new Date()

      switch (selectedPeriod) {
        case "week":
          startDate.setDate(now.getDate() - 7)
          break
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          startDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          startDate.setMonth(now.getMonth() - 1)
      }

      // Fetch all data in parallel - using correct table names
      const [
        { count: adminsCount },
        { count: doctorsCount },
        { count: mothersCount },
        { count: appointmentsCount },
        { data: appointments },
        { count: postsCount },
        { count: reportsCount },
      ] = await Promise.all([
        supabase.from("admins").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("mothers").select("*", { count: "exact", head: true }),
        supabase
          .from("appointments")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
        supabase.from("appointments").select("status, created_at").gte("created_at", startDate.toISOString()),
        supabase.from("posts").select("*", { count: "exact", head: true }).gte("created_at", startDate.toISOString()),
        supabase
          .from("main_report")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDate.toISOString()),
      ])

      // Calculate appointment statistics
      const completed = appointments?.filter((apt) => apt.status === "completed").length || 0
      const pending = appointments?.filter((apt) => apt.status === "pending").length || 0
      const cancelled = appointments?.filter((apt) => apt.status === "cancelled").length || 0

      // Calculate growth rates (mock data for demonstration)
      const userGrowth = Math.floor(Math.random() * 20) + 5
      const appointmentGrowth = Math.floor(Math.random() * 15) + 3
      const monthlyGrowth = Math.floor(Math.random() * 12) + 8

      // Mock recent activity
      const recentActivity = [
        { action: "New mother registered", time: "2 minutes ago", type: "user" },
        { action: "Appointment scheduled", time: "5 minutes ago", type: "appointment" },
        { action: "Doctor profile updated", time: "10 minutes ago", type: "doctor" },
        { action: "Report submitted", time: "15 minutes ago", type: "report" },
        { action: "Post published", time: "20 minutes ago", type: "post" },
      ]

      setAnalyticsData({
        totalAdmins: adminsCount || 0,
        totalDoctors: doctorsCount || 0,
        totalMothers: mothersCount || 0,
        totalAppointments: appointmentsCount || 0,
        completedAppointments: completed,
        pendingAppointments: pending,
        cancelledAppointments: cancelled,
        totalPosts: postsCount || 0,
        totalReports: reportsCount || 0,
        monthlyGrowth,
        userGrowth,
        appointmentGrowth,
        systemMetrics: {
          uptime: "99.9%",
          responseTime: "98ms",
          successRate: "97.8%",
        },
        recentActivity,
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(79, 70, 229) // Primary color
    doc.text("CareSyncHealth - Analytics Report", 20, 20)

    doc.setFontSize(12)
    doc.setTextColor(107, 114, 128) // Gray color
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
    doc.text(`Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`, 20, 37)

    // Executive Summary
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text("Executive Summary", 20, 55)

    const summaryData = [
      ["Metric", "Value", "Growth"],
      ["Total Admins", analyticsData.totalAdmins.toString(), "N/A"],
      ["Active Doctors", analyticsData.totalDoctors.toString(), `+${analyticsData.monthlyGrowth}%`],
      ["Registered Mothers", analyticsData.totalMothers.toString(), `+${analyticsData.userGrowth}%`],
      ["Total Appointments", analyticsData.totalAppointments.toString(), `+${analyticsData.appointmentGrowth}%`],
      ["Completed Sessions", analyticsData.completedAppointments.toString(), "N/A"],
      ["Posts Created", analyticsData.totalPosts.toString(), "N/A"],
      ["Reports Filed", analyticsData.totalReports.toString(), "N/A"],
    ]

    autoTable(doc, {
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: 65,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 20, right: 20 },
    })

    // Appointment Breakdown
    const appointmentY = doc.lastAutoTable.finalY + 20
    doc.setFontSize(16)
    doc.text("Appointment Status Breakdown", 20, appointmentY)

    const appointmentData = [
      ["Status", "Count", "Percentage"],
      [
        "Completed",
        analyticsData.completedAppointments.toString(),
        `${((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      ],
      [
        "Pending",
        analyticsData.pendingAppointments.toString(),
        `${((analyticsData.pendingAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      ],
      [
        "Cancelled",
        analyticsData.cancelledAppointments.toString(),
        `${((analyticsData.cancelledAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      ],
    ]

    autoTable(doc, {
      head: [appointmentData[0]],
      body: appointmentData.slice(1),
      startY: appointmentY + 10,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 20, right: 20 },
    })

    // System Performance
    const performanceY = doc.lastAutoTable.finalY + 20
    doc.setFontSize(16)
    doc.text("System Performance Metrics", 20, performanceY)

    const performanceData = [
      ["Metric", "Value", "Status"],
      ["System Uptime", analyticsData.systemMetrics.uptime, "Excellent"],
      ["Response Time", analyticsData.systemMetrics.responseTime, "Good"],
      ["Success Rate", analyticsData.systemMetrics.successRate, "Excellent"],
    ]

    autoTable(doc, {
      head: [performanceData[0]],
      body: performanceData.slice(1),
      startY: performanceY + 10,
      theme: "grid",
      headStyles: { fillColor: [168, 85, 247] },
      margin: { left: 20, right: 20 },
    })

    // Footer
    const footerY = doc.internal.pageSize.height - 20
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text("CareSyncHealth Analytics - Confidential Report", 20, footerY)
    doc.text(`Page 1`, doc.internal.pageSize.width - 30, footerY)

    doc.save(`CareSyncHealth_Analytics_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.pdf`)
  }

  const exportToCSV = () => {
    const csvData = [
      ["CareSyncHealth Analytics Report"],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [`Period: ${selectedPeriod}`],
      [""],
      ["Metric", "Value", "Growth"],
      ["Total Admins", analyticsData.totalAdmins, "N/A"],
      ["Active Doctors", analyticsData.totalDoctors, `${analyticsData.monthlyGrowth}%`],
      ["Registered Mothers", analyticsData.totalMothers, `${analyticsData.userGrowth}%`],
      ["Total Appointments", analyticsData.totalAppointments, `${analyticsData.appointmentGrowth}%`],
      ["Completed Sessions", analyticsData.completedAppointments, "N/A"],
      ["Posts Created", analyticsData.totalPosts, "N/A"],
      ["Reports Filed", analyticsData.totalReports, "N/A"],
      [""],
      ["Appointment Status", "Count", "Percentage"],
      [
        "Completed",
        analyticsData.completedAppointments,
        `${((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      ],
      [
        "Pending",
        analyticsData.pendingAppointments,
        `${((analyticsData.pendingAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      ],
      [
        "Cancelled",
        analyticsData.cancelledAppointments,
        `${((analyticsData.cancelledAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      ],
      [""],
      ["System Metrics", "Value"],
      ["Uptime", analyticsData.systemMetrics.uptime],
      ["Response Time", analyticsData.systemMetrics.responseTime],
      ["Success Rate", analyticsData.systemMetrics.successRate],
    ]

    const csvContent = csvData.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `CareSyncHealth_Analytics_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.csv`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const exportToJSON = () => {
    const jsonData = {
      reportMetadata: {
        title: "CareSyncHealth Analytics Report",
        generatedDate: new Date().toISOString(),
        period: selectedPeriod,
        version: "1.0",
      },
      summary: {
        totalAdmins: analyticsData.totalAdmins,
        totalDoctors: analyticsData.totalDoctors,
        totalMothers: analyticsData.totalMothers,
        totalAppointments: analyticsData.totalAppointments,
        totalPosts: analyticsData.totalPosts,
        totalReports: analyticsData.totalReports,
      },
      growth: {
        userGrowth: `${analyticsData.userGrowth}%`,
        appointmentGrowth: `${analyticsData.appointmentGrowth}%`,
        monthlyGrowth: `${analyticsData.monthlyGrowth}%`,
      },
      appointments: {
        completed: analyticsData.completedAppointments,
        pending: analyticsData.pendingAppointments,
        cancelled: analyticsData.cancelledAppointments,
        completionRate: `${((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}%`,
      },
      systemMetrics: analyticsData.systemMetrics,
      recentActivity: analyticsData.recentActivity,
    }

    const jsonString = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute(
        "download",
        `CareSyncHealth_Analytics_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.json`,
      )
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleExport = () => {
    setExportLoading(true)

    setTimeout(() => {
      switch (selectedExportFormat) {
        case "pdf":
          exportToPDF()
          break
        case "csv":
          exportToCSV()
          break
        case "json":
          exportToJSON()
          break
        default:
          exportToPDF()
      }
      setExportLoading(false)
    }, 1000) // Simulate processing time
  }

  const StatCard = ({ title, value, icon: Icon, growth, color = "blue", subtitle }) => {
    const isPositive = growth >= 0
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      pink: "from-pink-500 to-pink-600",
      red: "from-red-500 to-red-600",
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{loading ? "..." : value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-gray-500 mb-2">{subtitle}</p>}
            {growth !== undefined && (
              <div className="flex items-center">
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(growth)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last {selectedPeriod}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>
    )
  }

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    growth: PropTypes.number,
    color: PropTypes.string,
    subtitle: PropTypes.string,
  }

  const ChartCard = ({ title, icon: Icon, children, className = "" }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
  
  ChartCard.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    children: PropTypes.node,
    className: PropTypes.string,
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
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
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
            <div className="bg-gradient-to-r from-pink-600 to-purple-700 rounded-xl p-6 text-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                  <p className="text-blue-100">Comprehensive insights into your healthcare platform</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                  <button
                    onClick={fetchAnalyticsData}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Period:</span>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="week">Last Week</option>
                      <option value="month">Last Month</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Export as:</span>
                    <select
                      value={selectedExportFormat}
                      onChange={(e) => setSelectedExportFormat(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pdf">PDF Report</option>
                      <option value="csv">CSV Data</option>
                      <option value="json">JSON Format</option>
                    </select>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exportLoading || loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {exportLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <>
                        {selectedExportFormat === "pdf" && <FileText className="h-4 w-4 mr-2" />}
                        {selectedExportFormat === "csv" && <FileSpreadsheet className="h-4 w-4 mr-2" />}
                        {selectedExportFormat === "json" && <FileJson className="h-4 w-4 mr-2" />}
                      </>
                    )}
                    {exportLoading ? "Generating..." : "Export"}
                  </button>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="System Admins"
                value={analyticsData.totalAdmins}
                icon={UserCheck}
                color="blue"
                subtitle="Platform administrators"
              />
              <StatCard
                title="Active Doctors"
                value={analyticsData.totalDoctors}
                icon={Users}
                growth={analyticsData.monthlyGrowth}
                color="green"
                subtitle="Healthcare providers"
              />
              <StatCard
                title="Registered Mothers"
                value={analyticsData.totalMothers}
                icon={Heart}
                growth={analyticsData.userGrowth}
                color="pink"
                subtitle="Expecting mothers"
              />
              <StatCard
                title="Appointments"
                value={analyticsData.totalAppointments}
                icon={Calendar}
                growth={analyticsData.appointmentGrowth}
                color="purple"
                subtitle={`In ${selectedPeriod}`}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Posts Created"
                value={analyticsData.totalPosts}
                icon={FileText}
                color="orange"
                subtitle={`In ${selectedPeriod}`}
              />
              <StatCard
                title="Reports Filed"
                value={analyticsData.totalReports}
                icon={AlertCircle}
                color="red"
                subtitle={`In ${selectedPeriod}`}
              />
              <StatCard
                title="Completed Sessions"
                value={analyticsData.completedAppointments}
                icon={Activity}
                color="green"
                subtitle="Successful appointments"
              />
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Status Distribution */}
              <ChartCard title="Appointment Status" icon={PieChart}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">Completed</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{analyticsData.completedAppointments}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (
                        {((analyticsData.completedAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(
                          1,
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">Pending</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{analyticsData.pendingAppointments}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({((analyticsData.pendingAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-700">Cancelled</span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-gray-900">{analyticsData.cancelledAppointments}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        (
                        {((analyticsData.cancelledAppointments / analyticsData.totalAppointments) * 100 || 0).toFixed(
                          1,
                        )}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </ChartCard>

              {/* System Performance */}
              <ChartCard title="System Performance" icon={BarChart3}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">System Uptime</span>
                    <span className="text-lg font-bold text-green-600">{analyticsData.systemMetrics.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Response Time</span>
                    <span className="text-lg font-bold text-blue-600">{analyticsData.systemMetrics.responseTime}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Success Rate</span>
                    <span className="text-lg font-bold text-green-600">{analyticsData.systemMetrics.successRate}</span>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Recent Activity */}
            <ChartCard title="Recent Activity" icon={Activity} className="lg:col-span-1">
              <div className="space-y-3">
                {analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${
                          activity.type === "user"
                            ? "bg-blue-500"
                            : activity.type === "appointment"
                              ? "bg-green-500"
                              : activity.type === "doctor"
                                ? "bg-purple-500"
                                : activity.type === "report"
                                  ? "bg-red-500"
                                  : "bg-gray-500"
                        }`}
                      ></div>
                      <span className="text-sm text-gray-700">{activity.action}</span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AnalyticsPage
