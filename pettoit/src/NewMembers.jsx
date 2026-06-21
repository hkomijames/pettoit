import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { Link } from "react-router";
import dogPawPrint from "./assets/dog-paw-print.png";

const NewPets = () => {
  const [pets, setPets] = useState([]);
  const [profilepic, setProfilePic] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
        try {
            setLoading(true);
            const petsCollection = collection(db, "pets");
            const petsSnapshot = await getDocs(petsCollection);
            setPets(petsSnapshot.docs.map(doc => doc.data()));
            setProfilePic(petsSnapshot.docs.map(doc => doc.data().profilePic) || dogPawPrint);
        } catch (error) {
            console.error("Error fetching pets:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchPets();
  }, []);

  const sortedPets = [...pets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const recentPets = sortedPets.slice(0, 5);

  return (
    <div>
        <hr className="border-dashed border-(--primary-color)"/>
      <h2 className="font-bold text-xl text-white mb-2 text-center bg-(--primary-color) p-2">New Members</h2>
      <hr className="mb-4 border-dashed border-(--primary-color)"/>
      <ul>
        {recentPets.map((pet) => (
            <Link to={`/profile/${pet.username}`} key={pet.uid} className="new-member flex items-center gap-2 border border-gray-700 rounded-lg bg-(--primary-color) p-2 hover:bg-(--gotham-green) transition-colors, mb-2">
                <img src={pet.profilePic || dogPawPrint} alt={`${pet.username}'s profile`} width="50" height="50" className="rounded-full mb-2 bg-amber-50" />
                <div>
                <li className="font-semibold text-lg text-white">@{pet.username}</li>
                <p className="text-sm text-[#ffaa01]">Visit Profile</p>
                </div>
                </Link>
    
          
        ))}
      </ul>
    </div>
  );
};

export default NewPets;