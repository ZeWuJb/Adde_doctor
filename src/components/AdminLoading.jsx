// Separate file for AdminLoading component to fix react-refresh/only-export-components error
const AdminLoading = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    <p className="ml-3 text-lg text-gray-700">Loading admin module...</p>
  </div>
)

export default AdminLoading
