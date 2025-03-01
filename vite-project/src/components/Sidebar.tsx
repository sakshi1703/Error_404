import React, { useState } from 'react';
import { Users, Lightbulb, BookOpen, Briefcase, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { database } from '../firebase/config'; 
import { ref, push, set, serverTimestamp } from 'firebase/database';

interface SidebarProps {
  groups: { id: string; name: string }[];
  onFilterChange: (type: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ groups, onFilterChange }) => {
  const { userProfile, currentUser } = useAuth();
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>(groups || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('community');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const handleCategoryClick = (category: string) => {
    // If clicking the already selected category, clear the filter
    if (selectedCategory === category) {
      setSelectedCategory(null);
      onFilterChange(null);
    } else {
      setSelectedCategory(category);
      onFilterChange(category);
    }
  };

  const handleAddMember = () => {
    if (!memberEmail.trim() || members.includes(memberEmail)) return;
    setMembers([...members, memberEmail]);
    setMemberEmail('');
  };

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter(m => m !== email));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;
    
    try {
      // Create a reference for a new group
      const groupsRef = ref(database, 'groups');
      const newGroupRef = push(groupsRef);
      
      // Add the group to Realtime Database
      const groupData = {
        name: newGroupName,
        type: newGroupType,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: [...members, currentUser.email], // Include creator as a member
      };
      
      await set(newGroupRef, groupData);
      
      // Update local state
      const newGroup = { 
        id: newGroupRef.key || Date.now().toString(), 
        name: newGroupName 
      };
      
      setMyGroups([...myGroups, newGroup]);
      
      // Reset form
      setNewGroupName('');
      setNewGroupType('community');
      setMembers([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Show all posts when clicking "Community"
  const handleCommunityClick = () => {
    setSelectedCategory(null);
    onFilterChange(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6">
      {userProfile && (
        <div className="flex flex-col items-center text-center">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.displayName}
              className="h-20 w-20 rounded-full mb-2"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
              <span className="text-2xl font-semibold text-indigo-600">
                {userProfile.displayName?.charAt(0) || 'U'}
              </span>
            </div>
          )}
          <h2 className="text-lg font-semibold">{userProfile.displayName || 'User'}</h2>
          <p className="text-sm text-gray-500">{userProfile.title || 'Member'}</p>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={handleCommunityClick}
          className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
            selectedCategory === null
              ? 'text-white bg-indigo-600'
              : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          <Users className="mr-3 h-5 w-5" />
          All Posts
        </button>
        
        {[
          { label: 'Ideas', icon: Lightbulb, type: 'idea' },
          { label: 'Resources', icon: BookOpen, type: 'resource' },
          { label: 'Skills', icon: Briefcase, type: 'skills' }
        ].map(({ label, icon: Icon, type }) => (
          <button
            key={type}
            onClick={() => handleCategoryClick(type)}
            className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              selectedCategory === type
                ? 'text-white bg-indigo-600'
                : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      <div>
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          My Groups
        </h3>
        <div className="mt-2 space-y-1">
          {myGroups.map((group) => (
            <div key={group.id} className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
              {group.name}
            </div>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-3 flex items-center px-3 py-2 text-sm font-medium rounded-md text-indigo-600 hover:bg-indigo-50 w-full"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Group
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-3">Create a New Group</h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Group Type</label>
              <select
                value={newGroupType}
                onChange={(e) => setNewGroupType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="community">Community</option>
                <option value="idea">Ideas</option>
                <option value="resource">Resources</option>
                <option value="skills">Skills</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
              <div className="flex">
                <input
                  type="string"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Enter member name"
                  className="flex-1 px-3 py-2 border rounded-l-md"
                />
                <button
                  onClick={handleAddMember}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
            </div>
            
            {members.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto">
                  {members.map((displayName) => (
                    <div key={displayName} className="flex justify-between items-center py-1">
                      <span className="text-sm">{displayName}</span>
                      <button
                        onClick={() => handleRemoveMember(displayName)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;