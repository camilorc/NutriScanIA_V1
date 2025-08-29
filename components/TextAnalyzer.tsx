import React, { useState } from 'react';
import { Icon } from './Icon';

interface TextAnalyzerProps {
  onTextSubmit: (description: string) => void;
  isLoading: boolean;
  t: {
    textAnalyzer: {
        placeholder: string;
        button: string;
        ariaLabel: string;
    }
  }
}

export const TextAnalyzer: React.FC<TextAnalyzerProps> = ({ onTextSubmit, isLoading, t }) => {
  const [text, setText] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (text.trim() && !isLoading) {
      onTextSubmit(text.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm focus-within:ring-2 focus-within:ring-green-500 transition-shadow">
        <Icon type="chat" className="w-8 h-8 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.textAnalyzer.placeholder}
          className="flex-grow bg-transparent focus:outline-none text-gray-700 placeholder-gray-500"
          disabled={isLoading}
          aria-label={t.textAnalyzer.ariaLabel}
        />
        <button
          type="submit"
          className="bg-green-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading || !text.trim()}
          aria-label={t.textAnalyzer.button}
        >
          {t.textAnalyzer.button}
        </button>
      </form>
    </div>
  );
};