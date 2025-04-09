import { User, Calendar, Activity } from "lucide-react"

const RecentActivity = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-900">Dr. Sarah Johnson added a new patient</p>
            <p className="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-900">Dr. Michael Chen completed 3 appointments</p>
            <p className="text-xs text-gray-500">4 hours ago</p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
            <Activity className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-900">System maintenance completed</p>
            <p className="text-xs text-gray-500">Yesterday</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RecentActivity
