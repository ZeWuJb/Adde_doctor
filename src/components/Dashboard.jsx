



import { UserAuth } from "../context/AuthContext";

const DoctorDashboard = () => {
  const { session } = UserAuth();

  

  return (
    <div>
      <h1>Doctor Dashboard</h1>
      <p>Welcome, {session?.user?.email}!</p>
      {/* Add doctor-specific functionalities here */}
    </div>
  );
};

export default DoctorDashboard;