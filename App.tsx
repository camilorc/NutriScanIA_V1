import React, { useState, useCallback } from 'react';
import type { AnalysisResult, MealPlan, UserProfile } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ImageUploader } from './components/ImageUploader';
import { Loader } from './components/Loader';
import { AnalysisResult as AnalysisResultComponent } from './components/AnalysisResult';
import { HealthTips } from './components/HealthTips';
import { TextAnalyzer } from './components/TextAnalyzer';
import { ClarificationPrompt } from './components/ClarificationPrompt';
import { MealPlannerModal } from './components/MealPlannerModal';
import { MealPlanResult } from './components/MealPlanResult';
import { analyzeImage, analyzeText, analyzeImageWithContext, generateMealPlan } from './services/geminiService';
import { translations } from './translations';

const App: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
    const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'es' | 'en'>('es');

    const t = translations[language];

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageSelect = useCallback(async (file: File) => {
        handleReset();
        setIsLoading(true);
        setImageUrl(URL.createObjectURL(file));
        try {
            const b64Image = await fileToBase64(file);
            setBase64Image(b64Image);
            const result = await analyzeImage(b64Image, language);
            
            if (result.needsClarification && result.clarificationQuestion) {
                setClarificationQuestion(result.clarificationQuestion);
                setIsLoading(false);
            } else if (result.totalCalories !== undefined) {
                setAnalysisResult(result);
                setBase64Image(null);
                setIsLoading(false);
            } else {
                 throw new Error(t.error.apiFormat);
            }
        } catch (err) {
            handleError(err);
        }
    }, [language, t]);

    const handleClarificationSubmit = useCallback(async (context: string) => {
        if (!base64Image) {
            setError(t.error.imageNotFound);
            return;
        }
        setIsLoading(true);
        setError(null);
        setClarificationQuestion(null);
        try {
            const result = await analyzeImageWithContext(base64Image, context, language);
            setAnalysisResult(result);
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
            setBase64Image(null);
        }
    }, [base64Image, language, t]);

    const handleTextSubmit = useCallback(async (description: string) => {
        handleReset();
        setIsLoading(true);
        try {
            const result = await analyzeText(description, language);
            setAnalysisResult(result);
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    }, [language, t]);
    
    const handleGeneratePlan = useCallback(async (profile: UserProfile) => {
        handleReset();
        setIsLoading(true);
        setIsPlannerModalOpen(false);
        try {
            const plan = await generateMealPlan(profile, language);
            setMealPlan(plan);
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    }, [language, t]);

    const handleError = (err: unknown) => {
        if (err instanceof Error) {
            setError(`${t.error.analysis}: ${err.message}`);
        } else {
            setError(t.error.unexpected);
        }
        setIsLoading(false);
        setBase64Image(null);
    }
    
    const handleReset = () => {
        setAnalysisResult(null);
        setImageUrl(null);
        setError(null);
        setIsLoading(false);
        setClarificationQuestion(null);
        setBase64Image(null);
        setMealPlan(null);
    }

    const renderContent = () => {
        if (clarificationQuestion && imageUrl) {
            return <ClarificationPrompt t={t} question={clarificationQuestion} imageUrl={imageUrl} onSubmit={handleClarificationSubmit} isLoading={isLoading} />;
        }
        if (isLoading) {
            return <Loader t={t} />;
        }
        if (error) {
            return (
                <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    <h3 className="font-bold">{t.error.oops}</h3>
                    <p>{error}</p>
                    <button onClick={handleReset} className="mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">{t.tryAgain}</button>
                </div>
            );
        }
        if (analysisResult) {
            return (
                <div>
                    <AnalysisResultComponent t={t} result={analysisResult} imageUrl={imageUrl} />
                     <div className="text-center mt-8 space-x-4 no-print">
                        <button onClick={handleReset} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg">{t.analyzeAnother}</button>
                        <button onClick={() => setIsPlannerModalOpen(true)} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg">{t.createMealPlan}</button>
                    </div>
                </div>
            );
        }
        if (mealPlan) {
            return (
                <div>
                    <MealPlanResult t={t} mealPlan={mealPlan} />
                     <div className="text-center mt-8 space-x-4 no-print">
                        <button onClick={handleReset} className="bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg">{t.backToHome}</button>
                        <button onClick={() => setIsPlannerModalOpen(true)} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg">{t.createNewPlan}</button>
                    </div>
                </div>
            )
        }
        return (
            <>
                <ImageUploader t={t} onImageSelect={handleImageSelect} isLoading={isLoading} />
                <div className="my-6 flex items-center justify-center max-w-2xl mx-auto">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500 font-semibold">{t.or}</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <TextAnalyzer t={t} onTextSubmit={handleTextSubmit} isLoading={isLoading} />
                 <div className="text-center mt-8">
                    <button onClick={() => setIsPlannerModalOpen(true)} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-lg">
                        {t.createCustomPlan}
                    </button>
                </div>
                <HealthTips t={t} />
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
            <Header language={language} setLanguage={setLanguage} />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="w-full max-w-4xl mx-auto">
                   {renderContent()}
                </div>
            </main>
            <Footer t={t} />
            <MealPlannerModal 
                t={t}
                isOpen={isPlannerModalOpen} 
                onClose={() => setIsPlannerModalOpen(false)}
                onSubmit={handleGeneratePlan}
                isLoading={isLoading}
            />
        </div>
    );
};

export default App;