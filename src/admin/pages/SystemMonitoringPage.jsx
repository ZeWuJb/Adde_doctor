"use client"

import { useState } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import {
  Server,
  Database,
  HardDrive,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  User,
} from "lucide-react"
import { useAdmin } from "../../hooks/useAdmin"

const SystemMonitoringPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { loading, error, systemStatus, refreshData } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recentLogs, setRecentLogs] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      level: "info",
      service: "auth",
      message: "User login successful",
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      level: "warning",
      service: "database",
      message: "High database query latency detected",
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      level: "error",
      service: "api",
      message: "API endpoint /api/appointments/create returned 500 error",
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      level: "info",
      service: "storage",
      message: "Backup completed successfully",
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      level: "info",
      service: "auth",
      message: "New user registered",
    },
  ])
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

  const handleSignOut = async () => {
    await signOut()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()

      const newLog = {
        id: recentLogs.length + 1,
        timestamp: new Date().toISOString(),
        level: "info",
        service: "system",
        message: "System status refreshed manually",
      }

      setRecentLogs([newLog, ...recentLogs.slice(0, 9)])
    } catch (err) {
      console.error("Error refreshing system status:", err.message)
    } finally {
      setRefreshing(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString() + ", " + date.toLocaleDateString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getLogLevelColor = (level) => {
    switch (level) {
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getServiceIcon = (service) => {
    switch (service) {
      case "database":
        return <Database className="h-4 w-4" />
      case "api":
        return <Activity className="h-4 w-4" />
      case "storage":
        return <HardDrive className="h-4 w-4" />
      case "auth":
        return <User className="h-4 w-4" />
      case "system":
        return <Server className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
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
                <p className="ml-3 text-lg text-gray-700">Loading system status...</p>
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
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">System Monitoring</h1>
                  <p className="text-pink-100">Monitor system performance and troubleshoot issues</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    refreshing
                      ? "bg-white bg-opacity-20 text-pink-100 cursor-not-allowed"
                      : "bg-white bg-opacity-20 text-white hover:bg-opacity-30"
                  }`}
                >
                  <RefreshCw className={`mr-2 h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Database Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Database className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-800 ml-3">Database</h2>
                  </div>
                  {getStatusIcon(systemStatus.database.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium capitalize ${getStatusColor(systemStatus.database.status)}`}>
                        {systemStatus.database.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Latency</span>
                      <span className="font-medium">{systemStatus.database.latency} ms</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Uptime</span>
                      <span className="font-medium">{systemStatus.database.uptime}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Activity className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-800 ml-3">API</h2>
                  </div>
                  {getStatusIcon(systemStatus.api.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium capitalize ${getStatusColor(systemStatus.api.status)}`}>
                        {systemStatus.api.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Latency</span>
                      <span className="font-medium">{systemStatus.api.latency} ms</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Uptime</span>
                      <span className="font-medium">{systemStatus.api.uptime}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <HardDrive className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-800 ml-3">Storage</h2>
                  </div>
                  {getStatusIcon(systemStatus.storage.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium capitalize ${getStatusColor(systemStatus.storage.status)}`}>
                        {systemStatus.storage.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Usage</span>
                      <span className="font-medium">
                        {systemStatus.storage.usage} GB / {systemStatus.storage.total} GB
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          systemStatus.storage.usage / systemStatus.storage.total > 0.9
                            ? "bg-red-500"
                            : systemStatus.storage.usage / systemStatus.storage.total > 0.7
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{ width: `${(systemStatus.storage.usage / systemStatus.storage.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auth Status */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <User className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-800 ml-3">Authentication</h2>
                  </div>
                  {getStatusIcon(systemStatus.auth.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Status</span>
                      <span className={`font-medium capitalize ${getStatusColor(systemStatus.auth.status)}`}>
                        {systemStatus.auth.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Active Users</span>
                      <span className="font-medium">{systemStatus.auth.activeUsers}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-gray-500">Total Users</span>
                      <span className="font-medium">{systemStatus.auth.totalUsers}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Logs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <h2 className="text-lg font-semibold text-gray-800">Recent System Logs</h2>
                <p className="text-sm text-gray-600 mt-1">Latest system activities and events</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {formatTimestamp(log.timestamp)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLogLevelColor(log.level)}`}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            {getServiceIcon(log.service)}
                            <span className="ml-2 capitalize">{log.service}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traffic Metrics */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">System Traffic</h2>
                  <div className="p-2 bg-pink-100 rounded-lg">
                    <Activity className="h-5 w-5 text-pink-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm font-medium">Incoming Requests</span>
                      </div>
                      <span className="text-sm font-medium">1,245 / min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-green-500" style={{ width: "65%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <ArrowDownCircle className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">Outgoing Responses</span>
                      </div>
                      <span className="text-sm font-medium">1,238 / min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-blue-500" style={{ width: "64%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium">Error Rate</span>
                      </div>
                      <span className="text-sm font-medium">0.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-yellow-500" style={{ width: "0.5%" }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">Resource Usage</h2>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Server className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Cpu className="h-5 w-5 text-purple-500 mr-2" />
                        <span className="text-sm font-medium">CPU Usage</span>
                      </div>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-purple-500" style={{ width: "42%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Server className="h-5 w-5 text-pink-500 mr-2" />
                        <span className="text-sm font-medium">Memory Usage</span>
                      </div>
                      <span className="text-sm font-medium">3.2 GB / 8 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-pink-500" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <Database className="h-5 w-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">Database Connections</span>
                      </div>
                      <span className="text-sm font-medium">24 / 100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-blue-500" style={{ width: "24%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default SystemMonitoringPage
