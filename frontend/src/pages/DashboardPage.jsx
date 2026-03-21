import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl text-white font-semibold mb-2">Welcome, {user?.name}</h1>
        <p className="text-gray-400 mb-6">You are logged in as a {user?.role}</p>
        <button onClick={logout} className="text-sm text-red-400 hover:text-red-300">
          Sign out
        </button>
      </div>
    </div>
  );
}