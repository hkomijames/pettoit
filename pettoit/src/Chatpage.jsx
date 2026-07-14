import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { getAuth } from 'firebase/auth';
import { ref, push, onValue, off, serverTimestamp, set, increment, update } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore'; // Added Firestore imports
import { rtdb, db } from './firebase'; // Imported your Firestore 'db' instance

function Chatpage() {
  const navigate = useNavigate();
  const { username } = useParams(); 
  const location = useLocation();
  const auth = getAuth();
  
  const recipientUid = location.state?.recipientUid;
  const currentUserId = auth.currentUser?.uid;
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUserUsername, setCurrentUserUsername] = useState('Anonymous'); // State to store your retrieved username
  const messagesEndRef = useRef(null);

  const chatRoomId = currentUserId && recipientUid 
    ? [currentUserId, recipientUid].sort().join('_') 
    : null;

  // 1. FETCH MY FIRESTORE USERNAME: Look up your custom username string on mount
  useEffect(() => {
    if (!currentUserId) return;

    const fetchMyProfile = async () => {
      try {
        // Pointing to your user document path using your current ID
        const profileDocRef = doc(db, 'pets', currentUserId); 
        const docSnapshot = await getDoc(profileDocRef);

        if (docSnapshot.exists() && docSnapshot.data().username) {
          setCurrentUserUsername(docSnapshot.data().username);
        } else if (auth.currentUser?.displayName) {
          // Fallback option to standard Display Name if username field isn't populated
          setCurrentUserUsername(auth.currentUser.displayName);
        }
      } catch (error) {
        console.error("Error reading Firestore profile configuration data:", error);
      }
    };

    fetchMyProfile();
  }, [currentUserId, auth.currentUser]);

  // 2. LISTEN & CLEAR COUNTER: Sync data streams and clear unread counts on mount
  useEffect(() => {
    if (!chatRoomId || !currentUserId || !recipientUid) return;

    const myInboxItemRef = ref(rtdb, `inbox/${currentUserId}/${recipientUid}`);
    update(myInboxItemRef, { unreadCount: 0 }).catch((err) => 
      console.error("Error updating read state indicator:", err)
    );

    const messagesRef = ref(rtdb, `messages/${chatRoomId}`);
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(loadedMessages);
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef);
  }, [chatRoomId, currentUserId, recipientUid]);

  // 3. AUTO-SCROLL: Snap layout layers down smoothly
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. SEND: Push message text and update the recipient's inbox tracking node
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !chatRoomId || !currentUserId || !recipientUid) return;

    const trimmedMessage = inputText.trim();

    try {
      const messagesRef = ref(rtdb, `messages/${chatRoomId}`);
      await push(messagesRef, {
        text: trimmedMessage,
        senderId: currentUserId,
        timestamp: serverTimestamp() 
      });

      const recipientInboxRef = ref(rtdb, `inbox/${recipientUid}/${currentUserId}`);
      await set(recipientInboxRef, {
        lastMessage: trimmedMessage,
        senderUsername: currentUserUsername,
        senderUid: currentUserId,
        unreadCount: increment(1),
        timestamp: serverTimestamp()
      });

      setInputText(''); 
    } catch (error) {
      console.error("Firebase Database Write Error:", error);
      alert("Failed to send message. Please confirm database permissions.");
    }
  };

  if (!currentUserId || !recipientUid) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500 px-4 text-center">
        <p className="font-medium text-lg">Unable to initiate secure chat connection.</p>
        <p className="text-sm text-gray-400 mt-1">Please return to the profile menu and click the message link button directly.</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-4 px-4 py-2 bg-[#00573F] text-white rounded shadow text-sm hover:bg-[#002614] transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      
      {/* CHAT PAGE HEADER */}
      <header className="flex items-center px-4 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 mr-2 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div>
          <h2 className="font-semibold text-gray-800 text-lg">@{username}</h2>
          <p className="text-xs text-green-500 font-medium flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Online
          </p>
        </div>
      </header>

      {/* MAIN VIEWPORT DISPLAY FOR MESSAGE BUBBLES */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isMe 
                    ? 'bg-[#00573F] text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="break-words leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* FOOTER CONTROLS WITH CHAT INPUT BAR */}
      <footer className="p-4 bg-white border-t border-gray-200 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message @${username}...`}
            className="flex-1 px-4 py-2.5 bg-gray-100 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-[#00573F] text-gray-800 text-sm transition-all"
          />
          <button 
            type="submit"
            className="px-5 py-2.5 bg-[#00573F] hover:bg-[#002614] text-white font-medium rounded-full text-sm transition-colors shadow-sm active:scale-95"
          >
            Send
          </button>
        </form>
      </footer>

    </div>
  );
}

export default Chatpage;
