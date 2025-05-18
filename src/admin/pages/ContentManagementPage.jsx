"use client"

import { useState, useEffect } from "react"
import { UserAuth } from "../../context/AuthContext"
import { useLocation } from "react-router-dom"
import AdminSidebar from "../components/AdminSidebar"
import AdminHeader from "../components/AdminHeader"
import { BookOpen, Plus, Search, Edit, Trash2, Tag, Calendar, Filter, ChevronDown } from "lucide-react"
import { supabase } from "../../supabaseClient"

const ContentManagementPage = () => {
  const { session, userData, signOut } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [articles, setArticles] = useState([])
  const [filteredArticles, setFilteredArticles] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newArticle, setNewArticle] = useState({
    title: "",
    summary: "",
    content: "",
    category: "pregnancy",
    tags: "",
  })
  const location = useLocation()
  const [success, setSuccess] = useState(null)

  const fetchArticles = async () => {
    try {
      setLoading(true)

      // Fetch from Supabase
      const { data, error } = await supabase
        .from("education_articles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setArticles(data)
      setFilteredArticles(data)
    } catch (err) {
      console.error("Error fetching articles:", err.message)
      setError("Failed to fetch articles. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session && session.role === "admin") {
      fetchArticles()
    } else {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (articles.length === 0) {
      setFilteredArticles([])
      return
    }

    let filtered = [...articles]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((article) => article.category === categoryFilter)
    }

    setFilteredArticles(filtered)
  }, [searchTerm, categoryFilter, articles])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleAddArticle = async () => {
    try {
      // Validate inputs
      if (!newArticle.title || !newArticle.summary || !newArticle.content) {
        setError("Please fill in all required fields")
        return
      }

      // In a real app, insert into your Supabase table
      const { data, error } = await supabase
        .from("education_articles")
        .insert({
          title: newArticle.title,
          summary: newArticle.summary,
          content: newArticle.content,
          category: newArticle.category,
          tags: newArticle.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        })
        .select()

      if (error) throw error

      // Add the new article to the state
      const addedArticle = data[0]

      setArticles([addedArticle, ...articles])
      setSuccess("Article added successfully")

      // Reset form and close modal
      setNewArticle({
        title: "",
        summary: "",
        content: "",
        category: "pregnancy",
        tags: "",
      })
      setShowAddModal(false)
    } catch (err) {
      console.error("Error adding article:", err.message)
      setError("Failed to add article. Please try again.")
    }
  }

  const handleDeleteArticle = async (id) => {
    try {
      // In a real app, delete from your Supabase table
      const { error } = await supabase.from("education_articles").delete().eq("id", id)

      if (error) throw error

      // Update state
      setArticles(articles.filter((article) => article.id !== id))
      setSuccess("Article deleted successfully")
    } catch (err) {
      console.error("Error deleting article:", err.message)
      setError("Failed to delete article. Please try again.")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  useEffect(() => {
    // Set up real-time subscription for education_articles
    const articlesSubscription = supabase
      .channel("articles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "education_articles" }, (payload) => {
        console.log("Article change received:", payload)
        // Refresh the articles data when changes occur
        fetchArticles()
      })
      .subscribe()

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(articlesSubscription)
    }
  }, [])

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

        {/* Content Management */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Health Information Management</h1>
            <p className="text-gray-600">Manage educational content and health information</p>
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

          <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex space-x-2 w-full md:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                <Filter className="mr-2 h-5 w-5" />
                Filters
                <ChevronDown className={`ml-2 h-4 w-4 transform ${showFilters ? "rotate-180" : ""}`} />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add New Article
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
              <h3 className="font-medium text-gray-700 mb-3">Filter by Category</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === "all"
                      ? "bg-pink-100 text-pink-800 border border-pink-300"
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setCategoryFilter("pregnancy")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === "pregnancy"
                      ? "bg-pink-100 text-pink-800 border border-pink-300"
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Pregnancy
                </button>
                <button
                  onClick={() => setCategoryFilter("childcare")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === "childcare"
                      ? "bg-pink-100 text-pink-800 border border-pink-300"
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Childcare
                </button>
                <button
                  onClick={() => setCategoryFilter("nutrition")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === "nutrition"
                      ? "bg-pink-100 text-pink-800 border border-pink-300"
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Nutrition
                </button>
                <button
                  onClick={() => setCategoryFilter("health")}
                  className={`px-3 py-1 rounded-full text-sm ${
                    categoryFilter === "health"
                      ? "bg-pink-100 text-pink-800 border border-pink-300"
                      : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  Health
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredArticles.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{article.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(article.created_at)}</span>
                          {article.category && (
                            <>
                              <span className="mx-2">•</span>
                              <Tag className="h-4 w-4 mr-1" />
                              <span className="capitalize">{article.category}</span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{article.summary}</p>
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                          onClick={() => handleDeleteArticle(article.id)}
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
                <h3 className="text-lg font-medium text-gray-900 mb-1">No articles found</h3>
                <p className="text-gray-500">
                  {searchTerm || categoryFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first article"}
                </p>
                {(searchTerm || categoryFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setCategoryFilter("all")
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Article Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Add New Article</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter article title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="pregnancy">Pregnancy</option>
                    <option value="childcare">Childcare</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="health">Health</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary</label>
                  <textarea
                    value={newArticle.summary}
                    onChange={(e) => setNewArticle({ ...newArticle, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows="2"
                    placeholder="Brief summary of the article"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows="8"
                    placeholder="Full article content"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newArticle.tags}
                    onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g. first trimester, nutrition, exercise"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddArticle}
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Add Article
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
