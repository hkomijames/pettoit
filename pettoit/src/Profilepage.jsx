import { useParams } from "react-router";
import { useState, useEffect } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, orderBy, collection, query, where, getDocs, onSnapshot, getDoc } from "firebase/firestore";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import dogPawPrint from "./assets/dog-paw-print.png";
import cover from "./assets/cover.PNG";
import { useNavigate } from "react-router";
import { validateMediaFile } from "./utils/security";
import FollowerItem from "./Followers";
import { Link } from "react-router";
import FollowButton from "./FollowButton";

/*------------Cover Phot Component Starts-------------*/
const CoverPhoto = ({ coverPhoto, cover }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const { width, height, left, top } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div 
      className="w-full h-60 border-b-4 border-white overflow-hidden cursor-move relative"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={coverPhoto instanceof File ? URL.createObjectURL(coverPhoto) : coverPhoto || cover} 
        alt="cover photo" 
        draggable={false}
        className="object-cover w-full h-full rounded-lg select-none" 
        style={{ objectPosition: `${position.x}% ${position.y}%` }}
      />
    </div>
  );
};

/*------------Cover Phot Component Ends-------------*/

/*-----Profile Tabs Starts-----*/
function ProfileTabs({ 
    profileUid, 
    myUid, 
    myUsername, 
    myProfilePic, 
    userPosts, 
    petName, 
    petType, 
    breed, 
    age, 
    location, 
    bio,
    onFollowerCountChange
}) {

    const [activeTab, setActiveTab] = useState('posts');
    const [followersList, setFollowersList] = useState([]);

    useEffect(() => {
        if (!profileUid) return;

        const followersRef = collection(db, "pets", profileUid, "followers");
        
        const unsubscribe = onSnapshot(followersRef, (snapshot) => {
            const followers = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            setFollowersList(followers);
            
            // Send the count up to the parent card only when database changes
            if (onFollowerCountChange) {
                onFollowerCountChange(followers.length);
            }
        });

        return () => unsubscribe();
    }, [profileUid, onFollowerCountChange]);

    return (
        <div className="tabs md:w-3/4 lg:w-1/2 bg-white shadow-2xl pt-5">
            <div role="tablist" aria-labelledby="tabs-title">
                <button 
                    role="tab" 
                    id="posts-tab"
                    aria-controls="posts-panel"
                    aria-selected={activeTab === 'posts'} 
                    onClick={() => setActiveTab('posts')}
                >Posts</button>
                
                <button 
                    role="tab" 
                    id="about-tab"
                    aria-controls="about-panel"
                    aria-selected={activeTab === 'about'} 
                    onClick={() => setActiveTab('about')}
                >About</button>
                
                <button 
                    role="tab" 
                    id="friends-tab" 
                    aria-controls="followers-panel"
                    aria-selected={activeTab === 'followers'} 
                    onClick={() => setActiveTab('followers')}
                >Followers</button>
            </div>

            <div id="posts-panel" role="tabpanel" aria-labelledby="posts-tab" hidden={activeTab !== 'posts'}>

    {auth.currentUser?.uid === profileUid && <CreatePost />}
    
    {userPosts && userPosts.length > 0 ? (
        userPosts.map((post, index) => (
            
            <PostCard key={post.id} postId={post.id} priority={index < 8} />
        ))
    ) : (
        <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
            <p>No posts to show yet. 🐾</p>
        </div>
    )}
                
            </div>

            <div id="about-panel" role="tabpanel" aria-labelledby="about-tab" hidden={activeTab !== 'about'}>
                <p><strong>Pet Name:</strong> {petName}</p>
                <p><strong>Pet Type:</strong> {petType}</p>
                <p><strong>Breed:</strong> {breed}</p>
                <p><strong>Age:</strong> {age}</p>
                <p><strong>Location:</strong> {location}</p>
                <p><strong>Bio:</strong> {bio}</p>
            </div>

            <div id="followers-panel" role="tabpanel" aria-labelledby="friends-tab" hidden={activeTab !== 'followers'}>
                {followersList.length > 0 ? (
                    <div className="flex flex-col divide-y divide-gray-100">
                        {followersList.map((follower) => (
                            <FollowerItem 
                                key={follower.uid} 
                                follower={follower}
                                myUid={myUid}
                                myUsername={myUsername}
                                myProfilePic={myProfilePic}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 mx-4 mb-4">
                        <p>No followers yet. 🐾</p>
                    </div>
                )}
            </div>
        </div>
    );
}
/*-----Profile Tabs Ends */

function Profilecard({ myUid, myUsername, myProfilePic }) {
    const { username } = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const navigate = useNavigate();

    const [profilePic, setProfilePic] = useState(null);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [petType, setPetType] = useState("");
    const [breed, setBreed] = useState("");
    const [petName, setPetName] = useState("");
    const [age, setAge] = useState("");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [petRegistrationDate, setPetRegistrationDate] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [profileUid, setProfileUid] = useState(null);
    const [editableUsername, setEditableUsername] = useState("");
    const [isVerified, setIsVerified] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [myProfile, setMyProfile] = useState(null);
const [loadingMyProfile, setLoadingMyProfile] = useState(true);
const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
    let timer;
    if (cooldown > 0) {
        timer = setInterval(() => {
            setCooldown((prev) => prev - 1);
        }, 1000);
    }
    return () => clearInterval(timer);
}, [cooldown]);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setIsVerified(user.emailVerified);
        }
    });
    return () => unsubscribe();
}, []);

    useEffect(() => {
    async function fetchProfileAndPosts() {
        try {
            const userQuery = query(
                collection(db, "pets"),
                where("username", "==", username)
            );

            const querySnapshot = await getDocs(userQuery);

            if (querySnapshot.empty) {
                navigate("/404", { replace: true });
                return;
            }

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const data = userDoc.data();
                const uid = userDoc.id;
                const registrationDate = data.createdAt ? data.createdAt.toDate() : null;
                const fullDate = registrationDate 
  ? new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full', 
      timeStyle: 'long', 
    }).format(registrationDate)
  : "No registration date available";

                setProfileUid(uid);

                setProfilePic(data.profilePic || "");
                setCoverPhoto(data.coverPhoto || "");
                setPetName(data.petName || "");
                setPetType(data.petType || "");
                setBreed(data.breed || "");
                setAge(data.age || "");
                setLocation(data.location || "");
                setBio(data.bio || "");
                setEditableUsername(data.username || "");
                setPetRegistrationDate(fullDate);

                const postsQuery = query(
                    collection(db, "posts"),
                    where("author", "==", uid),
                    orderBy("timestamp", "desc")
                );

                const postsSnapshot = await getDocs(postsQuery);

                const postsArray = postsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setUserPosts(postsArray);
            } else {
                console.log("No profile found for username:", username);
            }

        } catch (error) {
            console.error("Error fetching public profile: ", error.message);
        }
    }

    if (username) fetchProfileAndPosts();

}, [username]);

    function renderEditForm() {
        return (
            <div className="relative w-full">
            <div className="editForm absolute p-5 rounded-2xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-10/12 bg-white shadow-2xl z-10 flex flex-col gap-2 border-6 border-[#002614]">
                <label className="flex flex-col gap-2">Profile Pic: <input className="border-2 p-1 rounded" type="file" onChange={(e) => setProfilePic(e.target.files[0])} /></label>
                <label className="flex flex-col gap-2">Cover Photo: <input className="border-2 p-1 rounded" type="file" onChange={(e) => setCoverPhoto(e.target.files[0])} /></label>
                <label className="flex flex-col gap-2">Username: <input className="border-2 p-1 rounded" type="text" value={editableUsername} onChange={(e) => setEditableUsername(e.target.value)} /></label>
                <label className="flex flex-col gap-2">Pet Type: <input className="border-2 p-1 rounded" type="text" value={petType} onChange={(e) => setPetType(e.target.value)} /></label>
                <label className="flex flex-col gap-2">Breed: <input className="border-2 p-1 rounded" type="text" value={breed} onChange={(e) => setBreed(e.target.value)} /></label>
                <label className="flex flex-col gap-2">Pet Name: <input className="border-2 p-1 rounded" type="text" value={petName} onChange={(e) => setPetName(e.target.value)} /></label>
                <label className="flex flex-col gap-2">Age: <input className="border-2 p-1 rounded" type="number" value={age} onChange={(e) => setAge(e.target.value)} /></label>
                <label className="flex flex-col gap-2">Location: <input className="border-2 p-1 rounded" type="text" value={location} onChange={(e) => setLocation(e.target.value)} /></label>
                <label className="flex flex-col gap-2">Short Bio: <textarea className="border-2 p-1 rounded" value={bio} onChange={(e) => setBio(e.target.value)} /></label>
        
                <button 
                    className="bg-[#00573F] hover:bg-[#002614] text-white p-1 cursor-pointer rounded" 
                    onClick={handleSaveProfile}
                >
                    Save/Close
                </button>
                </div>
            </div>
        );
    }

    async function handleSaveProfile() {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        if (!currentUser.emailVerified) {
            alert("Please verify your email to update your profile.");
            return;
        }

        const cleanedUsername = editableUsername.toLowerCase().replace(/[^a-z0-9]/g, "");
        
        if (cleanedUsername !== username) {
            const nameCheckQuery = query(
                collection(db, "pets"),
                where("username", "==", cleanedUsername)
            );
            const nameCheckSnap = await getDocs(nameCheckQuery);

            if (!nameCheckSnap.empty) {
                alert("This username is already taken. Please try another one! 🐾");
                return; 
            }
        }

        // Validate and Upload Images
        let profilePicURL = profilePic;
        let coverPhotoURL = coverPhoto;

        if (profilePic && typeof profilePic !== "string") {

            validateMediaFile(profilePic); 
            
            const storageRef = ref(storage, `profilePics/${currentUser.uid}/pic`);
            await uploadBytes(storageRef, profilePic);
            profilePicURL = await getDownloadURL(storageRef);
        }

        // Cover Photo Check
        if (coverPhoto && typeof coverPhoto !== "string") {
            
            validateMediaFile(coverPhoto);
            
            const storageRef = ref(storage, `coverPhotos/${currentUser.uid}/cover`);
            await uploadBytes(storageRef, coverPhoto);
            coverPhotoURL = await getDownloadURL(storageRef);
        }

        const userDocRef = doc(db, "pets", currentUser.uid);
        await setDoc(userDocRef, {
            username: cleanedUsername,
            profilePic: profilePicURL,
            coverPhoto: coverPhotoURL,
            petType,
            breed,
            petName,
            age,
            location,
            bio: bio.trim()
        }, { merge: true });

        setProfilePic(profilePicURL);
        setCoverPhoto(coverPhotoURL);
        setIsEditing(false);

        if (cleanedUsername !== username) {
            navigate(`/profile/${cleanedUsername}`);
        }
    } catch (error) {
        // Catches "Image too large" or "File type not supported"
        console.error("Error updating profile:", error);
        alert(error.message || "Failed to update profile.");
    }
}

useEffect(() => {
    const objectUrl = coverPhoto instanceof File ? URL.createObjectURL(coverPhoto) : null;

    return () => {

        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
}, [coverPhoto]);

useEffect(() => {
    const objectUrl = profilePic instanceof File ? URL.createObjectURL(profilePic) : null;

    return () => {
        
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }
    };
}, [profilePic]);

const handleResendEmail = async () => {
    if (cooldown > 0) return;

    try {
        await sendEmailVerification(auth.currentUser);
        setCooldown(60);
        alert("Verification email resent! Please check your inbox or spam folder.");
    } catch (error) {
        if (error.code === 'auth/too-many-requests') {
            alert("Too many requests. Please wait a moment before trying again.");
        } else {
            alert("Error resending email: " + error.message);
        }
    }
};

useEffect(() => {
  
  if (!auth.currentUser?.uid) return;

  const fetchMyOwnData = async () => {
    try {
      const myDocRef = doc(db, 'pets', auth.currentUser.uid);
      const snapshot = await getDoc(myDocRef);

      if (snapshot.exists()) {
        setMyProfile(snapshot.data());
      }
    } catch (error) {
      console.error("Error fetching personal profile data:", error);
    } finally {
      setLoadingMyProfile(false);
    }
  };

  fetchMyOwnData();
}, [auth.currentUser?.uid]);

const isProfileOwner = auth.currentUser?.uid === profileUid;
const showVerificationPrompt = isProfileOwner && !isVerified;

    return (
        <>
        <div className="profilecard w-full md:w-3/4 lg:w-1/2 p-3 rounded-t-2xl bg-white shadow-2xl flex flex-col items-start gap-1 relative">
            <CoverPhoto coverPhoto={coverPhoto} cover={cover} />
            <div className="profile-info-box relative bottom-10 w-full">
            
            <div className="flex gap-4 m-4">
                <img src={profilePic instanceof File ? URL.createObjectURL(profilePic) : profilePic || dogPawPrint} alt="profile picture" className="object-cover profilePic w-30 h-30 border-white rounded-xl" />
                <div>
                <h2 className="text-xl font-bold text-[#1A365D]">{username}</h2>
                {followerCount !== 0 && (
                <p className="text-md text-[#1A365D]">{followerCount} Followers</p>
            )}

            { /* follow button */ }
 {!loadingMyProfile && auth.currentUser?.uid !== profileUid && (
  <FollowButton 
    myUid={auth.currentUser?.uid}
    targetUid={profileUid}        
    myUsername={myProfile?.username}   
    myProfilePic={myProfile?.profilePic} 
    targetUsername={username} 
    targetProfilePic={profilePic}
    setIsFollowingExternal={setIsFollowing} 
  />
)}
            
            { /* message button */ }
            
{auth.currentUser?.uid !== profileUid && isFollowing && (
    <Link to={`/chat/${username}`}
    className="bg-blue-500 hover:bg-[#1A365D] text-white px-2 py-1 cursor-pointer rounded mt-2 inline-block"
state={{ recipientUid: profileUid }}
>
    Message
</Link>
)}
    
                </div>

            </div>

{petRegistrationDate && (
                <p className="text-md text-[#1A365D] p-4">Joined on {petRegistrationDate}</p>
            )}
            </div>
            

{showVerificationPrompt && (
    <div className="absolute top-50 right-35 z-50 text-center text-green-500 font-bold bg-green-100 p-3 rounded w-1/2 mx-auto my-2 flex flex-col items-center gap-3">
        <p>
            Verification email sent! Please check your inbox and verify your email. 
            Can't find the email? Sometimes our verification links get lost in the Spam folder. 
            Please check your Spam or Junk folder. If it's there, click 'Report not Spam' 
            or 'Mark as Not Junk' to ensure you receive our future updates directly in your inbox.
        </p>
        
        <button 
    onClick={handleResendEmail}
    disabled={cooldown > 0}
    className={`${
        cooldown > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-[#1A365D] cursor-pointer'
    } text-white text-xs py-1.5 px-4 rounded-full transition-all shadow-sm`}
>
    {cooldown > 0 ? `Wait ${cooldown}s to resend` : "Resend Verification Email"}
</button>
    </div>
)}

            {auth.currentUser?.uid === profileUid && !isEditing && (
                <button 
                    className="cursor-pointer border px-6 py-2 rounded-4xl bg-[#ffaa01] hover:bg-[#002614] text-white font-semibold mt-2 absolute bottom-10/12 right-6 transition-all" 
                    onClick={() => setIsEditing(true)}
                >
                    Edit Profile
                </button>
            )}
         
        </div>
        {/* 3. Conditionally render the form */}
        {isEditing && renderEditForm()}
        <ProfileTabs 
    profileUid={profileUid} 
    myUid={myUid}
    myUsername={myUsername}
    myProfilePic={myProfilePic}
    userPosts={userPosts}
    petName={petName}
    petType={petType}
    breed={breed}
    age={age}
    location={location}
    bio={bio}
    onFollowerCountChange={setFollowerCount}
/>
        </>
    );
}

export default Profilecard;
