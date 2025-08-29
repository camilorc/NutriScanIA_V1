import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { AnalysisResult, UserProfile, MealPlan } from '../types';
import { HealthLevel } from '../types';
import { translations } from "../translations";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        needsClarification: {
            type: Type.BOOLEAN,
            description: "Es true si la imagen es ambigua y necesitas una descripción del usuario. Es false si es clara."
        },
        clarificationQuestion: {
            type: Type.STRING,
            description: "Si needsClarification es true, esta es la pregunta que se le debe hacer al usuario para aclarar qué es la comida."
        },
        totalCalories: { type: Type.INTEGER, description: "Calorías totales estimadas para todo el plato." },
        healthLevel: {
            type: Type.STRING,
            description: "Clasificación de cuán saludable es el plato. Debe ser uno de: 'Saludable', 'Moderado', 'Poco Saludable'.",
            enum: [HealthLevel.Healthy, HealthLevel.Moderate, HealthLevel.Unhealthy]
        },
        ingredients: {
            type: Type.ARRAY,
            description: "Una lista de los ingredientes principales identificados en el plato.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Nombre del ingrediente." },
                    calories: { type: Type.INTEGER, description: "Calorías estimadas para este ingrediente." },
                    nutrients: {
                        type: Type.ARRAY,
                        description: "Nutrientes clave (Proteína, Carbohidratos, Grasa).",
                        items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } } }
                    },
                    vitamins: {
                        type: Type.ARRAY,
                        description: "Vitaminas clave (ej. Vitamina C, D, A).",
                        items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } } }
                    },
                    minerals: {
                        type: Type.ARRAY,
                        description: "Minerales clave (ej. Hierro, Calcio, Potasio).",
                        items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } } }
                    },
                    fattyAcids: {
                        type: Type.ARRAY,
                        description: "Ácidos grasos clave (ej. Omega-3).",
                        items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } } }
                    }
                },
                required: ["name", "calories", "nutrients", "vitamins", "minerals", "fattyAcids"]
            }
        },
        recommendation: { type: Type.STRING, description: "Una recomendación breve y útil sobre el plato o un consejo de salud general relacionado." },
        healthyAlternatives: {
            type: Type.ARRAY,
            description: "Una lista de 3-4 alternativas de comidas más saludables con una breve descripción.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["name", "description"]
            }
        }
    }
};

const commonAnalysisConfig = {
    responseMimeType: "application/json",
    responseSchema: analysisSchema,
    temperature: 0.2
};

const parseResponse = <T>(response: GenerateContentResponse): T => {
    const jsonText = response.text.trim();
    if (!jsonText) {
        throw new Error("La API devolvió una respuesta vacía.");
    }
    try {
        return JSON.parse(jsonText) as T;
    } catch (e) {
        console.error("Error al parsear JSON:", jsonText);
        throw new Error("La respuesta de la API no es un JSON válido.");
    }
};

const sanitizeAnalysisResult = (result: AnalysisResult): AnalysisResult => {
    if (result.clarificationQuestion && typeof result.clarificationQuestion !== 'string') {
        result.clarificationQuestion = String(result.clarificationQuestion);
    }
    if (result.recommendation && typeof result.recommendation !== 'string') {
        result.recommendation = String(result.recommendation);
    }

    const healthLevelMap: { [key: string]: HealthLevel } = {
        "Healthy": HealthLevel.Healthy,
        "Moderate": HealthLevel.Moderate,
        "Unhealthy": HealthLevel.Unhealthy,
    };
    
    if (result.healthLevel && healthLevelMap[result.healthLevel]) {
        result.healthLevel = healthLevelMap[result.healthLevel];
    }
    
    return result;
};

const getAnalysisPrompt = (language: 'es' | 'en', context?: { type: 'image_with_context' | 'text', value: string }): string => {
    const langPrompts = {
        es: {
            expert: "Eres un experto nutricionista.",
            analyze: "Analiza la imagen de esta comida.",
            ambiguous: `1. Primero, determina si puedes identificar la comida con seguridad.
2. Si la imagen es ambigua, responde con: {"needsClarification": true, "clarificationQuestion": "¿Podrías describir qué es este plato?"}. Adapta la pregunta si tienes alguna idea.
3. Si la imagen es clara, realiza un análisis completo incluyendo análisis nutricional detallado (vitaminas, minerales, ácidos grasos). El campo 'needsClarification' debe ser false.`,
            context: (userContext: string) => `Analiza la imagen de esta comida, con la aclaración del usuario: "${userContext}". Realiza un análisis completo incluyendo análisis nutricional detallado (vitaminas, minerales, ácidos grasos).`,
            text: (foodDescription: string) => `Analiza la descripción: "${foodDescription}". Realiza un análisis completo incluyendo análisis nutricional detallado (vitaminas, minerales, ácidos grasos). Asume que la descripción es clara y realiza el análisis directamente. El campo 'needsClarification' debe ser false.`,
            json: "Devuelve exclusivamente el objeto JSON."
        },
        en: {
            expert: "You are an expert nutritionist.",
            analyze: "Analyze the image of this meal.",
            ambiguous: `1. First, determine if you can identify the food with certainty.
2. If the image is ambiguous, respond with: {"needsClarification": true, "clarificationQuestion": "Could you describe what this dish is?"}. Adapt the question if you have some idea.
3. If the image is clear, perform a complete analysis including detailed nutritional analysis (vitamins, minerals, fatty acids). The 'needsClarification' field must be false.`,
            context: (userContext: string) => `Analyze the image of this meal, with the user's clarification: "${userContext}". Perform a complete analysis including detailed nutritional analysis (vitamins, minerals, fatty acids).`,
            text: (foodDescription: string) => `Analyze the description: "${foodDescription}". Perform a complete analysis including detailed nutritional analysis (vitamins, minerals, fatty acids). Assume the description is clear and perform the analysis directly. The 'needsClarification' field must be false.`,
            json: "Return only the JSON object."
        }
    };
    const t = langPrompts[language];

    if (!context) {
        return `${t.expert} ${t.analyze}\n${t.ambiguous}\n${t.json}`;
    }

    if (context.type === 'image_with_context') {
        return `${t.expert} ${t.context(context.value)}\n${t.json}`;
    }

    // context.type === 'text'
    return `${t.expert} ${t.text(context.value)}\n${t.json}`;
};


export const analyzeImage = async (base64Image: string, language: 'es' | 'en'): Promise<AnalysisResult> => {
    try {
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
        const textPart = { text: getAnalysisPrompt(language) };
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] }, config: commonAnalysisConfig });
        const result = parseResponse<AnalysisResult>(response);
        return sanitizeAnalysisResult(result);
    } catch (error) {
        console.error("Error analyzing image:", error);
        if (error instanceof Error) throw new Error(`API Error: ${error.message}`);
        throw new Error("Unknown error contacting API.");
    }
};

export const analyzeImageWithContext = async (base64Image: string, context: string, language: 'es' | 'en'): Promise<AnalysisResult> => {
    try {
        const imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
        const textPart = { text: getAnalysisPrompt(language, { type: 'image_with_context', value: context }) };
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] }, config: commonAnalysisConfig });
        const result = parseResponse<AnalysisResult>(response);
        if (result.needsClarification || result.totalCalories === undefined) {
             throw new Error("Analysis with context failed.");
        }
        return sanitizeAnalysisResult(result);
    } catch (error) {
        console.error("Error analyzing image with context:", error);
        if (error instanceof Error) throw new Error(`API Error: ${error.message}`);
        throw new Error("Unknown error contacting API.");
    }
};

export const analyzeText = async (foodDescription: string, language: 'es' | 'en'): Promise<AnalysisResult> => {
    try {
        const prompt = getAnalysisPrompt(language, { type: 'text', value: foodDescription });
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: commonAnalysisConfig });
        const result = parseResponse<AnalysisResult>(response);
        if (result.needsClarification || result.totalCalories === undefined) {
            throw new Error("Text analysis failed.");
        }
        return sanitizeAnalysisResult(result);
    } catch (error) {
        console.error("Error analyzing text:", error);
        if (error instanceof Error) throw new Error(`API Error: ${error.message}`);
        throw new Error("Unknown error contacting API.");
    }
};

const getMealPlanPrompt = (profile: UserProfile, language: 'es' | 'en') => {
    const t = language === 'es' ? {
        expert: "Eres un nutricionista de clase mundial.",
        createPlan: "Crea un plan de comidas detallado para una persona con el siguiente perfil:",
        goal: "Objetivo",
        gender: "Género",
        age: "Edad",
        weight: "Peso",
        height: "Estatura",
        restrictions: "Restricciones/Alergias",
        dislikes: "Ingredientes que no le gustan",
        duration: "Duración del plan",
        notSpecified: "No especificado",
        none: "Ninguna",
        ifInstructions: "**Instrucciones para Ayuno Intermitente:**",
        fastingType: "Tipo de Ayuno",
        ifPrompt: `- Explica brevemente los beneficios de este tipo de ayuno.
- Proporciona un horario claro para el ayuno y la ventana de alimentación.
- Ofrece consejos sobre qué consumir durante el ayuno (agua, té, etc.).
- Las comidas proporcionadas deben ser para la ventana de alimentación.
- Recomienda 3-4 suplementos que podrían ser beneficiosos para esta persona y su objetivo.`,
        generalInstructions: "**Instrucciones Generales:**",
        generalPrompt: `- El plan debe ser equilibrado, delicioso y realista.
- **NO INCLUYAS NINGÚN INGREDIENTE de la lista de Restricciones/Alergias ni de la lista de Ingredientes que no le gustan.**
- Para cada comida (en ambos tipos de planes), proporciona un análisis nutricional detallado incluyendo: calorías, y listas de nutrientes (proteínas, carbohidratos, grasas), vitaminas (ej. Vitamina C, D), minerales (ej. Hierro, Calcio) y ácidos grasos (ej. Omega-3).
- Devuelve exclusivamente un objeto JSON con el formato especificado.`,
    } : {
        expert: "You are a world-class nutritionist.",
        createPlan: "Create a detailed meal plan for a person with the following profile:",
        goal: "Goal",
        gender: "Gender",
        age: "Age",
        weight: "Weight",
        height: "Height",
        restrictions: "Restrictions/Allergies",
        dislikes: "Disliked Ingredients",
        duration: "Plan Duration",
        notSpecified: "Not specified",
        none: "None",
        ifInstructions: "**Instructions for Intermittent Fasting:**",
        fastingType: "Fasting Type",
        ifPrompt: `- Briefly explain the benefits of this type of fasting.
- Provide a clear schedule for fasting and the eating window.
- Offer advice on what to consume during the fast (water, tea, etc.).
- The provided meals should be for the eating window.
- Recommend 3-4 supplements that could be beneficial for this person and their goal.`,
        generalInstructions: "**General Instructions:**",
        generalPrompt: `- The plan should be balanced, delicious, and realistic.
- **DO NOT INCLUDE ANY INGREDIENTS from the Restrictions/Allergies list or the Disliked Ingredients list.**
- For each meal (in both plan types), provide a detailed nutritional analysis including: calories, and lists of nutrients (protein, carbs, fat), vitamins (e.g., Vitamin C, D), minerals (e.g., Iron, Calcium), and fatty acids (e.g., Omega-3).
- Return only the JSON object with the specified format.`,
    };

    const uiT = translations[language];

    const goalMap: { [key: string]: string } = {
        'mantener peso': uiT.modal.goal.maintain,
        'perder peso': uiT.modal.goal.loseWeight,
        'ganar musculo': uiT.modal.goal.gainMuscle,
        'salud general': uiT.modal.goal.general,
        'ayuno intermitente': uiT.modal.goal.if,
    };

    const genderMap: { [key: string]: string } = {
        'masculino': uiT.modal.gender.male,
        'femenino': uiT.modal.gender.female,
        'otro': uiT.modal.gender.other,
    };
    
    const durationMap: { [key: string]: string } = {
        'un dia': uiT.modal.duration.day,
        'una semana': uiT.modal.duration.week,
        'un mes': uiT.modal.duration.month,
    };
    
    const translatedGoal = goalMap[profile.goal];
    const translatedGender = genderMap[profile.gender];
    const translatedDuration = durationMap[profile.planDuration];

    return `${t.expert} ${t.createPlan}
- ${t.goal}: ${translatedGoal}
- ${t.gender}: ${translatedGender}
- ${t.age}: ${profile.age}
- ${t.weight}: ${profile.weight || t.notSpecified} kg
- ${t.height}: ${profile.height || t.notSpecified} cm
- ${t.restrictions}: ${profile.restrictions || t.none}
- ${t.dislikes}: ${profile.dislikes || t.none}
- ${t.duration}: ${translatedDuration}

${profile.goal === 'ayuno intermitente' ? `${t.ifInstructions}
- ${t.fastingType}: ${profile.fastingType}.
${t.ifPrompt}` : ''}

${t.generalInstructions}
${t.generalPrompt}`;
};

const sanitizeMealPlan = (plan: MealPlan): MealPlan => {
    if (typeof plan.title !== 'string') plan.title = String(plan.title || 'Meal Plan');
    if (typeof plan.summary !== 'string') plan.summary = String(plan.summary || '');
    if (plan.fastingProtocol && typeof plan.fastingProtocol !== 'string') {
        plan.fastingProtocol = String(plan.fastingProtocol);
    }
    if (plan.fastingRecommendations && typeof plan.fastingRecommendations !== 'string') {
        plan.fastingRecommendations = String(plan.fastingRecommendations);
    }
    return plan;
};

export const generateMealPlan = async (profile: UserProfile, language: 'es' | 'en'): Promise<MealPlan> => {
    const mealPlanSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            fastingProtocol: { type: Type.STRING, description: "Solo para ayuno. Horario y guía del ayuno." },
            fastingRecommendations: { type: Type.STRING, description: "Solo para ayuno. Consejos para el periodo de ayuno." },
            supplements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Solo para ayuno. Suplementos recomendados." },
            plan: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING },
                        meals: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: ['Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Romper Ayuno', 'Comida', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Break Fast', 'Meal'] },
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    calories: { type: Type.INTEGER },
                                    nutrients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } }, required: ["name", "amount"] } },
                                    vitamins: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } }, required: ["name", "amount"] } },
                                    minerals: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, amount: { type: Type.STRING } }, required: ["name", "amount"] } },
                                },
                                required: ["type", "name", "description", "calories", "nutrients", "vitamins", "minerals"]
                            }
                        }
                    },
                    required: ["day", "meals"]
                }
            }
        },
        required: ["title", "summary", "plan"]
    };

    const prompt = getMealPlanPrompt(profile, language);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: mealPlanSchema,
                temperature: 0.5
            }
        });
        const plan = parseResponse<MealPlan>(response);
        return sanitizeMealPlan(plan);
    } catch (error) {
        console.error("Error generating meal plan:", error);
        if (error instanceof Error) throw new Error(`API Error: ${error.message}`);
        throw new Error("Unknown error contacting API.");
    }
};