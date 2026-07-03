import { Link } from 'react-router';
import { Menu, X, Home, User, Cat } from 'lucide-react';
import { useState } from 'react';
import Notification from "./Notification";
import dogPawPrint from './assets/dog-paw-print.png';

function Navbar({ user, username, profilepicture }) { 
    const [open, setOpen] = useState(false);

    return (
        <nav className="nav relative text-white px-4 lg:w-full lg:mx-auto py-3">
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
                <svg xmlns="http://w3.org" viewBox="0 0 100 100" class="logo-paw-print">
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
          
                <ul className="hidden md:flex gap-4 items-center">
                    <li><Link to="/">
                    <div className='flex flex-col text-[#1A365D] text-lg font-bold items-center'>
                        <Home size={26} className="cursor-pointer stroke-0 fill-[#1A365D]" />
                        Home
                        </div>
                        </Link></li>
                    {!user ? (
                        <li><Link to="/register"><button className='register-login-btn h-12 w-auto rounded p-2 cursor-pointer font-bold'>Register/Login</button></Link></li>
                    ) : (
                        <>
                            <li><Link to={`/profile/${username}`}>
                            <div className='flex flex-col items-center text-lg text-[#1A365D] font-bold'>
                                <Cat size={26} className="cursor-pointer stroke-0 fill-[#1A365D]" />
                                Profile
                            </div>
                            </Link></li>
                            <li>
                                <Notification myUid={user?.uid}/>
                                </li>
                            
                            <li className="text-sm font-bold text-blue-400">
                                <img src={profilepicture || dogPawPrint} className="w-10 h-10 rounded-full object-cover"
                                 alt={username} />
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