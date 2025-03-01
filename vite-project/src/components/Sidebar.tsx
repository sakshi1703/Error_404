import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Lightbulb, BookOpen, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  groups?: { id: string; name: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ groups = [] }) => {
  const { userProfile } = useAuth();
  
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
                {userProfile.displayName.charAt(0)}
              </span>
            </div>
          )}
          <h2 className="text-lg font-semibold">{userProfile.displayName}</h2>
          <p className="text-sm text-gray-500">{userProfile.title || 'Member'}</p>
        </div>
      )}
      
      <div className="space-y-1">
        <Link
          to="/community"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <Users className="mr-3 h-5 w-5" />
          Community
        </Link>
        <Link
          to="/ideas"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <Lightbulb className="mr-3 h-5 w-5" />
          Ideas
        </Link>
        <Link
          to="/resources"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <BookOpen className="mr-3 h-5 w-5" />
          Resources
        </Link>
        <Link
          to="/skills"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <Briefcase className="mr-3 h-5 w-5" />
          Skills
        </Link>
      </div>
      
      {groups.length > 0 && (
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            My Groups
          </h3>
          <div className="mt-2 space-y-1">
            {groups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50"
              >
                {group.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;