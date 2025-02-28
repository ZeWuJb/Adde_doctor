import { UserAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

import PropTypes from 'prop-types';

const PrivateRoute = ({ children }) => {
  const { session } = UserAuth();

  if (session === undefined) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/signin" />;
  }

  // Redirect based on user role
  if (session.role === "admin") {
    return <Navigate to="/admin-dashboard" />;
  } else if (session.role === "doctor") {
    return <>{children}</>; // Default to doctor dashboard
  }

  return <Navigate to="/signup" />;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
export default PrivateRoute;