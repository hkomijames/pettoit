import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ref, onValue, off } from 'firebase/database';
import { rtdb, auth } from './firebase'; // Adjust this path to match your file structure
import { MessageSquare, ArrowLeft } from 'lucide-react';

function Messages() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // Point directly to the logged-in user's personal inbox data directory
    const myInboxRef = ref(rtdb, `inbox/${currentUserId}`);

    // Listen for live updates to the inbox list structure
    onValue(myInboxRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const sortedChats = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        
        // Sort conversations so that the newest message is always at the top
        sortedChats.sort((a, b) => b.timestamp - a.timestamp);
        setChats(sortedChats);
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    // Clean up data listeners when moving away from the screen
    return () => off(myInboxRef);
  }, [currentUserId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 font-medium">Loading your inbox...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-white shadow-sm border-x border-gray-100 flex flex-col">
      
      {/* INBOX HEADER */}
      <header className="flex items-center gap-4 px-4 py-4 border-b border-gray-100 shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#00573F]" />
          Messages
        </h1>
      </header>

      {/* CHATS CONVERSATION LIST */}
      <main className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-2">
            <MessageSquare className="w-12 h-12 text-gray-200" />
            <p className="text-sm">Your inbox is completely empty.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <Link 
                key={chat.id}
                to={`/chat/${chat.senderUsername}`}
                // Passes across the hidden UID so the chat page can calculate room nodes seamlessly
                state={{ recipientUid: chat.senderUid }} 
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-xl group border border-transparent hover:border-gray-100"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold text-gray-900 group-hover:text-[#00573F] transition-colors">
                    @{chat.senderUsername}
                  </p>
                  
                  {/* 🔒 UPDATED: Replaced raw text preview with a generic privacy-safe notification string */}
                  <p className={`text-sm truncate mt-0.5 ${chat.unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    You have messages from @{chat.senderUsername}
                  </p>
                </div>

                {/* Individual Unread Badge indicator */}
                {chat.unreadCount > 0 && (
                  <span className="bg-[#00573F] text-white font-bold text-xs rounded-full min-w-6 h-6 px-1.5 flex items-center justify-center shadow-sm shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

export default Messages;
