import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { MealPlan, DayPlan, Nutrient } from '../types';
import { Icon } from './Icon';

interface MealPlanResultProps {
  mealPlan: MealPlan;
  t: any;
}

export const MealPlanResult: React.FC<MealPlanResultProps> = ({ mealPlan, t }) => {
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

        pdf.save('NutriScan_Meal_Plan.pdf');
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert(t.error.pdfError || "Could not generate PDF.");
    } finally {
        document.body.classList.remove('pdf-generating');
        setIsDownloading(false);
    }
  };

  const MealNutrients: React.FC<{ nutrients: Nutrient[], vitamins: Nutrient[], minerals: Nutrient[] }> = ({ nutrients, vitamins, minerals }) => (
      <div className="mt-2 text-xs grid grid-cols-3 gap-2">
          <div>
              <h5 className="font-semibold">{t.plan.nutrients}</h5>
              <ul>{nutrients.map(n => <li key={n.name}>{n.name}: {n.amount}</li>)}</ul>
          </div>
          <div>
              <h5 className="font-semibold">{t.plan.vitamins}</h5>
              <ul>{vitamins.map(v => <li key={v.name}>{v.name}: {v.amount}</li>)}</ul>
          </div>
          <div>
              <h5 className="font-semibold">{t.plan.minerals}</h5>
              <ul>{minerals.map(m => <li key={m.name}>{m.name}: {m.amount}</li>)}</ul>
          </div>
      </div>
  )

  const DayAccordion: React.FC<{ dayPlan: DayPlan }> = ({ dayPlan }) => {
      return (
          <div className="border border-gray-200 rounded-lg overflow-hidden break-inside-avoid">
              <div
                  className="w-full flex justify-between items-center p-4 bg-gray-50"
              >
                  <h4 className="font-bold text-lg text-gray-700">{dayPlan.day}</h4>
              </div>
              <div className="p-4 bg-white">
                  <div className="space-y-4">
                      {dayPlan.meals.map((meal, index) => (
                          <div key={index} className="p-3 bg-blue-50 border-l-4 border-blue-300 rounded-r-md">
                              <p className="font-semibold text-blue-800">{meal.type}: <span className="font-bold">{meal.name}</span> ({meal.calories} kcal)</p>
                              <p className="text-sm text-blue-700 mt-1">{meal.description}</p>
                              {meal.nutrients && meal.vitamins && meal.minerals && <MealNutrients nutrients={meal.nutrients} vitamins={meal.vitamins} minerals={meal.minerals} />}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex justify-between items-center no-print">
            <div />
            <button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                <Icon type="download" className="w-5 h-5"/>
                {isDownloading ? t.downloading : t.downloadPdf}
            </button>
        </div>
        <div ref={printableRef}>
            <div className="text-center bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-blue-600">{mealPlan.title}</h2>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto">{mealPlan.summary}</p>
            </div>
            
            {mealPlan.fastingProtocol && (
                 <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t.plan.ifProtocol}</h3>
                    <p className="text-gray-600">{mealPlan.fastingProtocol}</p>
                     {mealPlan.fastingRecommendations && (
                        <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-gray-700">{t.plan.ifTips}</h4>
                            <p className="text-gray-600 text-sm mt-1">{mealPlan.fastingRecommendations}</p>
                        </div>
                     )}
                     {mealPlan.supplements && mealPlan.supplements.length > 0 && (
                         <div className="mt-4 pt-4 border-t">
                            <h4 className="font-semibold text-gray-700">{t.plan.supplements}</h4>
                            <ul className="list-disc list-inside text-gray-600 text-sm mt-1">
                                {mealPlan.supplements.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                     )}
                </div>
            )}

            <div className="space-y-3 mt-6">
                {mealPlan.plan.map((dayPlan, index) => (
                    <DayAccordion key={index} dayPlan={dayPlan} />
                ))}
            </div>
        </div>
    </div>
  );
};