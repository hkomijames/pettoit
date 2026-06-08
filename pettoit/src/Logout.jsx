import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router";

function LogoutBtn() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error logging out:", error);
            alert("Error: " + error.message);
        }
}

return <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white cursor-pointer py-2 px-4 rounded">Logout</button>
}

export default LogoutBtn;