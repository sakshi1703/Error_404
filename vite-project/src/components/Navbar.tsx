import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User as UserIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar'; // Import the sidebar component

const Navbar: React.FC = () => {
  const { currentUser, logout, userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Sidebar Toggle Button (Mobile) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-700 p-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="text-2xl font-bold text-indigo-600">
              CollabHub
            </Link>

            <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
              <form onSubmit={handleSearch} className="max-w-lg w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search for ideas, resources, skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center">
              {currentUser ? (
                <>
                  <button className="p-2 text-gray-400 hover:text-gray-500">
                    <Bell className="h-6 w-6" />
                  </button>
                  <div className="ml-3 relative flex items-center">
                    <Link to="/profile">
                      {userProfile?.profilePic ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={userProfile.profilePic} // Updated to show uploaded profile picture
                          alt={userProfile.displayName || "User Profile"}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-indigo-500" />
                        </div>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="ml-4 px-3 py-1 text-sm text-gray-700 hover:text-indigo-600"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                    Log in
                  </Link>
                  <Link to="/signup" className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-medium">
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay (for Mobile) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Component (Sliding) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-64'
        } transition-transform z-30 p-5`}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
        >
          <X className="h-6 w-6" />
        </button>

        <Sidebar />
      </div>
    </>
  );
};

export default Navbar;
