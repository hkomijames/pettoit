import { useEffect, useState } from 'react';
import { db } from "./firebase";
import { doc, updateDoc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router';
import { Bell, Lock } from 'lucide-react';

const Notification = ({ myUid }) => {
  const [notifications, setNotifications] = useState([]);
  const unreadCount = notifications.filter(n => n.read === false).length;

  useEffect(() => {
    if (!myUid) return;
    
    const q = query(
      collection(db, "pets", myUid, "notifications"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [myUid]);

  const markAsRead = async (notifId) => {
    if (!myUid || !notifId) return;
    try {
      const notifRef = doc(db, "pets", myUid, "notifications", notifId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Guard Clause: If user is not logged in, show an explicit login prompt
  if (!myUid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <Lock size={48} className="text-gray-400 mb-3" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-4 max-w-sm">
          Please log in to view your account notifications.
        </p>
        <Link 
          to="/login" 
          className="bg-[#1A365D] text-white px-5 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="notification-page max-w-2xl mx-auto p-4">
      {/* Page Header */}
      <div className="flex items-center gap-3 border-b pb-4 mb-4">
        <Bell size={28} className="stroke-0 fill-[#1A365D]" />
        <h1 className="text-2xl font-bold text-[#1A365D]">Notifications</h1>
        {unreadCount > 0 && (
          <span className="bg-red-600 text-white rounded-full px-2.5 py-0.5 text-sm font-semibold">
            {unreadCount} New
          </span>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg border shadow-sm divide-y divide-gray-100 max-h-[75vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-4 flex items-center justify-between transition-colors ${
                n.read ? 'bg-transparent' : 'bg-blue-50/50'
              }`}
            >
              <div className="text-sm text-gray-700">
                <Link to={`/profile/${n.fromName}`}>
                  <strong className="text-red-600 hover:underline">@{n.fromName}</strong>
                </Link>
                <span> followed you!</span>
              </div>

              {!n.read && (
                <button 
                  onClick={() => markAsRead(n.id)} 
                  className="ml-4 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded cursor-pointer text-xs font-medium shrink-0 transition-colors"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notification;
