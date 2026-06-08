import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { useNavigate } from "react-router";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import GoogleLogo from "./assets/Google-Logo.jpg";

function SignInWithGoogle() {
    const navigate = useNavigate();

    const generateUniqueUsername = async (baseName) => {

        const slug = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
        let username = slug;
        let exists = true;
        
        while (exists) {
            const q = query(collection(db, "pets"), where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                exists = false;
            } else {
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
                finalUsername = await generateUniqueUsername(user.displayName || "user");

                await setDoc(userDocRef, {
                    uid: user.uid,
                    displayName: user.displayName,
                    username: finalUsername,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: new Date(),
                });
            } else {
                finalUsername = userDocSnap.data().username;
            }

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