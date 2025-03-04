import PropTypes from "prop-types";

const PendingRequests = ({ requests }) => {
  const handleAccept = (id) => {
    alert(`Request ${id} accepted!`);
  };

  const handleReject = (id) => {
    alert(`Request ${id} rejected!`);
  };

  // Ensure requests is an array
  if (!Array.isArray(requests)) {
    return <p>No pending requests.</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
      {requests.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Patient Name</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="py-2 px-4 border-b">{request.patientName}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleAccept(request.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded-md mr-2"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-md"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No pending requests.</p>
      )}
    </div>
  );
};

// PropType validation for 'requests'
PendingRequests.propTypes = {
  requests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      patientName: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default PendingRequests;