import { BrowserRouter, Routes, Route, useLocation } from 'react-router'; // Added useLocation
import './App.css';
import { useEffect, useState, lazy, Suspense } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "./firebase";
import Homepage from './Home';
import ReactGA from 'react-ga4'; 

import Navbar from './Navbar';
import PetLoader from './PetLoader';
import Footer from './Footer';

const LoginBtn = lazy(() => import('./Login'));
const RegistrationForm = lazy(() => import('./Registerform'));
const PostDetail = lazy(() => import('./PostDetail'));
const VerifyEmail = lazy(() => import('./EmailVerification'));
const PageNotFound = lazy(() => import('./404page'));
const Profilecard = lazy(() => import('./Profilepage'));
const AboutContact = lazy(() => import('./AboutContact'));
const Chatpage = lazy(() => import('./Chatpage'));
const Messages = lazy(() => import('./Messages'));
const Settings = lazy(() => import('./AccountSettings'));
const Notification = lazy(() => import('./Notification'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));

// New component to track page views automatically
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({ 
      hitType: "pageview", 
      page: location.pathname + location.search 
    });
  }, [location]);

  return null;
}

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "pets", currentUser.uid); 
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
            setProfilePicture(userDoc.data().profilePic || "");
          }
          setUser(currentUser);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setUsername("");
        setProfilePicture("");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <PetLoader />;

  return (
    <BrowserRouter>
      {/* Put the tracker inside BrowserRouter so it can read the routes */}
      <AnalyticsTracker /> 
      
      <Navbar user={user} username={username} profilepicture={profilePicture} />
      
      <main id="main-content">
      <Suspense fallback={<PetLoader />}>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/login" element={<LoginBtn />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile/:username" element={<Profilecard />} />
          <Route path="/chat/:username" element={<Chatpage />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile/:username/settings" element={<Settings />} />
          <Route path="/about" element={<AboutContact />} />
          <Route path="/notifications" element={<Notification myUid={user ? user.uid : null} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </Suspense>
      </main>
      
      <Footer />
    </BrowserRouter>
  );
}

export default App;
