import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { createPost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { storage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface CreatePostFormProps {
  onPostCreated: () => void;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onPostCreated }) => {
  const { currentUser, userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [postType, setPostType] = useState<'idea' | 'resource' | ''>('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const storageRef = ref(storage, `posts/${currentUser?.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !content.trim()) return;
    setIsSubmitting(true);

    try {
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const tagList = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag)
        .map(tag => (tag.startsWith('#') ? tag : `#${tag}`));

      await createPost(
        currentUser.uid,
        content,
        userProfile.displayName,
        userProfile.title || '',
        userProfile.photoURL || '',
        tagList,
        postType,
        imageUrl // Pass the uploaded image URL to createPost
      );

      setContent('');
      setTags('');
      setPostType('');
      setImage(null);
      setPreview(null);
      setUploadProgress(0);
      document.getElementById('post-form-details')?.classList.add('hidden');
      alert('Post added successfully!');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow mb-2 p-4">
      <div className="flex items-center mb-4">
        {userProfile?.photoURL ? (
          <img src={userProfile.photoURL} alt={userProfile.displayName} className="h-10 w-10 rounded-full mr-3" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
            <span className="text-lg font-semibold text-indigo-600">{userProfile?.displayName.charAt(0) || 'U'}</span>
          </div>
        )}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Share an idea, resource, or skill..."
            className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={() => document.getElementById('post-form-details')?.classList.remove('hidden')}
          />
        </div>
        <button
          className="ml-3 p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => document.getElementById('post-form-details')?.classList.toggle('hidden')}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div id="post-form-details" className="hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full border rounded-md p-2"
            placeholder="Share your thoughts, ideas, or resources..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Add an image</label>
              <label htmlFor="post-image" className="cursor-pointer bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm">
                Select Image
                <input
                  type="file"
                  id="post-image"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            
            {preview && (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-auto rounded-md mt-2 max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  X
                </button>
              </div>
            )}

            {uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Post Type</label>
            <div className="mt-2 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="postType"
                  value="idea"
                  checked={postType === 'idea'}
                  onChange={() => setPostType('idea')}
                />
                <span className="ml-2">Idea</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-indigo-600"
                  name="postType"
                  value="resource"
                  checked={postType === 'resource'}
                  onChange={() => setPostType('resource')}
                />
                <span className="ml-2">Resource</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border rounded-md p-2 mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Example: startup, networking, design</p>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              onClick={() => {
                document.getElementById('post-form-details')?.classList.add('hidden');
                setContent('');
                setTags('');
                setPostType('');
                setImage(null);
                setPreview(null);
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostForm;