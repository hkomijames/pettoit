import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { useNavigate } from "react-router";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import GoogleLogo from "./assets/Google-Logo.jpg";

function SignInWithGoogle() {
    const navigate = useNavigate();

    // Helper to create a clean, unique username
    const generateUniqueUsername = async (baseName) => {
        // 1. Clean the name: lowercase, remove spaces/special chars
        const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
        let username = slug;
        let exists = true;
        
        // 2. Loop until a unique one is found
        while (exists) {
            const q = query(collection(db, "pets"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                exists = false;
            } else {
                // If exists, append 4 random digits and try again
                username = `${slug}${Math.floor(1000 + Math.random() * 9000)}`;
            }
        }
        return username;
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            const userDocRef = doc(db, "pets", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let finalUsername;

            if (!userDocSnap.exists()) {
                // Generate a unique username only for new users
                finalUsername = await generateUniqueUsername(user.displayName || "user");

                await setDoc(userDocRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    username: finalUsername, // Store the unique username
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: new Date(),
                });
            } else {
                // Use existing username if user already exists
                finalUsername = userDocSnap.data().username;
            }

            // Navigate using the unique username
            console.log("Navigating to:", `/profile/${finalUsername}`);
            navigate(`/profile/${finalUsername}`);
        } catch (error) {
            console.error("Error signing in with Google:", error);
        }
    };

    return <button 
    onClick={handleGoogleSignIn} 
    className="bg-white text-black border-2 border-[#002614] p-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-100 cursor-pointer w-fit">
        <img src={GoogleLogo} alt="Google Logo" className="w-24 h-12 object-contain" />
        Sign in with Google
    </button>;
}

export default SignInWithGoogle;