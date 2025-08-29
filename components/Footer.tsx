import React from 'react';

interface FooterProps {
    t: {
        footer: {
            copy: string;
            disclaimer: string;
        }
    }
}

export const Footer: React.FC<FooterProps> = ({ t }) => {
  return (
    <footer className="w-full bg-gray-100 mt-12 py-6 no-print">
      <div className="container mx-auto px-4 text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} {t.footer.copy}</p>
        <p className="text-sm mt-1">{t.footer.disclaimer}</p>
      </div>
    </footer>
  );
};