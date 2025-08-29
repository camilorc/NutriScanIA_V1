import React from 'react';

interface HeaderProps {
    language: 'es' | 'en';
    setLanguage: (lang: 'es' | 'en') => void;
}

export const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
  return (
    <header className="w-full bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          <span className="text-green-600">Nutri</span>Scan AI
        </h1>
        <div className="relative">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'es' | 'en')}
                className="appearance-none bg-transparent border border-gray-300 rounded-md py-1 pl-3 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Select language"
            >
                <option value="es">🇪🇸 Español</option>
                <option value="en">🇺🇸 English</option>
            </select>
        </div>
      </div>
    </header>
  );
};