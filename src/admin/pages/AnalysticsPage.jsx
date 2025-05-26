"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import {
  TrendingUp,
  Users,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Heart,
  UserCheck,
} from "lucide-react"
import { supabase } from "../../supabaseClient"
import PropTypes from "prop-types"

const AnalyticsPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    cancelledAppointments: 0,
    monthlyGrowth: 0,
    userGrowth: 0,
    appointmentGrowth: 0,
  })
  const location = useLocation()

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)

        // Fetch users count
        const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

        // Fetch doctors count
        const { count: doctorsCount } = await supabase.from("doctors").select("*", { count: "exact", head: true })

        // Fetch appointments data
        const { data: appointments, count: appointmentsCount } = await supabase
          .from("appointments")
          .select("status", { count: "exact" })

        // Calculate appointment statistics
        const completed = appointments?.filter((apt) => apt.status === "completed").length || 0
        const pending = appointments?.filter((apt) => apt.status === "pending").length || 0
        const cancelled = appointments?.filter((apt) => apt.status === "cancelled").length || 0

        // Calculate growth rates (mock data for demonstration)
        const userGrowth = Math.floor(Math.random() * 20) + 5 // 5-25%
        const appointmentGrowth = Math.floor(Math.random() * 15) + 3 // 3-18%
        const monthlyGrowth = Math.floor(Math.random() * 12) + 8 // 8-20%

        setAnalyticsData({
          totalUsers: usersCount || 0,
          totalDoctors: doctorsCount || 0,
          totalAppointments: appointmentsCount || 0,
          completedAppointments: completed,
          pendingAppointments: pending,
          cancelledAppointments: cancelled,
          monthlyGrowth,
          userGrowth,
          appointmentGrowth,
        })
      } catch (error) {
        console.error("Error fetching analytics data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const StatCard = ({ title, value, icon: Icon, growth, color = "blue" }) => {
    const isPositive = growth >= 0
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      pink: "from-pink-500 to-pink-600",
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? "..." : value.toLocaleString()}</p>
            {growth !== undefined && (
              <div className="flex items-center mt-2">
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(growth)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    )
  }
  const ChartCard = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="flex items-center">
          <Icon className="h-5 w-5 text-pink-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )

  ChartCard.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    children: PropTypes.node,
  }
  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    icon: PropTypes.elementType.isRequired,
    growth: PropTypes.number,
    color: PropTypes.string,
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
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-6 text-white">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-pink-100">Monitor your platform`s performance and user engagement</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={analyticsData.totalUsers}
                icon={Users}
                growth={analyticsData.userGrowth}
                color="blue"
              />
              <StatCard
                title="Active Doctors"
                value={analyticsData.totalDoctors}
                icon={UserCheck}
                growth={analyticsData.monthlyGrowth}
                color="green"
              />
              <StatCard
                title="Total Appointments"
                value={analyticsData.totalAppointments}
                icon={Calendar}
                growth={analyticsData.appointmentGrowth}
                color="purple"
              />
              <StatCard
                title="Completed Sessions"
                value={analyticsData.completedAppointments}
                icon={Heart}
                growth={analyticsData.monthlyGrowth}
                color="pink"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Status Distribution */}
              <ChartCard title="Appointment Status" icon={PieChart}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Completed</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.completedAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Pending</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.pendingAppointments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Cancelled</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{analyticsData.cancelledAppointments}</span>
                  </div>
                </div>
              </ChartCard>

              {/* User Growth Trend */}
              <ChartCard title="User Growth Trend" icon={TrendingUp}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="text-sm font-medium text-green-600">+{analyticsData.userGrowth}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Month</span>
                    <span className="text-sm font-medium text-gray-900">
                      +{Math.max(0, analyticsData.userGrowth - 5)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">3 Months Ago</span>
                    <span className="text-sm font-medium text-gray-900">
                      +{Math.max(0, analyticsData.userGrowth - 10)}%
                    </span>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Activity Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Recent Activity" icon={Activity}>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">New user registered</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Appointment scheduled</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">Session completed</span>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="Performance Metrics" icon={BarChart3}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Response Time</span>
                    <span className="text-sm font-medium text-green-600">98ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="text-sm font-medium text-green-600">97.8%</span>
                  </div>
                </div>
              </ChartCard>

              <ChartCard title="System Health" icon={LineChart}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-sm font-medium text-blue-600">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-sm font-medium text-blue-600">62%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Storage</span>
                    <span className="text-sm font-medium text-blue-600">78%</span>
                  </div>
                </div>
              </ChartCard>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
AnalyticsPage.propTypes = {
  session: PropTypes.object,
  userData: PropTypes.object,
  signOut: PropTypes.func.isRequired,
}

export default AnalyticsPage

