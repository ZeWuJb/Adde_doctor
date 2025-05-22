"use client"

import React, { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { BookOpen, Plus, Search, Edit, Trash2 } from "lucide-react"
import { AdminContext } from "../../context/AdminContext"

const ContentManagementPage = () => {
  const { session, userData, signOut } = UserAuth()
  const { loading, error, setError, weeklyTips, infoArticles, addArticle, deleteArticle } = React.useContext(AdminContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  // Helper function to format raw Base64 for img src
  const getImageSrc = (base64) => {
    if (!base64) return ""
    // Assume JPEG for consistency; adjust if other formats are needed
    return `data:image/jpeg;base64,${base64}`
  }

  useEffect(() => {
    // Filter weekly_tips
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

    // Filter info1
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
        const weekNumber = parseInt(data.week, 10)
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
        console.log("Adding weekly tip:", weeklyTipPayload, "Image file:", data.imageFile)
        const result = await addArticle(table, weeklyTipPayload, data.imageFile)
        console.log("Add article result:", result)
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
        console.log("Adding info content:", infoPayload, "Image file:", data.imageFile)
        const result = await addArticle(table, infoPayload, data.imageFile)
        console.log("Add article result:", result)
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p className="ml-3 text-lg text-gray-700">Loading content...</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        session={session}
        userData={userData}
        handleSignOut={handleSignOut}
        currentPath={location.pathname}
      />
      <div className="flex-1 md:ml-64">
        <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} session={session} />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Content Management</h1>
            <p className="text-gray-600">Manage weekly health tips and info content</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p>{error}</p>
              <button className="mt-2 text-sm font-medium text-red-700 underline" onClick={() => setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
              <p>{success}</p>
              <button className="mt-2 text-sm font-medium text-green-700 underline" onClick={() => setSuccess(null)}>
                Dismiss
              </button>
            </div>
          )}

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
              <p>{formError}</p>
              <button className="mt-2 text-sm font-medium text-red-700 underline" onClick={() => setFormError(null)}>
                Dismiss
              </button>
            </div>
          )}

          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search content..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <button
                onClick={() => setShowWeeklyTipModal(true)}
                className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Weekly Tip
              </button>
              <button
                onClick={() => setShowInfoModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Info Content
              </button>
            </div>
          </div>

          {/* Weekly Tips Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Tips</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredWeeklyTips.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredWeeklyTips.map((article) => (
                    <div key={article.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{article.title_en}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <span>Week {article.week}</span>
                          </div>
                          <p className="text-gray-600 mb-3">{article.description_en}</p>
                          {article.title_am && (
                            <p className="text-gray-600 mb-3 font-medium">Amharic Title: {article.title_am}</p>
                          )}
                          {article.description_am && (
                            <p className="text-gray-600 mb-3">{article.description_am}</p>
                          )}
                          {article.image && (
                            <img src={getImageSrc(article.image)} alt={article.title_en} className="mt-2 max-w-xs rounded-md" />
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
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
                <div className="p-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No weekly tips found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? "Try adjusting your search" : "Get started by adding your first weekly tip"}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Articles Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Info Content</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredInfoArticles.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredInfoArticles.map((article) => (
                    <div key={article.id} className="p-6 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-1">{article.title_en}</h3>
                          <div className="flex items-center text-sm text-gray-500 mb-2 space-x-4">
                            {article.day && <span>Day: {article.day}</span>}
                            {article.time && <span>Time: {article.time}</span>}
                            {article.type && <span>Type: {article.type}</span>}
                            <span>Favorite: {article.is_favorite ? "Yes" : "No"}</span>
                          </div>
                          <p className="text-gray-600 mb-3">{article.text_en}</p>
                          {article.title_am && (
                            <p className="text-gray-600 mb-3 font-medium">Amharic Title: {article.title_am}</p>
                          )}
                          {article.text_am && (
                            <p className="text-gray-600 mb-3">{article.text_am}</p>
                          )}
                          {article.image && (
                            <img src={getImageSrc(article.image)} alt={article.title_en} className="mt-2 max-w-xs rounded-md" />
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-full"
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
                <div className="p-6 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No info content found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? "Try adjusting your search" : "Get started by adding your first info content"}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showWeeklyTipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <img src={weeklyTipData.imagePreview} alt="Preview" className="mt-2 max-w-xs rounded-md" />
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

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter day (e.g., Monday)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time (Optional)</label>
                  <input
                    type="time"
                    value={infoData.time}
                    onChange={(e) => setInfoData({ ...infoData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <input
                      type="checkbox"
                      checked={infoData.is_favorite}
                      onChange={(e) => setInfoData({ ...infoData, is_favorite: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter type (e.g., Health, Nutrition)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange(setInfoData, infoData)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {infoData.imagePreview && (
                    <img src={infoData.imagePreview} alt="Preview" className="mt-2 max-w-xs rounded-md" />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Title *</label>
                  <input
                    type="text"
                    value={infoData.title_en}
                    onChange={(e) => setInfoData({ ...infoData, title_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter English title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amharic Title (Optional)</label>
                  <input
                    type="text"
                    value={infoData.title_am}
                    onChange={(e) => setInfoData({ ...infoData, title_am: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Amharic title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Text *</label>
                  <textarea
                    value={infoData.text_en}
                    onChange={(e) => setInfoData({ ...infoData, text_en: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Enter English text"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amharic Text (Optional)</label>
                  <textarea
                    value={infoData.text_am}
                    onChange={(e) => setInfoData({ ...infoData, text_am: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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