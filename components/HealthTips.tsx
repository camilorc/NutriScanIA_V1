import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface HealthTipsProps {
    t: {
        tips: {
            title: string;
            list: string[];
        }
    }
}

export const HealthTips: React.FC<HealthTipsProps> = ({ t }) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const tips = t.tips.list;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => (prevIndex + 1) % tips.length);
    }, 10000); // Change tip every 10 seconds

    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 w-full max-w-2xl mx-auto">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon type="lightbulb" className="w-8 h-8 text-blue-500" />
        </div>
        <div className="ml-4">
          <h4 className="font-bold text-blue-800">{t.tips.title}</h4>
          <p className="text-sm text-blue-700">{tips[currentTipIndex]}</p>
        </div>
      </div>
    </div>
  );
};