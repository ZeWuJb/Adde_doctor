import { Users, Calendar, Clipboard, User } from "lucide-react"

const AdminStats = () => {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-600">Total Doctors</h2>
            <p className="text-2xl font-semibold text-gray-800">4</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-green-100 rounded-full">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-600">Total Patients</h2>
            <p className="text-2xl font-semibold text-gray-800">174</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-100 rounded-full">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-600">Appointments Today</h2>
            <p className="text-2xl font-semibold text-gray-800">42</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center">
          <div className="p-3 bg-purple-100 rounded-full">
            <Clipboard className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-600">Reports</h2>
            <p className="text-2xl font-semibold text-gray-800">12</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminStats
