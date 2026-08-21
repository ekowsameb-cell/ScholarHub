import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Send, Megaphone, MessageSquare } from 'lucide-react';
import { useRealtimeCollection } from '../utils/useRealtimeCollection';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: any;
  type?: string;
}

interface Announcement {
  id: string;
  content: string;
  authorRole: string;
  timestamp: any;
}

export const Messages: React.FC = () => {
  const { currentUser, users } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('');

  const isAdminOrHead = currentUser?.role === 'Admin' || currentUser?.role === 'Headmaster';

  const { data: allMessages } = useRealtimeCollection<Message>('messages');
  const { data: announcements } = useRealtimeCollection<Announcement>('announcements');

  const filteredMessages = allMessages?.filter((msg: Message) =>
    msg.senderId === currentUser?.uid ||
    msg.receiverId === currentUser?.uid ||
    msg.receiverId === 'all'
  ) || [];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedReceiver || !currentUser) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: currentUser.uid,
        receiverId: selectedReceiver,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Make sure you are connected to Firebase.");
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim() || !currentUser || !isAdminOrHead) return;

    try {
      await addDoc(collection(db, 'announcements'), {
        content: newAnnouncement.trim(),
        authorRole: currentUser.role,
        timestamp: serverTimestamp(),
      });
      setNewAnnouncement('');
    } catch (err) {
      console.error("Failed to post announcement:", err);
      alert("Failed to post announcement.");
    }
  };

  return (
    <div className="animate-fade-in dashboard-two-col">
      {/* Messages Column */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <MessageSquare size={20} color="var(--accent-primary)" /> Internal Staff Messages
        </h3>
        
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredMessages.length === 0 ? (
            <p className="text-muted">No messages yet.</p>
          ) : (
            filteredMessages.map((msg: Message) => {
              const isMine = msg.senderId === currentUser?.uid;
              const otherUser = isMine 
                ? users.find(u => u.uid === msg.receiverId)
                : users.find(u => u.uid === msg.senderId);

              return (
                <div key={msg.id} style={{ 
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  background: isMine ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-md)',
                  maxWidth: '80%'
                }}>
                  <div style={{ fontSize: '0.7rem', color: isMine ? '#e0e7ff' : 'var(--text-muted)', marginBottom: '0.2rem' }}>
                    {msg.senderId === 'system' ? 'System Notification' : (isMine ? 'You' : otherUser?.fullName || 'Unknown')}
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{msg.content}</div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentUser?.role === 'Parent' ? (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <p className="text-muted">Parents should use WhatsApp for communication.</p>
                <a href="https://wa.me/123456789" target="_blank" rel="noopener noreferrer" className="btn btn-primary">Open WhatsApp</a>
              </div>
            ) : (
              <>
                <select 
                  className="input-field" 
                  value={selectedReceiver} 
                  onChange={(e) => setSelectedReceiver(e.target.value)}
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  <option value="all">All Users (School‑wide)</option>
                  <option value="">Select Recipient...</option>
                  {users.filter(u => u.uid !== currentUser?.uid && u.role !== 'Parent').map(u => (
                    <option key={u.uid} value={u.uid}>{u.fullName} ({u.role})</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <input 
                    className="input-field" 
                    style={{ flex: 1 }} 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    placeholder="Type your message..." 
                  />
                  <button type="submit" className="btn btn-primary" disabled={!selectedReceiver || !newMessage.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
        </form>
      </div>

      {/* Announcements Column */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Megaphone size={20} color="var(--warning)" /> Global Announcements
        </h3>
        
        {isAdminOrHead && (
          <form onSubmit={handleSendAnnouncement} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
            <input 
              className="input-field" 
              style={{ flex: 1 }} 
              value={newAnnouncement} 
              onChange={(e) => setNewAnnouncement(e.target.value)} 
              placeholder="New announcement..." 
            />
            <button type="submit" className="btn btn-secondary" disabled={!newAnnouncement.trim()}>
              Post
            </button>
          </form>
        )}

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {announcements.length === 0 ? (
            <p className="text-muted">No announcements yet.</p>
          ) : (
            announcements.map((ann: Announcement) => (
              <div key={ann.id} style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--warning)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Posted by {ann.authorRole}
                </div>
                <div style={{ fontSize: '0.9rem' }}>{ann.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
