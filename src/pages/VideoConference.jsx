import PropTypes from "prop-types";

const VideoConference = ({ appointment }) => {
  const meetingLink = `https://meet.jit.si/${appointment.id}`;

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Join Video Conference</h2>
      <p>Patient: {appointment.patientName}</p>
      <p>Time: {new Date(appointment.time).toLocaleString()}</p>
      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
      >
        Join Meeting
      </a>
    </div>
  );
};

// PropType validation for 'appointment'
VideoConference.propTypes = {
  appointment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired, // 'id' can be a number or string
    patientName: PropTypes.string.isRequired, // Ensure 'patientName' is a string
    time: PropTypes.string.isRequired, // Ensure 'time' is a string (ISO format)
  }).isRequired,
};

export default VideoConference;