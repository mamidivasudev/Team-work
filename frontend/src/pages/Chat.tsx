import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Users, FolderKanban, Hash, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProjects } from '../services/api';
import type { Project } from '../types';
import { MentionInput } from '../components/chat/MentionInput';

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

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  last_message?: string | null;
  last_sender?: string | null;
  last_time?: string | null;
}

const AVATAR_COLORS = ['bg-indigo-500','bg-purple-500','bg-pink-500','bg-blue-500','bg-teal-500','bg-green-500','bg-orange-500'];
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Chat = () => {
  const senderId = parseInt(localStorage.getItem('userId') || '0');
  const senderName = localStorage.getItem('userName') || 'Admin';
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('team');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load rooms
  useEffect(() => {
    fetch(`${API_BASE}/chat/rooms`).then(r => r.json()).then(setRooms).catch(() => {});
    getProjects().then(setProjects);
  }, []);

  // Load message history for active room
  const loadHistory = useCallback(async (room: string) => {
    try {
      const res = await fetch(`${API_BASE}/chat/messages?room=${encodeURIComponent(room)}&limit=100`);
      const data = await res.json();
      setMessages(data);
    } catch {}
  }, []);

  // Connect WebSocket
  useEffect(() => {
    // Close old connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    setMessages([]);
    setConnected(false);

    loadHistory(activeRoom);

    const ws = new WebSocket(`${WS_BASE}/${encodeURIComponent(activeRoom)}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      const msg: ChatMessage = JSON.parse(e.data);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    return () => ws.close();
  }, [activeRoom]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      sender_id: senderId || null,
      sender_name: senderName,
      content: input.trim()
    }));
    setInput('');
    inputRef.current?.focus();
  };

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeRoomInfo = rooms.find(r => r.id === activeRoom);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar — Room List */}
      <div className="w-64 shrink-0 flex flex-col card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Chat Rooms</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Team room */}
          <button
            onClick={() => setActiveRoom('team')}
            className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
              activeRoom === 'team' ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${activeRoom === 'team' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                <Users size={13} className={activeRoom === 'team' ? 'text-indigo-600' : 'text-slate-500'} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${activeRoom === 'team' ? 'text-indigo-700' : 'text-slate-800'}`}>Team Chat</p>
                <p className="text-xs text-slate-400 truncate">Everyone</p>
              </div>
            </div>
          </button>

          {/* Project rooms */}
          {projects.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</p>
            </div>
          )}
          {projects.map(p => {
            const roomId = `project-${p.id}`;
            return (
              <button
                key={roomId}
                onClick={() => setActiveRoom(roomId)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  activeRoom === roomId ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    activeRoom === roomId ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}>
                    <FolderKanban size={13} className={activeRoom === roomId ? 'text-indigo-600' : 'text-slate-500'} />
                  </div>
                  <p className={`text-sm font-semibold truncate ${activeRoom === roomId ? 'text-indigo-700' : 'text-slate-800'}`}>{p.name}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-white shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            activeRoom === 'team' ? 'bg-indigo-100' : 'bg-purple-100'
          }`}>
            {activeRoom === 'team' ? (
              <Users size={15} className="text-indigo-600" />
            ) : (
              <FolderKanban size={15} className="text-purple-600" />
            )}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              {activeRoom === 'team' ? 'Team Chat' : (projects.find(p => `project-${p.id}` === activeRoom)?.name || activeRoom)}
            </p>
            <p className="text-xs text-slate-400">{messages.length} messages</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {connected ? (
              <><Wifi size={13} className="text-green-500" /><span className="text-xs text-green-600 font-medium">Live</span></>
            ) : (
              <><WifiOff size={13} className="text-slate-400" /><span className="text-xs text-slate-400">Connecting...</span></>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                <MessageSquare size={28} className="text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-600">No messages yet</p>
              <p className="text-sm text-slate-400 mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_name === senderName;
              const prevMsg = messages[idx - 1];
              const showAvatar = !prevMsg || prevMsg.sender_name !== msg.sender_name;
              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {!isMe && (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                      showAvatar ? getAvatarColor(msg.sender_name) : 'opacity-0'
                    }`}>
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[65%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {showAvatar && !isMe && (
                      <p className="text-xs font-semibold text-slate-500 mb-1 px-1">{msg.sender_name}</p>
                    )}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}>
                      {renderMessageContent(msg.content)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 px-1">{formatTime(msg.created_at)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
          <MentionInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            placeholder={`Message ${activeRoom === 'team' ? 'everyone' : ''}...`}
            disabled={!connected}
            inputClassName="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            buttonClassName="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shrink-0"
            containerClassName="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
          />
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">Press Enter to send, type @ to tag</p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
