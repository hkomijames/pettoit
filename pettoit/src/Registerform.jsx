import { useState, useRef, useEffect } from "react";
import { db, auth } from "./firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router";
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import PasswordToggle from "./PasswordToggle";
import SignInWithGoogle from "./SignInWithGoogle";
import { Link } from 'react-router';

function RegistrationForm() {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [isChecked, setIsChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [honeypot, setHoneypot] = useState("");
    const formRef = useRef(null);
    const passwordStrengthRef = useRef(null);

    const passwordStrength = (password) => {
        let strenghtScore = 0;
        if (password.length >= 8) strenghtScore++;
        if (/[A-Z]/.test(password)) strenghtScore++;
        if (/[a-z]/.test(password)) strenghtScore++;
        if (/[0-9]/.test(password)) strenghtScore++;
        if (/[!@#$%^&*]/.test(password)) strenghtScore++;

        if (strenghtScore < 5) {
            return 'Weak password';
        }

        return 'Strong password!';
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (honeypot.length > 0) {
            console.log("Bot detected!");
            return;
        }

        const cleanEmail = email.trim(); 
    const cleanUsername = username.trim().toLowerCase();

    const validUsernameRegex = /^[a-z0-9]+$/;

    if (!validUsernameRegex.test(cleanUsername)) {
        alert("Username can only contain letters and numbers (no spaces or symbols).");
        return;
    }

if (passwordStrength(password) !== 'Strong password!') {
    alert('Choose a strong password');
    return;
}
        try {
            setLoading(true);

// --- NEW: CHECK IF USERNAME EXISTS ---
        const petsRef = collection(db, "pets");
        const q = query(petsRef, where("username", "==", cleanUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            alert("This username is already taken. Please choose another one.");
            setLoading(false);
            return;
        }
        // -------------------------------------

        // Proceed with user creation if username is unique

            const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);

            // Send the standard Firebase verification email
            await sendEmailVerification(userCredential.user);

            await setDoc(doc(db, "pets", userCredential.user.uid), { 
                username: cleanUsername,
                email: cleanEmail, 
                uid: userCredential.user.uid,
                createdAt: new Date()
            });

            setUsername(""); setPassword(""); setEmail("");
            e.target.reset();
            navigate(`/profile/${cleanUsername}`);

        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (passwordStrengthRef.current) {
            if (password.length > 0 && passwordStrength(password) === 'Weak password') {
                passwordStrengthRef.current.classList.remove('hidden');
            } else {
                passwordStrengthRef.current.classList.add('hidden');
            }
        }
    }, [password]);

    return (
        <div>
            <div className="flex flex-col items-center gap-4 mt-8">
                <SignInWithGoogle />
            </div>
            <h2 className="registration-form-h2 text-2xl font-bold text-center pt-4">Registration Form</h2>
            <p className="text-center text-white">Already have an account? <Link to="/login"><button className="login-btn">Login</button></Link></p>
            <form ref={formRef} onSubmit={handleSubmit} autoComplete="on" className="flex flex-col lg:w-1/5 justify-center gap-1 lg:mx-auto mt-8 ml-8 mr-8">
   
                <label htmlFor="username" className="text-white">Your Pet's Username</label>
                <input className="border-2 border-[#002614] mb-2 p-1.5" type="text" id="username" name="username" autoComplete="username" placeholder="Choose a username" required value={username} onChange={(e) => setUsername(e.target.value)}/>
                
                <label htmlFor="email" className="text-white">Email</label>
                <input className="border-2 border-[#002614] mb-2 p-1.5" type="email" id="email" name="email" autoComplete="email" placeholder="Enter your email address" required value={email} onChange={(e) => setEmail(e.target.value)}/>

                <label htmlFor="password" className="text-white">Password <span className={`${passwordStrength(password) === 'Weak password' ? 'text-red-500' : 'text-green-200'} font-bold rounded`}>{!password ? '' : passwordStrength(password)}</span></label>
                <p ref={passwordStrengthRef} className="text-sm text-white mb-1 italic">
                    Password must be at least 8 characters long and include capital letters, lowercase letters, numbers, and any of these special characters (!@#$%^&*).
                </p>
                <input className="border-2 mb-2 p-1.5 border-[#002614]" type={isChecked ? "text" : "password"} id="password" name="password" autoComplete="new-password" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                <div 
    aria-hidden="true" 
    style={{ opacity: 0, position: "absolute", top: 0, left: 0, height: 0, width: 0, zIndex: -1 }}
>
    <label htmlFor="confirm_email_address">
        If you are a human, leave this blank
    </label>
    <input 
        type="text" 
        id="confirm_email_address" 
        name="confirm_email_address" 
        tabIndex="-1" 
        autoComplete="off" 
        value={honeypot} 
        onChange={(e) => setHoneypot(e.target.value)}
    />
</div>
                <PasswordToggle isChecked={isChecked} onToggle={() => setIsChecked(!isChecked)} />
                <button 
                    disabled={loading} 
                    className={`${loading ? 'bg-gray-400' : 'bg-(--gotham-green) hover:bg-(--primary-color)'} text-white py-2 px-4 rounded mt-2 cursor-pointer disabled:cursor-not-allowed`} 
                    type="submit"
                >
                    {loading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
}

export default RegistrationForm;
