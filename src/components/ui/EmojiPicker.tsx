'use client';

import React, { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

const COMMON_EMOJIS = [
  '🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥨', '🥯', '🥖', '🥐',
  '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟',
  '🥪', '🥙', '🧆', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜',
  '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘',
  '🍥', '🥠', '🥟', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰',
  '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍪', '🌰', '🥜', '🍯',
  '🥛', '🍼', '☕', '🫖', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺',
  '🍷', '🍸', '🍹', '🧉', '🍾', '🥂', '🥃', '🍻', '🍽️', '🍴',
  '🥄', '🔪', '🏺', '🌶️', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚',
  '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡',
  '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🧁',
  '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵',
  '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤',
  '🧃', '🧋', '🍯', '🥜', '🌰', '🍪', '🍩', '🍰', '🎂', '🧁',
  '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵'
];

export function EmojiPicker({ value, onChange, onClose, className = '' }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Filter emojis based on search term
  const filteredEmojis = COMMON_EMOJIS.filter(emoji => 
    emoji.includes(searchTerm) || searchTerm === ''
  );

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close picker on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className={`absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${className}`}
      style={{ minWidth: '300px', maxHeight: '400px' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Select Emoji</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <input
        type="text"
        placeholder="Search emojis..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
        autoFocus
      />
      
      <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onChange(emoji);
              onClose();
            }}
            className={`w-8 h-8 text-lg rounded hover:bg-gray-100 transition-colors ${
              value === emoji ? 'bg-green-100 border-2 border-green-500' : ''
            }`}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
      
      {filteredEmojis.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No emojis found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
