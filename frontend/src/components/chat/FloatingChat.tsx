import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MentionInput } from './MentionInput';

const WS_BASE = 'ws://localhost:8000/ws/chat';
const API_BASE = 'http://localhost:8000/api';

interface ChatMessage {
  id: number;
  room: string;
  sender_id: number | null;
  sender_name: string;
  content: string;
  created_at: string;
}

const AVATAR_COLORS = ['bg-indigo-500','bg-purple-500','bg-pink-500','bg-blue-500','bg-teal-500','bg-green-500'];
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const FloatingChat = () => {
  const senderId = parseInt(localStorage.getItem('userId') || '0');
  const senderName = localStorage.getItem('userName') || 'Admin';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load history
    fetch(`${API_BASE}/chat/messages?room=team&limit=50`)
      .then(r => r.json())
      .then(setMessages)
      .catch(() => {});

    const ws = new WebSocket(`${WS_BASE}/team`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg: ChatMessage = JSON.parse(e.data);
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (!open) setUnread(u => u + 1);
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\w+|#obs:[\w\s.-]+\.html\/Observation\s\d+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">{part}</span>;
      }
      if (part.startsWith('#obs:')) {
        const fullTag = part.substring(5);
        const slashIndex = fullTag.lastIndexOf('/');
        const filename = fullTag.substring(0, slashIndex);
        const obsId = fullTag.substring(slashIndex + 1);
        const displayName = filename.replace(/_proj\d+\.html/, '');
        return (
          <Link 
            key={i} 
            to={`/observations?doc=${encodeURIComponent(filename)}&obs=${encodeURIComponent(obsId)}`}
            className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded hover:underline inline-flex items-center gap-1"
          >
            #{displayName} <span className="opacity-75 text-[10px]">({obsId})</span>
          </Link>
        );
      }
      return part;
    });
  };

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      sender_id: senderId || null,
      sender_name: senderName,
      content: input.trim()
    }));
    setInput('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Chat panel */}
      {open && (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white shrink-0">
            <Users size={15} />
            <span className="text-sm font-semibold flex-1">Team Chat</span>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-slate-400'}`} />
            <button onClick={() => setOpen(false)} className="hover:bg-indigo-700 p-1 rounded-lg transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-slate-400 text-xs pt-8">No messages yet. Say hello! 👋</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_name === senderName;
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${getAvatarColor(msg.sender_name)}`}>
                        {msg.sender_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <p className="text-[10px] text-slate-500 mb-0.5 px-1">{msg.sender_name}</p>}
                      <div className={`px-3 py-1.5 rounded-2xl text-xs ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-slate-100 shrink-0">
            <MentionInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              placeholder="Type a message..."
              inputClassName="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
              buttonClassName="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors shrink-0"
              containerClassName="relative flex items-center gap-2"
              iconSize={13}
            />
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-13 h-13 w-12 h-12 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center relative hover:scale-105 active:scale-95"
        title="Team Chat"
      >
        {open ? <X size={20} /> : <MessageSquare size={20} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
