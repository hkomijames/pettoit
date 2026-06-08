import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router";
import PasswordToggle from "./PasswordToggle";
import { doc, getDoc } from "firebase/firestore";
import SignInWithGoogle from "./SignInWithGoogle";

function LoginBtn() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    // Set to true initially to check auth state before showing the form
    const [loading, setLoading] = useState(true);

    // --- REDIRECT IF ALREADY LOGGED IN ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const petDocSnap = await getDoc(doc(db, "pets", user.uid));
                    if (petDocSnap.exists()) {
                        navigate(`/profile/${petDocSnap.data().username}`);
                    } else {
                        navigate("/profile/new-pet");
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setLoading(false);
                }
            } else {
                // No user found, allow them to see the login form
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            // 1. Sign in the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Fetch the pet's data from Firestore using their UID
            const petDocRef = doc(db, "pets", user.uid);
            const petDocSnap = await getDoc(petDocRef);

            if (petDocSnap.exists()) {
                const petData = petDocSnap.data();
                // 3. Navigate using the ACTUAL username from the database
                navigate(`/profile/${petData.username}`);
            } else {
                navigate("/profile/new-pet");
            }

        } catch (error) {
            setLoading(false);
            console.error("Login error:", error);
            alert("Login failed: " + error.message);
        }
    };

    // Prevent form flicker while checking session
    if (loading && !email) {
        return <div className="text-center mt-10 text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-auto mt-5">
            <SignInWithGoogle />
            <h2 className="text-2xl font-bold mb-4 mt-2">Login</h2>
            <form onSubmit={handleSubmit} className="w-full max-w-xs">
                <label htmlFor="email" className="text-white">Email</label>
                <input
                    type="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-2 p-1.5 w-full text-black"
                    required
                />
                <label htmlFor="password" className="text-white">Password</label>
                <input
                    type={isChecked ? "text" : "password"}
                    id="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mb-2 p-1.5 w-full text-black"
                    required
                />
                <PasswordToggle isChecked={isChecked} onToggle={() => setIsChecked(!isChecked)} />
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-(--gotham-green) hover:bg-(--primary-color) text-white py-2 px-4 rounded w-full cursor-pointer disabled:bg-gray-500"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}

export default LoginBtn;
