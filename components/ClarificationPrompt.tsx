import React, { useState } from 'react';

interface ClarificationPromptProps {
  question: string;
  imageUrl: string;
  onSubmit: (context: string) => void;
  isLoading: boolean;
  t: any;
}

export const ClarificationPrompt: React.FC<ClarificationPromptProps> = ({ question, imageUrl, onSubmit, isLoading, t }) => {
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (context.trim() && !isLoading) {
      onSubmit(context.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg animate-fade-in text-center">
      <h2 className="text-xl font-bold text-gray-800">{t.clarification.title}</h2>
      <div className="my-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg text-left">
        <p className="font-semibold text-yellow-800">{t.clarification.aiQuestion}:</p>
        <p className="text-yellow-700">"{question}"</p>
      </div>
      
      <img src={imageUrl} alt={t.clarification.alt} className="rounded-lg shadow-md w-full h-auto max-h-64 object-cover mx-auto mb-4" />
      
      <form onSubmit={handleSubmit}>
        <label htmlFor="clarification-input" className="block text-sm font-medium text-gray-700 mb-2">
          {t.clarification.help}
        </label>
        <input
          id="clarification-input"
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={t.clarification.placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
          aria-label={t.clarification.ariaLabel}
        />
        <button
          type="submit"
          className="mt-4 w-full bg-green-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          aria-label={t.clarification.submit}
        >
          {isLoading ? t.loader.analyzing : t.clarification.submit}
        </button>
      </form>
    </div>
  );
};