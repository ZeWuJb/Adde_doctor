
import { UserAuth } from "../context/AuthContext";

const Navbar = () => {
  const { session } = UserAuth();

  return (
    <nav className="bg-gray-100 py-4 px-6 shadow-md">
      <div className="flex justify-between items-center">
        {/* Profile Button */}
        <div>
          <img
            src={session?.user?.user_metadata?.avatar_url || "default-avatar.png"}
            alt="Profile"
            className="w-10 h-10 rounded-full cursor-pointer"
          />
        </div>

        {/* Notifications Button */}
        <button
  onClick={() => alert("View Notifications")}
  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300"
>
          Notifications
        </button>
      </div>
    </nav>
  );
};

export default Navbar;