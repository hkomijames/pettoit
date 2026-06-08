import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { auth, db } from "./firebase"; 
import { applyActionCode } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("Verifying your email...");
    const navigate = useNavigate();
    const isProcessed = useRef(false);

    useEffect(() => {
        if (isProcessed.current) return;

        const oobCode = searchParams.get("oobCode");
        const mode = searchParams.get("mode");

        if (mode === "verifyEmail" && oobCode) {
            isProcessed.current = true;

            applyActionCode(auth, oobCode)
                .then(async () => {
                    setStatus("✅ Success! Your email is verified.");

                    // Get the current user right after verification
                    const user = auth.currentUser;

                    if (user) {
                        await user.reload();
                        await user.getIdToken(true);
                        // Fetch their specific profile from your "pets" collection
                        const userDoc = await getDoc(doc(db, "pets", user.uid));
                        
                        const username = userDoc.exists() ? userDoc.data().username : null;

                        setTimeout(() => {
                            if (username) {
                                navigate(`/profile/${username}`);
                            } else {
                                // If they are logged in but have no username yet, 
                                // it's safer to send them to login or home
                                navigate("/login"); 
                            }
                        }, 3000);
                    } else {
                        // Not logged in in this browser session
                        setTimeout(() => navigate("/login"), 3000);
                    }
                })
                .catch((error) => {
                    console.error("Verification Error:", error.code);
                    setStatus("❌ Invalid or expired link. Please try resending the email.");
                });
        } else {
            setStatus("Invalid request.");
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center">
             <div className="p-8 bg-white shadow-lg rounded-2xl border border-gray-200">
                <h1 className="text-2xl font-bold text-[#00573F]">{status}</h1>
                <p className="mt-4 text-gray-500">Redirecting you shortly...</p>
            </div>
        </div>
    );
}

export default VerifyEmail;
