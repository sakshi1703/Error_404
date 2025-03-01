import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBv-jKlMd92d74Rn4CZNAgoiTxv-oJECKg",
  authDomain: "social-3c1da.firebaseapp.com",
  databaseURL: "https://social-3c1da-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "social-3c1da",
  storageBucket: "social-3c1da.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:1234567890abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export default app;