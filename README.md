# Error_404


# 🚀 CollabHub - A Firebase-Powered Social Platform

## 📌 Project Overview
Social Connect is a modern social networking platform that enables users to share posts, like, comment, and engage with trending topics. Built with **React, Firebase, and Tailwind CSS**, this project offers a seamless, real-time experience for users to connect and collaborate.

## ✨ Key Features
- 🔐 **User Authentication** (Signup, Login, Logout with Firebase Auth)
- 📝 **Post Creation** (Text, Image Uploads)
- ❤️ **Like, Comment, and Share** on posts
- 🔍 **Search Functionality** (Find posts by keywords & tags)
- 🚀 **Trending Topics** (Based on most used tags)
- 📡 **Real-time Updates** (Listen for new comments dynamically)
- 🎨 **Modern UI** (Built with Tailwind CSS)
- **Create groups**(Create groups )


## 🛠️ Technologies Used
- **React** (Frontend)
- **Firebase** (Auth, Firestore Database, Storage)
- **Tailwind CSS** (Styling)
- **Netlify** (Hosting & Deployment)

## 📂 Project Structure
```
/src
 ├── components  # Reusable UI components
 ├── contexts    # Auth & data context providers
 ├── firebase    # Firebase configuration
 ├── pages       # Main application pages
 ├──services     
```

### ⚙️ Setup Instructions  

#### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/sakshi1703/Error_404.git
cd vite-project
```

#### 2️⃣ Install Dependencies  
```bash
npm install
```

#### 3️⃣ Set Up Firebase  
1. Go to [Firebase Console](https://console.firebase.google.com/)  
2. Create a new project & enable:  
   - **Authentication** (Email/Password)  
   - **Realtime Database** (Set rules)  
   - **Storage** (For image uploads)  
3. Copy your Firebase config keys & create a `.env` file in the root directory:  
```plaintext
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_DATABASE_URL=your_database_url
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

#### 4️⃣ Start the Development Server  
```bash
npm run dev
```
The app will run locally. Check the terminal output for the URL.

#### 5️⃣ Deploy to Netlify  
1. Run the build command:  
   ```bash
   npm run build
   ```  
2. Upload the `/dist` folder to [Netlify]([https://app.netlify.com](https://tiny-brioche-c77d15.netlify.app/)/)  
OR  
   - Link your GitHub repository to Netlify for automatic deployment.  

```






