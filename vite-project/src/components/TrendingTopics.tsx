import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrendingTopics } from '../services/postService';
import { Topic } from '../types';

const TrendingTopics: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const trendingTopics = await getTrendingTopics();
        setTopics(trendingTopics);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopics();
  }, []);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Trending Topics</h2>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Trending Topics</h2>
        <p className="text-gray-500 text-center py-4">No trending topics yet</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Trending Topics</h2>
      <div className="space-y-3">
        {topics.map((topic, index) => (
          <Link
            key={index}
            to={`/search?q=${encodeURIComponent(topic.name)}`}
            className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-md"
          >
            <span className="text-indigo-600 font-medium">{topic.name}</span>
            <span className="text-gray-500 text-sm">{topic.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TrendingTopics;