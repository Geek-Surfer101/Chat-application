import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const InvitationPanel = ({ onFriendAdded }) => {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(false);

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
  }, []);

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
    <div className="p-4 bg-[#282142] rounded-xl text-white mb-4">
      <h2 className="text-lg font-bold mb-2">Invite a Friend</h2>
      <form onSubmit={sendInvite} className="flex gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter email..."
          className="flex-1 px-2 py-1 rounded text-black"
          required
        />
        <button type="submit" className="bg-violet-600 px-4 py-1 rounded text-white" disabled={loading}>
          Invite
        </button>
      </form>
      <div>
        <h3 className="font-semibold mb-1">Pending Invitations</h3>
        <ul>
          {pending.map(inv => (
            <li key={inv._id} className="mb-1 text-xs">
              To: {inv.receiver?.email || "?"} ({inv.status})
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <h3 className="font-semibold mb-1">Received Invitations</h3>
        <ul>
          {received.map(inv => (
            <li key={inv._id} className="mb-1 text-xs flex items-center gap-2">
              From: {inv.sender?.email || "?"}
              <button onClick={() => respond(inv._id, true)} className="bg-green-600 px-2 py-0.5 rounded text-xs">Accept</button>
              <button onClick={() => respond(inv._id, false)} className="bg-red-600 px-2 py-0.5 rounded text-xs">Reject</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InvitationPanel;
