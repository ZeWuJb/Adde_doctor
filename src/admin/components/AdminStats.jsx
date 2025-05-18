import { Users, Calendar, BookOpen, UserPlus } from "lucide-react"
import PropTypes from "prop-types"

const AdminStats = ({ stats, loading = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Doctors Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Doctors</h3>
          <div className="p-2 bg-blue-100 rounded-full">
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{stats.doctorsCount || 0}</div>
        )}
        <p className="mt-2 text-sm text-gray-600">Total registered doctors</p>
      </div>

      {/* Patients Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Patients</h3>
          <div className="p-2 bg-green-100 rounded-full">
            <Users className="h-6 w-6 text-green-600" />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{stats.patientsCount || 0}</div>
        )}
        <p className="mt-2 text-sm text-gray-600">Total registered patients</p>
      </div>

      {/* Appointments Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Appointments</h3>
          <div className="p-2 bg-purple-100 rounded-full">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{stats.appointmentsCount || 0}</div>
        )}
        <p className="mt-2 text-sm text-gray-600">Total scheduled appointments</p>
      </div>

      {/* Articles Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">Articles</h3>
          <div className="p-2 bg-pink-100 rounded-full">
            <BookOpen className="h-6 w-6 text-pink-600" />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        ) : (
          <div className="text-3xl font-bold text-gray-900">{stats.articlesCount || 0}</div>
        )}
        <p className="mt-2 text-sm text-gray-600">Published health articles</p>
      </div>
    </div>
  )
}

AdminStats.propTypes = {
  stats: PropTypes.shape({
    doctorsCount: PropTypes.number,
    patientsCount: PropTypes.number,
    appointmentsCount: PropTypes.number,
    articlesCount: PropTypes.number,
  }),
  loading: PropTypes.bool,
}

AdminStats.defaultProps = {
  stats: {
    doctorsCount: 0,
    patientsCount: 0,
    appointmentsCount: 0,
    articlesCount: 0,
  },
  loading: false,
}

export default AdminStats
