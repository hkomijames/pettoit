import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { Link } from "react-router";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ text: "", isError: false });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ text: "", isError: false });
        setLoading(true);

        try {
            // Firebase uses the custom domain template settings under pettoit.com
            const actionCodeSettings = {
                url: "https://pettoit.com", // Redirect point after resetting password
            };
            
            await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
            
            setStatusMessage({
                text: "✉️ A password reset link has been sent to your inbox. Please check your email.",
                isError: false
            });
            setEmail(""); // Clear the input field on success
        } catch (error) {
            console.error("Password reset error:", error);
            
            // Map generic Firebase error schemas to human-readable text
            switch (error.code) {
                case "auth/invalid-email":
                    setStatusMessage({ text: "Please enter a valid email address.", isError: true });
                    break;
                case "auth/user-not-found":
                    setStatusMessage({ text: "No account found with this email.", isError: true });
                    break;
                case "auth/too-many-requests":
                    setStatusMessage({ text: "Too many requests. Please try again later.", isError: true });
                    break;
                default:
                    setStatusMessage({ text: "An error occurred. Please verify your connection and try again.", isError: true });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-auto mt-10">
            <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
            <p className="text-white text-sm max-w-xs text-center mb-4">
                Enter your email address below and we will send you a secure link to reset your account password.
            </p>

            <form onSubmit={handleSubmit} autoComplete="on" className="w-full max-w-xs">
                {statusMessage.text && (
                    <div className={`mb-4 p-2.5 rounded text-sm font-semibold border ${
                        statusMessage.isError 
                            ? "bg-red-100 border-red-400 text-red-700" 
                            : "bg-green-100 border-green-400 text-green-700"
                    }`}>
                        {statusMessage.text}
                    </div>
                )}

                <label htmlFor="reset-email" className="text-white">Email</label>
                <input
                    type="email"
                    id="reset-email"
                    placeholder="your-email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-4 p-1.5 w-full text-black"
                    required
                    name="email"
                    autoComplete="email"
                />

                <button 
                    type="submit" 
                    disabled={loading} 
                    className="bg-(--gotham-green) hover:bg-(--primary-color) text-white py-2 px-4 rounded w-full cursor-pointer disabled:bg-gray-500 transition duration-200"
                >
                    {loading ? "Sending link..." : "Send Reset Link"}
                </button>
            </form>

            <p className="text-black font-bold mt-4">
                Remember your password? <Link to="/login" className="text-[#1A365D] hover:underline">Back to Login</Link>
            </p>
        </div>
    );
}

export default ForgotPassword;
