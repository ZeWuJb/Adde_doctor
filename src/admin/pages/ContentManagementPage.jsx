"use client"

import React, { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { BookOpen, Plus, Search, Edit, Trash2, AlertCircle, Check } from "lucide-react"
import { AdminContext } from "../../context/AdminContext"

const ContentManagementPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { loading, error, setError, weeklyTips, infoArticles, addArticle, deleteArticle } =
    React.useContext(AdminContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [filteredWeeklyTips, setFilteredWeeklyTips] = useState([])
  const [filteredInfoArticles, setFilteredInfoArticles] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showWeeklyTipModal, setShowWeeklyTipModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [weeklyTipData, setWeeklyTipData] = useState({
    week: "",
    imageFile: null,
    imagePreview: "",
    title_en: "",
    title_am: "",
    description_en: "",
    description_am: "",
  })
  const [infoData, setInfoData] = useState({
    day: "",
    time: "",
    is_favorite: false,
    type: "",
    imageFile: null,
    imagePreview: "",
    title_en: "",
    title_am: "",
    text_en: "",
    text_am: "",
  })
  const [success, setSuccess] = useState(null)
  const [formError, setFormError] = useState(null)
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

  const getImageSrc = (base64) => {
    if (!base64) return ""
    return `data:image/jpeg;base64,${base64}`
  }

  useEffect(() => {
    if (weeklyTips.length === 0) {
      setFilteredWeeklyTips([])
    } else {
      let filtered = [...weeklyTips]
      if (searchTerm) {
        filtered = filtered.filter(
          (article) =>
            (article.title_en && article.title_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (article.description_en && article.description_en.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }
      setFilteredWeeklyTips(filtered)
    }

    if (infoArticles.length === 0) {
      setFilteredInfoArticles([])
    } else {
      let filtered = [...infoArticles]
      if (searchTerm) {
        filtered = filtered.filter(
          (article) =>
            (article.title_en && article.title_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (article.text_en && article.text_en.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }
      setFilteredInfoArticles(filtered)
    }
  }, [searchTerm, weeklyTips, infoArticles])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleImageChange = (setter, data) => (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("Image size exceeds 2MB limit")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setter({ ...data, imageFile: file, imagePreview: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddArticle = async (table, data) => {
    try {
      if (table === "weekly_tips") {
        if (!data.week || !data.title_en || !data.description_en) {
          setFormError("Please fill in all required fields (Week, English Title, English Description)")
          return
        }
        const weekNumber = Number.parseInt(data.week, 10)
        if (isNaN(weekNumber) || weekNumber < 1) {
          setFormError("Week must be a valid positive number")
          return
        }
        const weeklyTipPayload = {
          week: weekNumber,
          title_en: data.title_en,
          title_am: data.title_am || null,
          description_en: data.description_en,
          description_am: data.description_am || null,
        }
        const result = await addArticle(table, weeklyTipPayload, data.imageFile)
        if (result.success) {
          setSuccess("Weekly tip added successfully")
          setWeeklyTipData({
            week: "",
            imageFile: null,
            imagePreview: "",
            title_en: "",
            title_am: "",
            description_en: "",
            description_am: "",
          })
          setShowWeeklyTipModal(false)
          setFormError(null)
        } else {
          setFormError(`Failed to add weekly tip: ${result.error}`)
        }
      } else if (table === "info1") {
        if (!data.title_en || !data.text_en) {
          setFormError("Please fill in all required fields (English Title, English Text)")
          return
        }
        const infoPayload = {
          day: data.day || null,
          time: data.time || null,
          is_favorite: data.is_favorite,
          type: data.type || null,
          title_en: data.title_en,
          title_am: data.title_am || null,
          text_en: data.text_en,
          text_am: data.text_am || null,
        }
        const result = await addArticle(table, infoPayload, data.imageFile)
        if (result.success) {
          setSuccess("Info content added successfully")
          setInfoData({
            day: "",
            time: "",
            is_favorite: false,
            type: "",
            imageFile: null,
            imagePreview: "",
            title_en: "",
            title_am: "",
            text_en: "",
            text_am: "",
          })
          setShowInfoModal(false)
          setFormError(null)
        } else {
          setFormError(`Failed to add info content: ${result.error}`)
        }
      }
    } catch (err) {
      console.error(`Error adding to ${table}:`, err.message)
      setFormError(`Failed to add to ${table}: ${err.message}`)
    }
  }

  const handleDeleteArticle = async (table, id) => {
    try {
      const result = await deleteArticle(table, id)
      if (result.success) {
        setSuccess(`${table === "weekly_tips" ? "Weekly tip" : "Info content"} deleted successfully`)
      } else {
        setFormError(`Failed to delete ${table === "weekly_tips" ? "weekly tip" : "info content"}: ${result.error}`)
      }
    } catch (err) {
      console.error(`Error deleting from ${table}:`, err.message)
      setFormError(`Failed to delete ${table === "weekly_tips" ? "weekly tip" : "info content"}: ${err.message}`)
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
                <p className="ml-3 text-lg text-gray-700">Loading content...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Content Management</h1>
              <p className="text-pink-100">Manage weekly health tips and informational content</p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-700">{error}</span>
                  <button className="ml-auto text-sm font-medium text-red-700 underline" onClick={() => setError(null)}>
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-green-700">{success}</span>
                  <button
                    className="ml-auto text-sm font-medium text-green-700 underline"
                    onClick={() => setSuccess(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-red-700">{formError}</span>
                  <button
                    className="ml-auto text-sm font-medium text-red-700 underline"
                    onClick={() => setFormError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="relative w-full lg:w-80">
                <input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowWeeklyTipModal(true)}
                  className="flex items-center justify-center px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Weekly Tip
                </button>
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Info Content
                </button>
              </div>
            </div>

            {/* Weekly Tips Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
                <h2 className="text-xl font-semibold text-gray-800">Weekly Tips</h2>
                <p className="text-sm text-gray-600 mt-1">Manage weekly health tips for patients</p>
              </div>
              <div className="p-6">
                {filteredWeeklyTips.length > 0 ? (
                  <div className="space-y-4">
                    {filteredWeeklyTips.map((article) => (
                      <div
                        key={article.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">{article.title_en}</h3>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium">
                                Week {article.week}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{article.description_en}</p>
                            {article.title_am && (
                              <p className="text-gray-600 mb-3 font-medium">Amharic: {article.title_am}</p>
                            )}
                            {article.image && (
                              <img
                                src={getImageSrc(article.image) || "/placeholder.svg"}
                                alt={article.title_en}
                                className="mt-2 max-w-xs rounded-md"
                              />
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              onClick={() => handleDeleteArticle("weekly_tips", article.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No weekly tips found</h3>
                    <p className="text-gray-600">
                      {searchTerm ? "Try adjusting your search" : "Get started by adding your first weekly tip"}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Info Articles Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 className="text-xl font-semibold text-gray-800">Info Content</h2>
                <p className="text-sm text-gray-600 mt-1">Manage informational articles and resources</p>
              </div>
              <div className="p-6">
                {filteredInfoArticles.length > 0 ? (
                  <div className="space-y-4">
                    {filteredInfoArticles.map((article) => (
                      <div
                        key={article.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">{article.title_en}</h3>
                            <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2 gap-2">
                              {article.day && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  Day: {article.day}
                                </span>
                              )}
                              {article.time && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  Time: {article.time}
                                </span>
                              )}
                              {article.type && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  Type: {article.type}
                                </span>
                              )}
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${article.is_favorite ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}
                              >
                                {article.is_favorite ? "Favorite" : "Regular"}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{article.text_en}</p>
                            {article.title_am && (
                              <p className="text-gray-600 mb-3 font-medium">Amharic: {article.title_am}</p>
                            )}
                            {article.image && (
                              <img
                                src={getImageSrc(article.image) || "/placeholder.svg"}
                                alt={article.title_en}
                                className="mt-2 max-w-xs rounded-md"
                              />
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              onClick={() => handleDeleteArticle("info1", article.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No info content found</h3>
                    <p className="text-gray-600">
                      {searchTerm ? "Try adjusting your search" : "Get started by adding your first info content"}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Weekly Tip Modal */}
      {showWeeklyTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Weekly Tip</h2>
                <button onClick={() => setShowWeeklyTipModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week Number *</label>
                  <input
                    type="number"
                    value={weeklyTipData.week}
                    onChange={(e) => setWeeklyTipData({ ...weeklyTipData, week: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter week number"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange(setWeeklyTipData, weeklyTipData)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  {weeklyTipData.imagePreview && (
                    <img
                      src={weeklyTipData.imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="mt-2 max-w-xs rounded-md"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Title *</label>
                  <input
                    type="text"
                    value={weeklyTipData.title_en}
                    onChange={(e) => setWeeklyTipData({ ...weeklyTipData, title_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter English title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amharic Title (Optional)</label>
                  <input
                    type="text"
                    value={weeklyTipData.title_am}
                    onChange={(e) => setWeeklyTipData({ ...weeklyTipData, title_am: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter Amharic title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Description *</label>
                  <textarea
                    value={weeklyTipData.description_en}
                    onChange={(e) => setWeeklyTipData({ ...weeklyTipData, description_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows="4"
                    placeholder="Enter English description"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amharic Description (Optional)</label>
                  <textarea
                    value={weeklyTipData.description_am}
                    onChange={(e) => setWeeklyTipData({ ...weeklyTipData, description_am: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows="4"
                    placeholder="Enter Amharic description"
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowWeeklyTipModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddArticle("weekly_tips", weeklyTipData)}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Add Weekly Tip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Info Content</h2>
                <button onClick={() => setShowInfoModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day (Optional)</label>
                  <input
                    type="text"
                    value={infoData.day}
                    onChange={(e) => setInfoData({ ...infoData, day: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter day (e.g., Monday)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={infoData.time}
                    onChange={(e) => setInfoData({ ...infoData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      checked={infoData.is_favorite}
                      onChange={(e) => setInfoData({ ...infoData, is_favorite: e.target.checked })}
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    Mark as Favorite
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type (Optional)</label>
                  <input
                    type="text"
                    value={infoData.type}
                    onChange={(e) => setInfoData({ ...infoData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter type (e.g., Health, Nutrition)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange(setInfoData, infoData)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {infoData.imagePreview && (
                    <img
                      src={infoData.imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="mt-2 max-w-xs rounded-md"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Title *</label>
                  <input
                    type="text"
                    value={infoData.title_en}
                    onChange={(e) => setInfoData({ ...infoData, title_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter English title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amharic Title (Optional)</label>
                  <input
                    type="text"
                    value={infoData.title_am}
                    onChange={(e) => setInfoData({ ...infoData, title_am: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter Amharic title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Text *</label>
                  <textarea
                    value={infoData.text_en}
                    onChange={(e) => setInfoData({ ...infoData, text_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="4"
                    placeholder="Enter English text"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amharic Text (Optional)</label>
                  <textarea
                    value={infoData.text_am}
                    onChange={(e) => setInfoData({ ...infoData, text_am: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="4"
                    placeholder="Enter Amharic text"
                  ></textarea>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAddArticle("info1", infoData)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Add Info Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContentManagementPage
