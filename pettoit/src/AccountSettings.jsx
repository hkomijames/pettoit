import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { collection, query, where, getDocs } from "firebase/firestore";
import { verifyBeforeUpdateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "./firebase";
import LogoutBtn from "./Logout";
import PasswordToggle from "./PasswordToggle";

function Settings() {
    const { username } = useParams();
    const [profileUid, setProfileUid] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form inputs state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Visibility toggle state
    const [showPasswords, setShowPasswords] = useState(false);

    // Field-specific validation states
    const [errors, setErrors] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

    // Global feedback states
    const [statusMessage, setStatusMessage] = useState({ text: "", isError: false });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (!username) {
            setLoading(false);
            return;
        }
        const fetchProfileUid = async () => {
            try {
                setLoading(true);
                const petsRef = collection(db, "pets");
                const q = query(petsRef, where("username", "==", username));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const targetDoc = querySnapshot.docs[0];
                    setProfileUid(targetDoc.id);
                } else {
                    console.error("No pet profile found with that username.");
                }
            } catch (error) {
                console.error("Error looking up profile UID:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileUid();
    }, [username]);

    // Real-time validation checks ONLY if a new password field is utilized
    useEffect(() => {
        const newErrors = { currentPassword: "", newPassword: "", confirmPassword: "" };

        if (newPassword.trim() !== "") {
            if (newPassword.length < 6) {
                newErrors.newPassword = "Password must be at least 6 characters.";
            }
            if (newPassword !== confirmPassword && confirmPassword.trim() !== "") {
                newErrors.confirmPassword = "Passwords do not match.";
            }
        }
        setErrors(newErrors);
    }, [newPassword, confirmPassword]);

    const isProfileOwner = auth.currentUser?.uid === profileUid;

    const reauthenticate = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error("No authenticated user found.");
        if (!currentPassword) throw new Error("Current password is required.");

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
    };

    const handleAccountUpdate = async (e) => {
        e.preventDefault();
        setStatusMessage({ text: "", isError: false });

        const isUpdatingEmail = newEmail.trim() !== "";
        const isUpdatingPassword = newPassword.trim() !== "";

        // Reject submission if neither choice has input values
        if (!isUpdatingEmail && !isUpdatingPassword) {
            setStatusMessage({ text: "Please provide a new email or a new password to update.", isError: true });
            return;
        }

        // Only enforce internal password validation if a password change is active
        if (isUpdatingPassword && (errors.newPassword || errors.confirmPassword || !confirmPassword)) {
            setStatusMessage({ text: "Please fix the password validation errors below.", isError: true });
            return;
        }

        setActionLoading(true);
        let trackingMessage = "";

        try {
            const user = auth.currentUser;

            // Security gate re-authentication step
            await reauthenticate();

            // Run process independently based on inputs provided
            if (isUpdatingEmail) {
                const actionCodeSettings = {
                    url: "https://pettoit.com",
                    handleCodeInApp: true,
                };
                await verifyBeforeUpdateEmail(user, newEmail.trim(), actionCodeSettings);
                trackingMessage += "✉️ A confirmation link has been sent to your new email inbox. Please verify it to complete the swap. ";
            }

            if (isUpdatingPassword) {
                await updatePassword(user, newPassword.trim());
                trackingMessage += "🔒 Your account password was updated successfully. ";
            }

            setStatusMessage({ text: trackingMessage, isError: false });

            // Flush out clear states on completion
            setCurrentPassword("");
            setNewEmail("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error) {
            console.error("Update error:", error);
            let userFriendlyMessage = error.message;

            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                userFriendlyMessage = "The current password you entered is incorrect.";
                setErrors(prev => ({ ...prev, currentPassword: "Incorrect password." }));
            } else if (error.code === 'auth/invalid-email') {
                userFriendlyMessage = "Please enter a valid email address.";
            } else if (error.code === 'auth/email-already-in-use') {
                userFriendlyMessage = "This email is already in use.";
            }
            setStatusMessage({ text: userFriendlyMessage, isError: true });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Loading settings...</div>;
    if (!isProfileOwner) return <div className="p-4 text-red-500 font-bold">Access Denied.</div>;

    const inputClass = (hasError) => `w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 transition duration-150 ${hasError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200" }`;

        return (
        <div className="settings-container max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-6">
            <h2 className="text-2xl font-bold mb-6 text-[#1A365D]">Account Settings</h2>
            
            <form onSubmit={handleAccountUpdate} className="space-y-4 mb-6">
                {statusMessage.text && (
                    <div className={`p-3 rounded text-sm font-semibold ${statusMessage.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {statusMessage.text}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password (Required)
                    </label>
                    <input 
                        type={showPasswords ? "text" : "password"} 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass(!!errors.currentPassword)}
                        required
                    />
                    {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
                </div>

                <hr className="my-4 border-gray-200" />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Email Address
                    </label>
                    <input 
                        type="email" 
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="newemail@example.com"
                        className={inputClass(false)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                    </label>
                    <input 
                        type={showPasswords ? "text" : "password"} 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass(!!errors.newPassword)}
                    />
                    {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                    </label>
                    <input 
                        type={showPasswords ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass(!!errors.confirmPassword)}
                        required={newPassword.trim() !== ""}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Password visibility toggle container */}
                <div className="bg-[#1A365D] p-2.5 rounded flex items-center justify-start mt-2">
                    <PasswordToggle 
                        isChecked={showPasswords} 
                        onToggle={() => setShowPasswords(!showPasswords)} 
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="w-full bg-blue-500 hover:bg-[#1A365D] text-white font-medium py-2 px-4 rounded transition duration-200 disabled:opacity-50"
                >
                    {actionLoading ? "Saving Changes..." : "Update Credentials"}
                </button>
            </form>

            <div className="flex justify-between items-center bg-gray-50 p-4 rounded">
                <span className="text-sm text-gray-600">Finished managing your account?</span>
                <LogoutBtn />
            </div>
        </div> 
    );
}

export default Settings;
