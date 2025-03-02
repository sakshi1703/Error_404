import React, { useState, useEffect, useRef } from "react";
import { Users, Lightbulb, BookOpen, Briefcase, PlusCircle, X, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { database } from "../firebase/config";
import { ref, push, set, serverTimestamp, onValue } from "firebase/database";

interface SidebarProps {
  groups?: { id: string; name: string }[];
  onFilterChange?: (type: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ groups = [], onFilterChange = () => {} }) => {
  const { userProfile, currentUser } = useAuth();
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>(groups || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupType, setNewGroupType] = useState("community");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [users, setUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [memberInput, setMemberInput] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<{ uid: string; displayName: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch users from Firebase
  useEffect(() => {
    const usersRef = ref(database, "users");
    onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData).map((uid) => ({
          uid,
          displayName: usersData[uid].displayName,
        }));
        setUsers(usersList);
      }
    });
  }, []);

  // Fetch user's groups
  useEffect(() => {
    if (!currentUser) return;
    const myGroupsRef = ref(database, `users/${currentUser.uid}/groups`);
    onValue(myGroupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const groupsData = snapshot.val();
        const groupList = Object.keys(groupsData).map((groupId) => ({
          id: groupId,
          name: groupsData[groupId].name,
        }));
        setMyGroups(groupList);
      }
    });
  }, [currentUser]);

  // Filter users based on input
  useEffect(() => {
    if (memberInput.trim() === "") {
      setFilteredUsers([]);
      return;
    }
    
    const filtered = users.filter(
      user => user.displayName.toLowerCase().includes(memberInput.toLowerCase())
        && !members.includes(user.displayName)
    );
    setFilteredUsers(filtered);
    setShowSuggestions(true);
  }, [memberInput, users, members]);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      onFilterChange(null);
    } else {
      setSelectedCategory(category);
      onFilterChange(category);
    }
  };

  const handleAddMember = (displayName: string) => {
    if (!displayName.trim() || members.includes(displayName)) return;
    setMembers([...members, displayName]);
    setMemberInput("");
    setShowSuggestions(false);
  };

  const handleRemoveMember = (name: string) => {
    setMembers(members.filter((m) => m !== name));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !currentUser) return;

    try {
      const groupsRef = ref(database, "groups");
      const newGroupRef = push(groupsRef);

      const groupData = {
        name: newGroupName,
        type: newGroupType,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: [...members, userProfile?.displayName],
      };

      await set(newGroupRef, groupData);

      // Store group under user profile
      await set(ref(database, `users/${currentUser.uid}/groups/${newGroupRef.key}`), {
        name: newGroupName,
      });

      setMyGroups([...myGroups, { id: newGroupRef.key || Date.now().toString(), name: newGroupName }]);

      setNewGroupName("");
      setNewGroupType("community");
      setMembers([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleCommunityClick = () => {
    setSelectedCategory(null);
    onFilterChange(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewGroupName("");
    setMembers([]);
    setMemberInput("");
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-6 ">
      {currentUser && (
        <div className="flex flex-col items-center text-center">
          {userProfile?.profilePic ? (
            <img 
              src={userProfile.profilePic} 
              alt={userProfile.displayName || "User Profile"} 
              className="h-20 w-20 rounded-full mb-2 object-cover" 
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
              <UserIcon className="h-10 w-10 text-indigo-500" />
            </div>
          )}
          <h2 className="text-lg font-semibold">{userProfile?.displayName || "User"}</h2>
          <p className="text-sm text-gray-500">{userProfile?.title || "Member"}</p>
        </div>
      )}

      <div className="space-y-1">
        <button
          onClick={handleCommunityClick}
          className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
            selectedCategory === null ? "text-white bg-indigo-600" : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          <Users className="mr-3 h-5 w-5" />
          All Posts
        </button>

        {[
          { label: "Ideas", icon: Lightbulb, type: "idea" },
          { label: "Resources", icon: BookOpen, type: "resource" },
          { label: "Skills", icon: Briefcase, type: "skills" },
        ].map(({ label, icon: Icon, type }) => (
          <button
            key={type}
            onClick={() => handleCategoryClick(type)}
            className={`flex items-center w-full text-left px-3 py-2 text-sm font-medium rounded-md ${
              selectedCategory === type ? "text-white bg-indigo-600" : "text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      <div>
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">My Groups</h3>
        <div className="mt-2 space-y-1">
          {myGroups.map((group) => (
            <div key={group.id} className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50">
              {group.name}
            </div>
          ))}
        </div>

        <button onClick={() => setIsModalOpen(true)} className="mt-3 flex items-center px-3 py-2 text-sm font-medium rounded-md text-indigo-600 hover:bg-indigo-50 w-full">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Group
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div ref={modalRef} className="bg-white p-5 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={handleCloseModal} 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-lg font-semibold mb-3">Create a New Group</h2>

            <input 
              type="text" 
              value={newGroupName} 
              onChange={(e) => setNewGroupName(e.target.value)} 
              placeholder="Enter group name" 
              className="w-full px-3 py-2 border rounded-md mb-3" 
            />

            <div className="mb-3 relative">
              <input 
                type="text" 
                value={memberInput} 
                onChange={(e) => setMemberInput(e.target.value)} 
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type to search members" 
                className="w-full px-3 py-2 border rounded-md" 
              />
              
              {showSuggestions && filteredUsers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-48 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div 
                      key={user.uid} 
                      onClick={() => handleAddMember(user.displayName)}
                      className="px-3 py-2 hover:bg-indigo-50 cursor-pointer"
                    >
                      {user.displayName}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {members.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-2">Selected members:</p>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <div key={member} className="flex items-center bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                      <span className="mr-1">{member}</span>
                      <button 
                        onClick={() => handleRemoveMember(member)}
                        className="text-indigo-400 hover:text-indigo-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={handleCreateGroup} 
              className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;