import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

function EditComment({ commentId, authorId, currentText, onSave, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState(currentText);

    useEffect(() => {
        setText(currentText);
    }, [currentText]);

    const isOwner = auth.currentUser?.uid === authorId;
    if (!isOwner) return null;

    const handleEdit = async (e) => {
      e.preventDefault();
      
      if (!text.trim() || text === currentText) {
          onCancel(); 
          return;
      }

      setLoading(true);
      try {
          
          await updateDoc(doc(db, "comments", commentId), { content: text });
          if (onSave) onSave();
      } catch (error) {
          console.error("Error updating:", error);
          alert("Failed to update comment.");
      } finally {
          setLoading(false);
      }
    };

    return (
        <form onSubmit={handleEdit} className="flex flex-col gap-2 mt-2 w-full">
            <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                className="w-full p-2 border border-gray-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-green-400 outline-none min-h-80px"
            />
            <div className="flex gap-2">
              <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 disabled:opacity-50 cursor-pointer"
              >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : "Save Changes"}
              </button>
              <button 
                  type="button" 
                  onClick={onCancel}
                  className="px-4 py-1 text-gray-500 text-xs font-bold hover:text-gray-700 cursor-pointer"
              >
                  Cancel
              </button>
            </div>
        </form>
    );
}

export default EditComment;
