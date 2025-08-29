import React, { useRef } from 'react';
import { Icon } from './Icon';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading: boolean;
  t: {
    uploader: {
        title: string;
        subtitle: string;
        button: string;
    }
  }
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, isLoading, t }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all duration-300"
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg"
          className="hidden"
          disabled={isLoading}
        />
        <div className="flex flex-col items-center text-gray-500">
          <Icon type="upload" className="w-16 h-16 text-gray-400" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">{t.uploader.title}</h2>
          <p className="mt-1 text-sm">{t.uploader.subtitle}</p>
          <button
            className="mt-6 bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {t.uploader.button}
          </button>
        </div>
      </div>
    </div>
  );
};