import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { getTeam } from '../../services/api';
import type { TeamMember } from '../../types';

interface MentionInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
  inputClassName?: string;
  buttonClassName?: string;
  iconSize?: number;
  hideButton?: boolean;
  containerClassName?: string;
}

export const MentionInput: React.FC<MentionInputProps> = ({
  value, onChange, onSend, placeholder, disabled, inputClassName, buttonClassName, iconSize = 14, hideButton = false, containerClassName = "relative flex-1 flex"
}) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTeam().then(setTeam).catch(console.error);
  }, []);

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(mentionFilter.toLowerCase()) || 
    m.username.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      if (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === ' ') {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        if (!query.includes(' ')) {
          setMentionFilter(query);
          setMentionStartIndex(lastAtIndex);
          setShowMentions(true);
          setSelectedIndex(0);
          return;
        }
      }
    }
    
    setShowMentions(false);
  };

  const insertMention = (member: TeamMember) => {
    if (mentionStartIndex === -1) return;
    
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(inputRef.current?.selectionStart || value.length);
    
    const newText = `${beforeMention}@${member.username} ${afterMention}`;
    onChange(newText);
    setShowMentions(false);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = beforeMention.length + member.username.length + 2;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredTeam.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % filteredTeam.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + filteredTeam.length) % filteredTeam.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredTeam[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    } else if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={containerClassName}>
      {showMentions && filteredTeam.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredTeam.map((m, idx) => (
              <button
                key={m.id}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${idx === selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}
                onClick={() => insertMention(m)}
              >
                <span className="font-medium truncate">{m.name}</span>
                <span className="text-xs opacity-60 ml-2 truncate">@{m.username}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClassName}
        autoComplete="off"
      />
      {!hideButton && (
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={buttonClassName}
        >
          <Send size={iconSize} />
        </button>
      )}
    </div>
  );
};
