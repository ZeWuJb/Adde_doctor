import { Mail, Calendar, Users } from "lucide-react"
import PropTypes from "prop-types"

const DoctorsList = ({ doctors, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Doctors</h2>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start animate-pulse">
              <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-24">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Doctors</h2>
        <div className="text-center py-8 text-gray-500">No doctors found in the system.</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Top Doctors</h2>
      <div className="space-y-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="flex items-start">
            <img
              src={doctor.avatar || "/placeholder.svg?height=48&width=48"}
              alt={doctor.name}
              className="h-12 w-12 rounded-full object-cover mr-4"
            />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">{doctor.name}</h3>
              <p className="text-sm text-gray-600">{doctor.specialty}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Mail className="h-4 w-4 mr-1" />
                <span className="truncate">{doctor.email || "No email provided"}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end text-sm text-gray-500 mb-1">
                <Users className="h-4 w-4 mr-1" />
                <span>{doctor.patients} patients</span>
              </div>
              <div className="flex items-center justify-end text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{doctor.appointments} appointments</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

DoctorsList.propTypes = {
  doctors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      specialty: PropTypes.string,
      email: PropTypes.string,
      avatar: PropTypes.string,
      patients: PropTypes.number,
      appointments: PropTypes.number,
    }),
  ),
  loading: PropTypes.bool,
}

DoctorsList.defaultProps = {
  doctors: [],
  loading: false,
}

export default DoctorsList
