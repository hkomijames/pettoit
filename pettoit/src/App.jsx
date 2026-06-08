import { BrowserRouter, Routes, Route } from 'react-router'; // Removed Navigate (unused)
import './App.css';
import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";

// Components that load immediately (Global UI)
import Navbar from './Navbar';
import PetLoader from './PetLoader';

// LAZY IMPORTS: These only download when the user visits the specific URL
const Homepage = lazy(() => import('./Home'));
const LoginBtn = lazy(() => import('./Login'));
const RegistrationForm = lazy(() => import('./Registerform'));
const PostDetail = lazy(() => import('./PostDetail'));
const VerifyEmail = lazy(() => import('./EmailVerification'));
const PageNotFound = lazy(() => import('./404page'));
const EmbedVideo = lazy(() => import('./EmbedVideo'));
const Profilecard = lazy(() => import('./Profilepage'));

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "pets", currentUser.uid); 
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
          setUser(currentUser);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setUsername("");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <PetLoader />;

  return (
    <BrowserRouter>
      <Navbar user={user} username={username} />
      
      {/* 
        Wrap all Routes in one Suspense. 
        Vite will now only fetch the JS for the specific page being viewed.
      */}
      <Suspense fallback={<PetLoader />}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/login" element={<LoginBtn />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/embed/:postId" element={<EmbedVideo />} />
          <Route path="/profile/:username" element={<Profilecard />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
