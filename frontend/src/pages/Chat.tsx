import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Users, FolderKanban, Hash, Wifi, WifiOff, Copy, Edit2, Trash2, Forward, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { editChatMessage, deleteChatMessage, postChatMessage } from '../services/api';
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
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

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
      const data = JSON.parse(e.data);
      if (data.type) {
        if (data.type === 'new') {
           setMessages(prev => {
             if (prev.find(m => m.id === data.message.id)) return prev;
             return [...prev, data.message];
           });
        } else if (data.type === 'edit') {
           setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m));
        } else if (data.type === 'delete') {
           setMessages(prev => prev.filter(m => m.id !== data.message_id));
        } else if (data.type === 'clear') {
           setMessages([]);
        }
      } else {
        const msg: ChatMessage = data;
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    return () => ws.close();
  }, [activeRoom]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    if (editingMessageId) {
      try {
        await editChatMessage(editingMessageId, input);
        setEditingMessageId(null);
        setInput('');
      } catch (e) {
        console.error("Failed to edit message");
      }
      return;
    }

    wsRef.current.send(JSON.stringify({
      sender_id: senderId || null,
      sender_name: senderName,
      content: input.trim()
    }));
    setInput('');
  };

  const handleCopy = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteChatMessage(id);
      } catch (e) {
        console.error("Failed to delete message");
      }
    }
  };

  const handleForward = async (roomId: string) => {
    if (!forwardingMessage) return;
    try {
      await postChatMessage({
        room: roomId,
        sender_id: senderId || null,
        sender_name: senderName,
        content: `*Forwarded from ${activeRoom === 'team' ? 'Team Chat' : projects.find(p => 'project-' + p.id === activeRoom)?.name}:*\n${forwardingMessage.content}`
      });
      setForwardingMessage(null);
    } catch (e) {
      console.error("Failed to forward");
    }
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
      <div className="flex-1 flex flex-col card overflow-hidden relative">
        {copiedId !== null && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-10 animate-in fade-in slide-in-from-top-2">
            Copied to clipboard
          </div>
        )}
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
                <div key={msg.id} className={`group flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
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
                    <div className={`flex items-center gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`px-3.5 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}>
                        {renderMessageContent(msg.content)}
                      </div>
                      <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 rounded-md shadow-sm p-1 ${isMe ? '' : ''}`}>
                        <button onClick={() => handleCopy(msg.id, msg.content)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Copy"><Copy size={12} /></button>
                        <button onClick={() => setForwardingMessage(msg)} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Forward"><Forward size={12} /></button>
                        {isMe && (
                          <>
                            <button onClick={() => { setEditingMessageId(msg.id); setInput(msg.content); }} className="p-1 hover:bg-slate-100 rounded text-slate-500" title="Edit"><Edit2 size={12} /></button>
                            <button onClick={() => handleDelete(msg.id)} className="p-1 hover:bg-red-50 rounded text-red-500" title="Delete"><Trash2 size={12} /></button>
                          </>
                        )}
                      </div>
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
          {editingMessageId && (
            <div className="flex items-center justify-between text-xs text-indigo-600 mb-2 px-1 font-medium bg-indigo-50 p-1.5 rounded">
              <span>Editing message...</span>
              <button onClick={() => { setEditingMessageId(null); setInput(''); }} className="hover:text-indigo-800"><X size={14} /></button>
            </div>
          )}
          <MentionInput
            value={input}
            onChange={setInput}
            onSend={sendMessage}
            placeholder={editingMessageId ? "Edit message..." : `Message ${activeRoom === 'team' ? 'everyone' : ''}...`}
            disabled={!connected}
            inputClassName="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            buttonClassName="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shrink-0"
            containerClassName="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
          />
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">Press Enter to send, type @ to tag</p>
        </div>
      </div>

      {/* Forward Modal */}
      {forwardingMessage && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Forward Message</h3>
              <button onClick={() => setForwardingMessage(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleForward('team')}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Users size={14} /></div>
                <span className="font-medium text-slate-700 text-sm">Team Chat</span>
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleForward(`project-${p.id}`)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><FolderKanban size={14} /></div>
                  <span className="font-medium text-slate-700 text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
