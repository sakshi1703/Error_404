import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services/userService";
import { User } from "../types";

const Profile: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [title, setTitle] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
      return;
    }

    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      setBio(userProfile.bio || "");
      setTitle(userProfile.title || "");
      setProfilePic(userProfile.profilePic || null);
    } else {
      setIsEditing(true);
    }
  }, [currentUser, loading, navigate, userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const newProfile: Partial<User> = {
        displayName,
        bio,
        title,
        profilePic,
        email: currentUser.email || "",
        connections: 0,
      };

      await updateUserProfile(currentUser.uid, newProfile);
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError("Failed to save profile");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <Navbar />
        <p className="text-lg font-semibold text-gray-700">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-700">
      <Navbar />
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="bg-white shadow-xl rounded-3xl p-8 mt-20 space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={profilePic || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
            <label htmlFor="profile-pic" className="relative cursor-pointer group mt-3">
              <input
                type="file"
                id="profile-pic"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </label>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:outline-none shadow-sm"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title / Profession</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 mt-1 border rounded-xl focus:ring-2 focus:ring-pink-300 focus:outline-none shadow-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 text-white bg-pink-500 rounded-xl hover:bg-pink-600 transition duration-200 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <h3 className="text-2xl font-semibold text-gray-800">{displayName}</h3>
              <p className="mt-1 text-sm text-gray-600 italic">{bio || "No bio added"}</p>
              <p className="mt-2 text-sm text-gray-600">{currentUser?.email}</p>
              <p className="mt-2 text-sm text-gray-600">{title || "Not specified"}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-5 px-6 py-3 text-white bg-indigo-400 rounded-xl hover:bg-pink-600 transition duration-200"
              >
                Edit Profile
              </button>
            </div>
          )}

          {error && <p className="text-red-500 text-center">{error}</p>}
          {success && <p className="text-green-500 text-center">{success}</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
