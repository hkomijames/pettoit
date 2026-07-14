import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { auth, db } from "./firebase";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying your email...");
  const navigate = useNavigate();
  
  // Track processed codes to completely guard against React double-invocations
  const processedCodes = useRef(new Set());

  useEffect(() => {
    const oobCode = searchParams.get("oobCode");
    const mode = searchParams.get("mode");

    if (!mode || !oobCode) return;
    if (processedCodes.current.has(oobCode)) return;

    if (mode === "verifyEmail" || mode === "verifyAndChangeEmail") {
      processedCodes.current.add(oobCode);

      const processVerification = async () => {
        try {
          // 1. Inspect the code metadata to get the new email address before applying it
          const actionCodeInfo = await checkActionCode(auth, oobCode);
          const updatedEmail = actionCodeInfo.data.email;

          // 2. Finalize the email swap on Firebase Auth
          await applyActionCode(auth, oobCode);
          setStatus("✅ Success! Your email is verified.");

          // 3. Update Firestore independently using the email string from the token metadata
          if (updatedEmail) {
            const petsRef = collection(db, "pets");
            // Find the correct document matching the new verified email address
            const q = query(petsRef, where("email", "==", updatedEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const targetDoc = querySnapshot.docs[0];
              const username = targetDoc.data().username;

              // Update the document to ensure syncing is structurally complete
              await updateDoc(doc(db, "pets", targetDoc.id), { email: updatedEmail });

              setTimeout(() => {
                if (username) {
                  navigate(`/profile/${username}`);
                } else {
                  navigate("/login");
                }
              }, 3000);
              return;
            }
          }

          // Fallback redirect path if user profile document matching email wasn't indexed yet
          setStatus("✅ Verified! Please log into your account with your new email.");
          setTimeout(() => navigate("/login"), 3000);

        } catch (error) {
          console.error("Verification Error:", error.code || error.message);
          setStatus("❌ Invalid or expired link. Please try resending the email.");
        }
      };

      processVerification();
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
