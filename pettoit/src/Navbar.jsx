import { Link } from 'react-router';
import { Menu, X, Home, User } from 'lucide-react';
import { useState } from 'react';
import Notification from "./Notification";

function Navbar({ user, username }) { 
    const [open, setOpen] = useState(false);

    return (
        <nav className="nav lg:rounded-xl relative text-white px-4 lg:w-full lg:mx-auto py-3">
            <div className="flex items-center justify-between menu1">
                {/* hamburger button on small screens */}
                <button
                    className="md:hidden p-2"
                    onClick={() => setOpen(!open)}
                    aria-label="Menu"
                >
                    {open ? <X size={24} /> : <Menu size={24} />}
                </button>

                <Link to="/"><h1 className="flex-1 text-left text-3xl font-bold">Petto<span className="bg-white text-(--sea-green) px-2 ml-1 rounded">it</span></h1></Link>

                <ul className="hidden md:flex gap-4 items-center">
                    <li><Link to="/">
                    <div className='flex flex-col items-center hover:text-gray-300 transition-colors'>
                        <Home size={24} className="cursor-pointer text-[#ffaa01] fill-amber-400" />
                        Home
                        </div>
                        </Link></li>
                    {!user ? (
                        <li><Link to="/register"><button className='register-login-btn h-12 w-auto rounded p-2 cursor-pointer font-bold'>Register/Login</button></Link></li>
                    ) : (
                        <>
                            <li><Link to={`/profile/${username}`}>
                            <div className='flex flex-col items-center hover:text-gray-300 transition-colors'>
                                <User size={24} className="cursor-pointer text-[#ffaa01] fill-amber-400" />
                                Profile
                            </div>
                            </Link></li>
                            <li>
                                <Notification myUid={user?.uid}/>
                                </li>
                            
                            <li className="text-sm font-bold text-blue-400">
                                🐾 {username || "Pet Friend"}
                            </li>
                        </>
                    )}
                </ul>
            </div>

            {/* mobile menu */}
            {open && (
                <div className="md:hidden mt-2 bg-gray-800">
                    <ul className="flex flex-col gap-2 px-2 bg-green-700">
                        <li>
                            <Link to="/" onClick={() => setOpen(false)}>
                                Home
                            </Link>
                        </li>
                        {!user ? (
                            <li>
                                <Link to="/register" onClick={() => setOpen(false)}>
                                    Register/Login
                                </Link>
                            </li>
                        ) : (
                            <>
                                <li>
                                    <Link to={`/profile/${username}`} onClick={() => setOpen(false)}>
                                        Profile
                                    </Link>
                                </li>
                                <li className="text-sm font-bold text-blue-400">
                                    🐾 {username || "Pet Friend"}
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