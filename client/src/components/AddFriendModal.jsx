import React, { useEffect, useState, useContext, useCallback } from "react";
import { apiFetch } from "../lib/api";
import { X, UserPlus, Check, Clock, AlertCircle } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

// Modal Component
const AddFriendModal = ({ onClose, onFriendAdded }) => {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("invite"); // 'invite', 'requests'
  const [sendingInvite, setSendingInvite] = useState(false);

  // Access socket from context
  const { socket } = useContext(AuthContext);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/invitations/list");
      setPending(data.sent || []);
      setReceived(data.received || []);
    } catch (e) {
      console.error("Error fetching invitations:", e);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();

    if (socket) {
      // Handle new invitation received
      const handleNewInvitation = (newInvite) => {
        setReceived(prev => {
          // Check if already exists
          if (prev.some(inv => inv._id === newInvite._id)) {
            return prev;
          }
          toast.success(`New friend request from ${newInvite.sender?.fullName || 'someone'}`);
          return [...prev, newInvite];
        });
      };

      // Handle invitation accepted
      const handleInvitationAccepted = ({ invitationId, accepterId }) => {
        setPending(prev =>
          prev.map(inv =>
            inv._id === invitationId
              ? { ...inv, status: 'accepted' }
              : inv
          )
        );

        // Remove from pending after short delay
        setTimeout(() => {
          setPending(prev => prev.filter(inv => inv._id !== invitationId));
        }, 3000);

        toast.success("Friend request accepted!");
        if (onFriendAdded) onFriendAdded();
      };

      socket.on("newInvitation", handleNewInvitation);
      socket.on("invitationAccepted", handleInvitationAccepted);

      return () => {
        socket.off("newInvitation", handleNewInvitation);
        socket.off("invitationAccepted", handleInvitationAccepted);
      };
    }
  }, [socket, onFriendAdded, fetchInvitations]);

  const sendInvite = async (e) => {
    e.preventDefault();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSendingInvite(true);
    try {
      const data = await apiFetch("/invitations/send", {
        method: "POST",
        body: JSON.stringify({ receiverEmail: email }),
      });

      if (data.success) {
        toast.success("Invitation sent successfully!");
        setEmail("");
        fetchInvitations(); // Refresh the list
      } else {
        toast.error(data.message || "Failed to send invitation");
      }
    } catch (e) {
      console.error("Error sending invitation:", e);
      toast.error(e.message || "Failed to send invitation. Please try again.");
    } finally {
      setSendingInvite(false);
    }
  };

  const respondToInvitation = async (id, accept) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/invitations/${accept ? "accept" : "reject"}`, {
        method: "POST",
        body: JSON.stringify({ invitationId: id }),
      });

      if (data.success) {
        toast.success(accept ? "Friend request accepted!" : "Friend request rejected");
        fetchInvitations();
        if (accept && onFriendAdded) onFriendAdded();
      } else {
        toast.error(data.message || `Failed to ${accept ? 'accept' : 'reject'} invitation`);
      }
    } catch (e) {
      console.error("Error responding to invitation:", e);
      toast.error(e.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1e1e24] p-6 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-full p-1"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Manage Friends</h2>

        <div className="flex gap-4 mb-6 border-b border-gray-700 pb-2">
          <button
            onClick={() => setActiveTab("invite")}
            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'invite'
                ? 'text-violet-500 border-b-2 border-violet-500'
                : 'text-gray-400 hover:text-white'
              }`}
            aria-label="Add friend tab"
          >
            Add Friend
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === 'requests'
                ? 'text-violet-500 border-b-2 border-violet-500'
                : 'text-gray-400 hover:text-white'
              }`}
            aria-label="Friend requests tab"
          >
            Requests
            {received.length > 0 && (
              <span className="absolute -top-1 -right-4 bg-violet-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {received.length}
              </span>
            )}
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
                className="flex-1 px-4 py-2 rounded-lg bg-[#2b2b36] border border-gray-600 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                required
                disabled={sendingInvite}
                aria-label="Friend's email"
              />
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 transition-colors px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={sendingInvite || !email}
              >
                {sendingInvite ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Send
                  </>
                )}
              </button>
            </form>

            <div>
              <h3 className="text-gray-400 text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock size={16} />
                Sent Invitations
              </h3>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
                </div>
              ) : pending.length === 0 ? (
                <p className="text-gray-500 text-sm italic flex items-center gap-2">
                  <AlertCircle size={14} />
                  No pending invitations sent.
                </p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {pending.map(inv => (
                    <li key={inv._id} className="text-sm bg-[#2b2b36] p-3 rounded-lg flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-gray-300 font-medium">{inv.receiver?.email || "Unknown"}</p>
                        <p className="text-xs text-gray-500">
                          Sent: {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div>
            <h3 className="text-gray-400 text-sm font-semibold mb-3 flex items-center gap-2">
              <UserPlus size={16} />
              Received Invitations
            </h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
              </div>
            ) : received.length === 0 ? (
              <p className="text-gray-500 text-sm italic flex items-center gap-2">
                <AlertCircle size={14} />
                No new friend requests.
              </p>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {received.map(inv => (
                  <li key={inv._id} className="text-sm bg-[#2b2b36] p-3 rounded-lg flex flex-col gap-2 hover:bg-[#32323f] transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-white font-medium block">{inv.sender?.fullName || "User"}</span>
                        <span className="text-xs text-gray-500">{inv.sender?.email}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => respondToInvitation(inv._id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700 transition-colors py-1.5 rounded text-xs text-white font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        disabled={loading}
                      >
                        <Check size={14} />
                        Accept
                      </button>
                      <button
                        onClick={() => respondToInvitation(inv._id, false)}
                        className="flex-1 bg-red-600 hover:bg-red-700 transition-colors py-1.5 rounded text-xs text-white font-medium flex items-center justify-center gap-1 disabled:opacity-50"
                        disabled={loading}
                      >
                        <X size={14} />
                        Reject
                      </button>
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