import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { useNavigate } from "react-router";
import PasswordToggle from "./PasswordToggle";
import { doc, getDoc } from "firebase/firestore";
import SignInWithGoogle from "./SignInWithGoogle";
import { Link } from "react-router";

function LoginBtn() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    // Added local state to hold human-friendly error messages
    const [errorMessage, setErrorMessage] = useState("");

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
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(""); // Clear previous errors on a new attempt
        try {
            setLoading(true);
            
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const petDocRef = doc(db, "pets", user.uid);
            const petDocSnap = await getDoc(petDocRef);

            if (petDocSnap.exists()) {
                const petData = petDocSnap.data();
                navigate(`/profile/${petData.username}`);
            } else {
                navigate("/profile/new-pet");
            }

        } catch (error) {
            setLoading(false);
            console.error("Login error:", error);
            
            // Map generic Firebase error schemas to human-readable text
            switch (error.code) {
                case "auth/invalid-email":
                    setErrorMessage("Please enter a valid email address.");
                    break;
                case "auth/user-not-found":
                    setErrorMessage("No account found with this email.");
                    break;
                case "auth/wrong-password":
                case "auth/invalid-credential":
                    setErrorMessage("Incorrect email or password. Please try again.");
                    break;
                case "auth/user-disabled":
                    setErrorMessage("This account has been disabled.");
                    break;
                case "auth/too-many-requests":
                    setErrorMessage("Too many failed attempts. Access temporarily locked.");
                    break;
                default:
                    setErrorMessage("An unexpected error occurred. Please try again.");
            }
        }
    };

    if (loading && !email) {
        return <div className="text-center mt-10 text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-auto mt-5">
            <SignInWithGoogle />
            <h2 className="text-2xl font-bold mb-4 mt-2">Login</h2>
            <form onSubmit={handleSubmit} autoComplete="on" className="w-full max-w-xs">
                {/* Visual anchor banner displaying the mapped text errors safely */}
                {errorMessage && (
                    <div className="mb-4 p-2.5 rounded bg-red-100 border border-red-400 text-red-700 text-sm font-semibold">
                        {errorMessage}
                    </div>
                )}

                <label htmlFor="email" className="text-white">Email</label>
                <input
                    type="email"
                    id="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-2 p-1.5 w-full text-black"
                    required
                    name="email"
                    autoComplete="email"
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
                    name="password"
                    autoComplete="current-password"
                />
                {/* Link to the forgot password route */}
<div className="flex justify-end mb-2">
    <Link to="/forgot-password" className="text-xs text-[#1A365D] hover:underline font-semibold">
        Forgot Password?
    </Link>
</div>
                <PasswordToggle isChecked={isChecked} onToggle={() => setIsChecked(!isChecked)} />
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-(--gotham-green) hover:bg-(--primary-color) text-white py-2 px-4 rounded w-full cursor-pointer disabled:bg-gray-500"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
             <p className="text-black font-bold mt-4">
                Don't have an account? <Link to="/register" className="text-[#1A365D] hover:underline">Register here</Link>
            </p>
        </div>
    );
}

export default LoginBtn;
