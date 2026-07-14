import { Link } from 'react-router';
import { Menu, X, Home, Cat, MessageSquare, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database'; // Realtime Database hooks (for Messages)
import { query, collection, onSnapshot, where } from 'firebase/firestore'; // Added Firestore hooks
import { db, rtdb } from './firebase'; // Imported Firestore and RTDB instances
import dogPawPrint from './assets/dog-paw-print.png';

function Navbar({ user, username, profilepicture }) {
    const [open, setOpen] = useState(false);
    const [liveUnreadCount, setLiveUnreadCount] = useState(0); // RTDB Messages unread counter
    const [liveNotifCount, setLiveNotifCount] = useState(0);  // Firestore Notifications unread counter

    // 1. LISTEN: Chat Messages unread count (Realtime Database)
    useEffect(() => {
        if (!user?.uid) {
            setLiveUnreadCount(0);
            return;
        }
        const myInboxRef = ref(rtdb, `inbox/${user.uid}`);
        onValue(myInboxRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const total = Object.values(data).reduce((sum, item) => sum + (item.unreadCount || 0), 0);
                setLiveUnreadCount(total);
            } else {
                setLiveUnreadCount(0);
            }
        });
        return () => off(myInboxRef);
    }, [user?.uid]);

    // 2. LISTEN: Lightweight unread notification counter (Firestore)
    useEffect(() => {
        if (!user?.uid) {
            setLiveNotifCount(0);
            return;
        }

        // Listens exclusively to documents where "read" is false
        const notifQuery = query(
            collection(db, "pets", user.uid, "notifications"),
            where("read", "==", false)
        );

        const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
            setLiveNotifCount(snapshot.size);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    return (
        <nav className="nav relative text-white px-4 lg:w-full lg:mx-auto py-3 mb-4 md:mb-0">
            <div className="flex items-center justify-between menu1">
                {/* hamburger button on small screens */}
                <button
                    className="md:hidden p-2"
                    onClick={() => setOpen(!open)}
                    aria-label="Menu"
                >
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>

                <Link to="/">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://w3.org" viewBox="0 0 100 100" className="logo-paw-print w-8 h-8">
                            <g fill="#1A365D">
                                <path d="M50,45 C30,45 25,65 30,78 C33,85 40,88 50,88 C60,88 67,85 70,78 C75,65 70,45 50,45 Z" />
                                <ellipse cx="20" cy="42" rx="7" ry="11" transform="rotate(-20 20 42)" />
                                <ellipse cx="38" cy="25" rx="8" ry="13" transform="rotate(-5 38 25)" />
                                <ellipse cx="62" cy="25" rx="8" ry="13" transform="rotate(5 62 25)" />
                                <ellipse cx="80" cy="42" rx="7" ry="11" transform="rotate(20 80 42)" />
                            </g>
                        </svg>
                        <h1 className="flex-1 text-left text-3xl text-[#1A365D] font-bold">Petto<span className="bg-[#1A365D] text-[#e8e0c0] px-2 ml-1 rounded">it</span></h1>
                    </div>
                </Link>
          
                {/* DESKTOP MENU DISPLAY ITEMS */}
                <ul className="hidden md:flex gap-4 items-center">
                    <li>
                        <Link to="/">
                            <div className='flex flex-col text-[#1A365D] text-lg font-bold items-center'>
                                <Home size={26} className="cursor-pointer stroke-0 fill-[#1A365D]" />
                                Home
                            </div>
                        </Link>
                    </li>
                    {!user ? (
                        <li>
                            <Link to="/register">
                                <button className='register-login-btn h-12 w-auto rounded p-2 cursor-pointer font-bold'>Register/Login</button>
                            </Link>
                        </li>
                    ) : (
                        <>
                            <li>
                                <Link to={`/profile/${username}`}>
                                    <div className='flex flex-col items-center text-lg text-[#1A365D] font-bold'>
                                        <Cat size={26} className="cursor-pointer stroke-0 fill-[#1A365D]" />
                                        Profile
                                    </div>
                                </Link>
                            </li>
                            
                            {/* REFACTERED standalone link to the notifications route */}
                            <li>
                                <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-[#00573F] transition-colors inline-block">
                                    <div className="flex flex-col items-center text-lg text-[#1A365D] font-bold">
                                        <Bell size={26} className="cursor-pointer text-[#1A365D] hover:text-[#00573F] transition-colors" />
                                        Notifications
                                    </div>

                                    {/* Reactive Notification Counter Badge */}
                                    {liveNotifCount > 0 && (
                                        <span className="absolute top-1 right-8 transform translate-x-1/2 -translate-y-1/4 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] px-1.5 font-bold text-white shadow-md animate-pulse">
                                            {liveNotifCount}
                                        </span>
                                    )}
                                </Link>
                            </li>

                            <li>
                                <Link to="/messages" className="relative p-2 text-gray-600 hover:text-[#00573F] transition-colors inline-block">
                                    <div className="flex flex-col items-center text-lg text-[#1A365D] font-bold">
                                        <MessageSquare size={26} className="cursor-pointer text-[#1A365D] hover:text-[#00573F] transition-colors" />
                                        Messages
                                    </div>

                                    {/* Reactive message notification badge bubble */}
                                    {liveUnreadCount > 0 && (
                                        <span className="absolute top-1 right-8 transform translate-x-1/2 -translate-y-1/4 flex h-5 w-5 items-center justify-center rounded-full bg-red-700 text-[10px] p-3 font-bold text-white shadow-md animate-pulse">
                                            {liveUnreadCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                            
                            <li className="text-sm font-bold text-blue-400">
                                <Link to={`/profile/${username}/settings`}>
                                    <img src={profilepicture || dogPawPrint} className="w-10 h-10 rounded-full object-cover" alt={username} />
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* NEW MODERN MOBILE STICKY BOTTOM MENU (Thumb-Friendly Layout) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl flex justify-around items-center py-2 px-2 md:hidden z-50">
                <Link to="/" className="flex flex-col items-center text-xs text-[#1A365D] font-semibold flex-1 py-1">
                    <Home size={22} className="stroke-2 text-[#1A365D]" />
                    <span>Home</span>
                </Link>

                <Link to={user ? "/messages" : "/login"} className="flex flex-col items-center text-xs text-[#1A365D] font-semibold flex-1 py-1 relative">
                    <MessageSquare size={22} className="stroke-2 text-[#1A365D]" />
                    <span>Messages</span>
                    {user && liveUnreadCount > 0 && (
                        <span className="absolute top-0.5 right-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-[9px] font-bold text-white animate-pulse">
                            {liveUnreadCount}
                        </span>
                    )}
                </Link>

                {/* REFACTORED: Sticky Bottom Notification Link */}
                <Link 
                    to={user ? "/notifications" : "/login"} 
                    className="flex flex-col items-center text-xs text-[#1A365D] font-semibold flex-1 py-1 relative"
                >
                    <Bell size={22} className="stroke-2 text-[#1A365D]" />
                    <span>Notifications</span>
                    {user && liveNotifCount > 0 && (
                        <span className="absolute top-0.5 right-4 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white animate-pulse">
                            {liveNotifCount}
                        </span>
                    )}
                </Link>

                <Link to={user ? `/profile/${username}` : "/login"} className="flex flex-col items-center text-xs text-[#1A365D] font-semibold flex-1 py-1">
                    {user ? (
                        <img src={profilepicture || dogPawPrint} className="w-6 h-6 rounded-full object-cover border border-[#1A365D]" alt={username} />
                    ) : (
                        <Cat size={22} className="stroke-2 text-[#1A365D]" />
                    )}
                    <span>Profile</span>
                </Link>
            </div>

            {/* Mobile Hamburger Drawer Menu */}
            {open && (
                <div className="md:hidden mt-2 rounded-lg overflow-hidden shadow-xl animate-fadeIn">
                    <ul className="flex flex-col gap-3 p-4 bg-[#1A365D] text-white font-medium">
                        <li>
                            <Link to="/" onClick={() => setOpen(false)} className="block py-1 hover:text-blue-200 transition-colors">
                                Home
                            </Link>
                        </li>
                        {!user ? (
                            <li>
                                <Link to="/register" onClick={() => setOpen(false)} className="block py-1 hover:text-blue-200 transition-colors">
                                    Register/Login
                                </Link>
                            </li>
                        ) : (
                            <>
                                <li>
                                    <Link to={`/profile/${username}`} onClick={() => setOpen(false)} className="block py-1 hover:text-blue-200 transition-colors">
                                        Profile
                                    </Link>
                                </li>

                                {/* REFACTORED: Hamburger Drawer Notification Route Option */}
                                <li>
                                    <Link to="/notifications" onClick={() => setOpen(false)} className="flex items-center justify-between w-full py-1 hover:text-blue-200 transition-colors">
                                        <span>Notifications</span>
                                        {liveNotifCount > 0 && (
                                            <span className="bg-red-600 text-white font-bold text-xs rounded-full h-5 px-2 flex items-center justify-center animate-pulse">
                                                {liveNotifCount} new
                                            </span>
                                        )}
                                    </Link>
                                </li>
                                
                                <li>
                                    <Link to="/messages" onClick={() => setOpen(false)} className="flex items-center justify-between w-full py-1 hover:text-blue-200 transition-colors">
                                        <span>Messages</span>
                                        {liveUnreadCount > 0 && (
                                            <span className="bg-red-600 text-white font-bold text-xs rounded-full h-5 px-2 flex items-center justify-center animate-pulse">
                                                {liveUnreadCount} new
                                            </span>
                                        )}
                                    </Link>
                                </li>

                                {/* SETTINGS: Mobile Hamburger link placement */}
                                <li>
                                    <Link to={`/profile/${username}/settings`} onClick={() => setOpen(false)} className="block py-1 text-blue-300 hover:text-blue-100 font-semibold transition-colors">
                                        ⚙️ Account Settings
                                    </Link>
                                </li>

                                <hr className="border-gray-600 my-1" />

                                <li className="text-xs font-bold text-gray-300 flex items-center gap-1.5 pt-1">
                                    <span className="inline-block animate-bounce">🐾</span> {username || "Pet Friend"}
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
