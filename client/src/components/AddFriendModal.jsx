import React, { useEffect, useState, useContext } from "react";
import { apiFetch } from "../lib/api";
import { X } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

// Modal Component
const AddFriendModal = ({ onClose, onFriendAdded }) => {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("invite"); // 'invite', 'requests'

  // Access socket from context
  const { socket } = useContext(AuthContext);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/invitations/list");
      setPending(data.sent || []);
      setReceived(data.received || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvitations();

    if (socket) {
      socket.on("newInvitation", (newInvite) => {
        setReceived(prev => [...prev, newInvite]);
        // Optional: Show toast notification
      });

      socket.on("invitationAccepted", ({ invitationId, accepterId }) => {
        setPending(prev => prev.map(inv => inv._id === invitationId ? { ...inv, status: 'accepted' } : inv));
        if (onFriendAdded) onFriendAdded();
      });

      return () => {
        socket.off("newInvitation");
        socket.off("invitationAccepted");
      };
    }
  }, [socket, onFriendAdded]);

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await apiFetch("/invitations/send", {
        method: "POST",
        body: JSON.stringify({ receiverEmail: email }),
      });
      setEmail("");
      fetchInvitations();
      alert("Invitation sent!");
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  const respond = async (id, accept) => {
    setLoading(true);
    try {
      await apiFetch(`/invitations/${accept ? "accept" : "reject"}`, {
        method: "POST",
        body: JSON.stringify({ invitationId: id }),
      });
      fetchInvitations();
      if (accept && onFriendAdded) onFriendAdded();
    } catch (e) {
      alert(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e24] p-6 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Manage Friends</h2>

        <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("invite")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'invite' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'}`}
          >
            Add Friend
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-2 text-sm font-medium transition-colors ${activeTab === 'requests' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-gray-400 hover:text-white'}`}
          >
            Requests <span className="ml-1 bg-violet-600/20 text-violet-300 px-1.5 rounded-full text-xs">{received.length}</span>
          </button>
        </div>

        {activeTab === "invite" && (
          <div>
            <form onSubmit={sendInvite} className="flex gap-2 mb-6">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter friend's email..."
                className="flex-1 px-4 py-2 rounded-lg bg-[#2b2b36] border border-gray-600 text-white focus:outline-none focus:border-violet-500 transition-colors"
                required
              />
              <button type="submit" className="bg-violet-600 hover:bg-violet-700 transition-colors px-4 py-2 rounded-lg text-white font-medium" disabled={loading}>
                Send
              </button>
            </form>

            <div>
              <h3 className="text-gray-400 text-sm font-semibold mb-3">Sent Invitations</h3>
              {pending.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No pending invitations sent.</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {pending.map(inv => (
                    <li key={inv._id} className="text-sm bg-[#2b2b36] p-3 rounded-lg flex justify-between items-center">
                      <span className="text-gray-300">{inv.receiver?.email || "?"}</span>
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Pending</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            <h3 className="text-gray-400 text-sm font-semibold mb-3">Received Invitations</h3>
            {received.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No new friend requests.</p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {received.map(inv => (
                  <li key={inv._id} className="text-sm bg-[#2b2b36] p-3 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">{inv.sender?.fullName || "User"}</span>
                      <span className="text-xs text-gray-500">{inv.sender?.email}</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => respond(inv._id, true)} className="flex-1 bg-green-600 hover:bg-green-700 transition-colors py-1.5 rounded text-xs text-white font-medium">Accept</button>
                      <button onClick={() => respond(inv._id, false)} className="flex-1 bg-red-600 hover:bg-red-700 transition-colors py-1.5 rounded text-xs text-white font-medium">Reject</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFriendModal;
