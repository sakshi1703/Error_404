import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';
import { User } from '../types';
import "./Profile.css"

const Profile: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [title, setTitle] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setTitle(userProfile.title || '');
      setProfilePic(userProfile.profilePic || null);
    } else {
      setIsEditing(true);
    }
  }, [currentUser, loading, navigate, userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const newProfile: Partial<User> = {
        displayName,
        bio,
        title,
        profilePic,
        email: currentUser.email || '',
        connections: 0,
      };
      await updateUserProfile(currentUser.uid, newProfile);
      setSuccess('Profile saved successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save profile');
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Navbar />
        <div className="text-center py-10 text-lg font-semibold">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-3xl mx-auto py-10">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex flex-col items-center">
            <label htmlFor="profile-pic" className="relative cursor-pointer">
              <img
                src={profilePic || 'https://via.placeholder.com/150'}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-gray-300 object-cover hover:opacity-80 transition duration-300"
              />
              <input type="file" id="profile-pic" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
            </label>
            <p className="text-sm text-gray-500 mt-2 italic">Click to update profile picture</p>
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-blue-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-blue-300"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title / Profession</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md focus:ring focus:ring-blue-300"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 text-center">
              <h3 className="text-xl font-semibold text-gray-800">{displayName}</h3>
              <p className="text-sm text-gray-600 italic">{bio || 'No bio added'}</p>
              <p className="mt-2 text-sm text-gray-600">{currentUser?.email}</p>
              <p className="mt-2 text-sm text-gray-600">{title || 'Not specified'}</p>
              <p className="mt-2 text-sm text-gray-600">Connections: {userProfile?.connections || 0}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
