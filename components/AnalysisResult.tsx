import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AnalysisResult as AnalysisResultType, Ingredient, Nutrient } from '../types';
import { HealthLevel } from '../types';
import { Icon } from './Icon';
import { HealthyAlternatives } from './HealthyAlternatives';

interface AnalysisResultProps {
  result: AnalysisResultType;
  imageUrl: string | null;
  t: any;
}

const HealthTrafficLight: React.FC<{ level: HealthLevel, t: any }> = ({ level, t }) => {
  const levelStyles = {
    [HealthLevel.Healthy]: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-500',
      icon: <Icon type="check" className="w-6 h-6 text-green-600" />,
      text: t.healthLevels.healthy,
    },
    [HealthLevel.Moderate]: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-500',
      icon: <Icon type="warning" className="w-6 h-6 text-yellow-600" />,
      text: t.healthLevels.moderate,
    },
    [HealthLevel.Unhealthy]: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-500',
      icon: <Icon type="danger" className="w-6 h-6 text-red-600" />,
      text: t.healthLevels.unhealthy,
    },
  };

  const style = levelStyles[level] || levelStyles[HealthLevel.Moderate];

  return (
    <div className={`p-4 rounded-lg flex items-center justify-between border-l-4 ${style.bgColor} ${style.borderColor}`}>
      <div className="flex items-center">
        {style.icon}
        <span className={`ml-3 font-bold text-lg ${style.textColor}`}>{style.text}</span>
      </div>
      <div className="flex space-x-2">
        <div className={`w-4 h-8 rounded ${level === HealthLevel.Healthy ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <div className={`w-4 h-8 rounded ${level === HealthLevel.Moderate ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
        <div className={`w-4 h-8 rounded ${level === HealthLevel.Unhealthy ? 'bg-red-500' : 'bg-gray-300'}`}></div>
      </div>
    </div>
  );
};

const NutrientDetail: React.FC<{ title: string, data: Nutrient[], icon: 'vitamin' | 'mineral' | 'fat' }> = ({ title, data, icon }) => (
  <div>
    <h6 className="text-sm font-semibold text-gray-600 flex items-center"><Icon type={icon} className="w-4 h-4 mr-1"/> {title}</h6>
    <ul className="mt-1 text-xs text-gray-500 list-disc list-inside">
      {data.map((n, i) => <li key={i}>{n.name}: {n.amount}</li>)}
    </ul>
  </div>
);

const IngredientCard: React.FC<{ ingredient: Ingredient, t: any }> = ({ ingredient, t }) => {
    const hasDetails = (ingredient.vitamins?.length > 0 || ingredient.minerals?.length > 0 || ingredient.fattyAcids?.length > 0);

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-gray-800">{ingredient.name}</h4>
                <div className="flex items-center text-orange-500">
                    <Icon type="flame" className="w-4 h-4 mr-1" />
                    <span className="font-semibold">{ingredient.calories} kcal</span>
                </div>
            </div>
            <div className="mt-2">
                <h5 className="text-sm font-semibold text-gray-600">{t.analysis.keyNutrients}:</h5>
                <ul className="mt-1 text-sm text-gray-500 list-disc list-inside">
                    {ingredient.nutrients.slice(0, 3).map((n, i) => (
                        <li key={i}>{n.name}: {n.amount}</li>
                    ))}
                </ul>
            </div>
             {hasDetails && (
                <div className="mt-2">
                    <div className="mt-2 space-y-2 border-t pt-2">
                        {ingredient.vitamins?.length > 0 && <NutrientDetail title={t.analysis.vitamins} data={ingredient.vitamins} icon="vitamin" />}
                        {ingredient.minerals?.length > 0 && <NutrientDetail title={t.analysis.minerals} data={ingredient.minerals} icon="mineral" />}
                        {ingredient.fattyAcids?.length > 0 && <NutrientDetail title={t.analysis.fattyAcids} data={ingredient.fattyAcids} icon="fat" />}
                    </div>
                </div>
            )}
        </div>
    );
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, imageUrl, t }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    if (!printableRef.current || isDownloading) return;
    
    setIsDownloading(true);
    document.body.classList.add('pdf-generating');
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        const content = printableRef.current;
        const canvas = await html2canvas(content, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = position - pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save('NutriScan_Analysis.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(t.error.pdfError || "Could not generate PDF.");
    } finally {
        document.body.classList.remove('pdf-generating');
        setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center no-print">
            <h2 className="text-2xl font-bold text-gray-800">{t.analysis.title}</h2>
            <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                <Icon type="download" className="w-5 h-5"/>
                {isDownloading ? t.downloading : t.downloadPdf}
            </button>
        </div>
        <div ref={printableRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`bg-white p-6 rounded-xl shadow-lg ${!imageUrl ? 'md:col-span-2' : ''}`}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.analysis.summary}</h2>
                    <div className="flex items-center justify-between bg-orange-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center">
                            <Icon type="flame" className="w-8 h-8 text-orange-500" />
                            <span className="ml-3 text-lg font-semibold text-gray-700">{t.analysis.totalCalories}</span>
                        </div>
                        <span className="text-3xl font-bold text-orange-600">{result.totalCalories!} kcal</span>
                    </div>
                    <HealthTrafficLight level={result.healthLevel!} t={t} />
                    <div className="mt-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h3 className="font-bold text-indigo-800">{t.analysis.aiRecommendation}</h3>
                        <p className="mt-1 text-sm text-indigo-700">{result.recommendation!}</p>
                    </div>
                </div>
                {imageUrl && (
                    <div className="flex items-center justify-center">
                        <img src={imageUrl} alt="Comida analizada" className="rounded-xl shadow-lg w-full h-auto max-h-80 object-cover"/>
                    </div>
                )}
            </div>
            
            <div>
                <h3 className="text-xl font-bold text-gray-800 my-4">{t.analysis.ingredientBreakdown}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.ingredients!.map((ing, index) => (
                        <IngredientCard key={index} ingredient={ing} t={t}/>
                    ))}
                </div>
            </div>
            {result.healthyAlternatives && result.healthyAlternatives.length > 0 && (
              <HealthyAlternatives alternatives={result.healthyAlternatives} t={t} />
            )}
        </div>
    </div>
  );
};