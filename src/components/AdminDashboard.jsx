import { UserAuth } from "../context/AuthContext";

const AdminDashboard = () => {
  const { session } = UserAuth();

  
 
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {session?.user?.email}!</p>
      {/* Add admin-specific functionalities here */}
    </div>
  );
};

export default AdminDashboard;