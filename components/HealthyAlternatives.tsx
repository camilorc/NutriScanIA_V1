import React from 'react';
import { Icon } from './Icon';
import type { HealthyAlternative } from '../types';

interface HealthyAlternativesProps {
  alternatives: HealthyAlternative[];
  t: any;
}

export const HealthyAlternatives: React.FC<HealthyAlternativesProps> = ({ alternatives, t }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
        <Icon type="leaf" className="w-6 h-6 mr-2 text-green-600" />
        {t.alternatives.title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alternatives.map((alt, index) => (
          <div key={index} className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-bold text-green-800">{alt.name}</h4>
            <p className="text-sm text-green-700 mt-1">{alt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};