import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import type { UserProfile } from '../types';

interface MealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profile: UserProfile) => void;
  isLoading: boolean;
  t: any;
}

export const MealPlannerModal: React.FC<MealPlannerModalProps> = ({ isOpen, onClose, onSubmit, isLoading, t }) => {
  const [profile, setProfile] = useState<UserProfile>({
    goal: 'salud general',
    gender: 'femenino',
    age: 30,
    restrictions: '',
    dislikes: '',
    planDuration: 'una semana',
    fastingType: '16:8',
    weight: '',
    height: '',
  });

  const { underweight, normal, overweight, obese } = t.bmi;
  const bmi = useMemo(() => {
    const weight = parseFloat(profile.weight || '0');
    const height = parseFloat(profile.height || '0') / 100;
    if (weight > 0 && height > 0) {
        const bmiValue = weight / (height * height);
        let category = '';
        if (bmiValue < 18.5) category = underweight;
        else if (bmiValue < 25) category = normal;
        else if (bmiValue < 30) category = overweight;
        else category = obese;
        return `${bmiValue.toFixed(1)} (${category})`;
    }
    return null;
  }, [profile.weight, profile.height, underweight, normal, overweight, obese]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: name === 'age' ? parseInt(value, 10) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalProfile: UserProfile = { ...profile };
    if (!profile.weight) delete finalProfile.weight;
    if (!profile.height) delete finalProfile.height;
    onSubmit(finalProfile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-fade-in" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Icon type="calendar" className="w-7 h-7 mr-2 text-blue-600"/>
                {t.modal.title}
              </h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <p className="text-gray-600 mb-6">{t.modal.subtitle}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700">{t.modal.goal.label}</label>
                <select id="goal" name="goal" value={profile.goal} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="salud general">{t.modal.goal.general}</option>
                  <option value="perder peso">{t.modal.goal.loseWeight}</option>
                  <option value="ganar musculo">{t.modal.goal.gainMuscle}</option>
                  <option value="mantener peso">{t.modal.goal.maintain}</option>
                  <option value="ayuno intermitente">{t.modal.goal.if}</option>
                </select>
              </div>
              {profile.goal === 'ayuno intermitente' ? (
                <div>
                  <label htmlFor="fastingType" className="block text-sm font-medium text-gray-700">{t.modal.fastingType.label}</label>
                  <select id="fastingType" name="fastingType" value={profile.fastingType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="16:8">16:8</option>
                    <option value="18:6">18:6</option>
                    <option value="20:4">20:4</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="planDuration" className="block text-sm font-medium text-gray-700">{t.modal.duration.label}</label>
                  <select id="planDuration" name="planDuration" value={profile.planDuration} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    <option value="un dia">{t.modal.duration.day}</option>
                    <option value="una semana">{t.modal.duration.week}</option>
                    <option value="un mes">{t.modal.duration.month}</option>
                  </select>
                </div>
              )}
               <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">{t.modal.gender.label}</label>
                <select id="gender" name="gender" value={profile.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                  <option value="femenino">{t.modal.gender.female}</option>
                  <option value="masculino">{t.modal.gender.male}</option>
                  <option value="otro">{t.modal.gender.other}</option>
                </select>
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">{t.modal.age}</label>
                <input type="number" id="age" name="age" value={profile.age} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
               <div className="md:col-span-1">
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">{t.modal.weight} (kg)</label>
                <input type="number" id="weight" name="weight" value={profile.weight} onChange={handleChange} placeholder={t.modal.optional} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
               <div className="md:col-span-1">
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">{t.modal.height} (cm)</label>
                <input type="number" id="height" name="height" value={profile.height} onChange={handleChange} placeholder={t.modal.optional} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              {bmi && <div className="md:col-span-2 text-sm text-center text-blue-700 bg-blue-50 p-2 rounded-md">{t.modal.bmi}: {bmi}</div>}

              <div className="md:col-span-2">
                <label htmlFor="restrictions" className="block text-sm font-medium text-gray-700">{t.modal.restrictions}</label>
                <input type="text" id="restrictions" name="restrictions" value={profile.restrictions} onChange={handleChange} placeholder={t.modal.restrictionsPlaceholder} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="dislikes" className="block text-sm font-medium text-gray-700">{t.modal.dislikes}</label>
                <input type="text" id="dislikes" name="dislikes" value={profile.dislikes} onChange={handleChange} placeholder={t.modal.dislikesPlaceholder} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
              {isLoading ? t.modal.loading : t.modal.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};