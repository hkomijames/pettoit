import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For the text data
import { getStorage } from "firebase/storage";   // For the profile pic
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "pettoit.com",
  projectId: "pettoit-1d815",
  storageBucket: "pettoit-1d815.firebasestorage.app",
  messagingSenderId: "581847011717",
  appId: "1:581847011717:web:f0c55b43199a6a90cb34ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export these so you can use them in your components
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
