import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion, QuizConfig, Language } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple in-memory cache for TTS audio to avoid re-fetching
const ttsCache = new Map<string, string>();

const getLanguagePrompt = (lang: Language) => {
  switch (lang) {
    case 'hi': return "Respond strictly in Hindi language.";
    case 'ne': return "Respond strictly in Nepali language.";
    default: return "Respond in English.";
  }
};

export const generateQuiz = async (config: QuizConfig, lang: Language): Promise<QuizQuestion[]> => {
  try {
    const langInstruction = getLanguagePrompt(lang);
    const prompt = `Generate 5 multiple-choice questions about "${config.topic}" at a "${config.difficulty}" difficulty level. ${langInstruction}
    Ensure the 'options' and 'explanation' are in the target language. The keys of the JSON object must remain in English.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of 4 possible answers in the target language."
              },
              correctAnswerIndex: {
                type: Type.INTEGER,
                description: "The index (0-3) of the correct answer in the options array."
              },
              explanation: {
                type: Type.STRING,
                description: "A brief explanation of why the answer is correct in the target language."
              }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    throw new Error("No data returned from Gemini");
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};

export const createMysteryGameChat = (lang: Language) => {
  const langInstruction = getLanguagePrompt(lang);
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are the host of a "20 Questions" style guessing game called Mystery Object. 
      ${langInstruction}
      1. Pick a random, common object (e.g., a toaster, the moon, a pencil, a cat). Do NOT reveal it yet.
      2. Briefly describe the object in a cryptic but solvable riddle (max 2 sentences).
      3. The user will try to guess what it is.
      4. If they guess correctly, congratulate them and briefly explain the object, then say "GAME_OVER_WIN".
      5. If they are wrong, give a subtle hint related to their guess.
      6. Keep your responses concise and fun.`,
    },
  });
};

export const createEmojiGameChat = (lang: Language) => {
  const langInstruction = getLanguagePrompt(lang);
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are the host of the "Emoji Cinema" game.
      ${langInstruction}
      1. Pick a very famous movie (global or Bollywood/regional if Hindi/Nepali requested). Do NOT reveal the title.
      2. Output ONLY a string of 3-5 emojis that represent the plot of that movie.
      3. The user will guess the movie title.
      4. If they are correct, say "Correct! It was [Movie Title]. GAME_OVER_WIN".
      5. If they are wrong, give them a text hint about the genre or a lead actor, but do not use the title.
      6. Be encouraging.`,
    },
  });
};

export const createTwoTruthsChat = (lang: Language) => {
  const langInstruction = getLanguagePrompt(lang);
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are the host of 'Two Truths and a Lie'.
      ${langInstruction}
      1. Generate 3 interesting statements about a specific topic (e.g., Biology, Space, History).
      2. Two must be true, one must be false. Do NOT reveal which is which yet.
      3. The user will guess which one is the lie.
      4. If they guess correctly, say "Correct! The lie was [Statement]. [Brief explanation]. GAME_OVER_WIN".
      5. If they are wrong, say "Not quite. That was actually true." and give a hint.`,
    },
  });
};

export const createRiddleChat = (lang: Language) => {
  const langInstruction = getLanguagePrompt(lang);
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are the Riddle Master.
      ${langInstruction}
      1. Present a clever riddle (rhyming if possible).
      2. The user will try to guess the answer.
      3. If they are correct, say "Brilliant! The answer is [Answer]. GAME_OVER_WIN".
      4. If they are wrong, give a subtle hint.
      5. Keep the riddle solvable.`,
    },
  });
};

export const createOddOneOutChat = (lang: Language) => {
  const langInstruction = getLanguagePrompt(lang);
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are the host of 'Odd One Out'.
      ${langInstruction}
      1. Generate a list of 4 items/words. Three share a subtle commonality, one does not. (e.g., Apple, Banana, Carrot, Mango -> Carrot is the odd one).
      2. Output ONLY the list of 4 items.
      3. The user will guess which one is the odd one out.
      4. If they guess correctly, explain why and say "GAME_OVER_WIN".
      5. If they are wrong, give a hint about the common thread of the others.`,
    },
  });
};

export const createCustomGameChat = (lang: Language, customPrompt: string) => {
  const langInstruction = getLanguagePrompt(lang);
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: `You are an AI Game Host. The user wants to play a game described as: "${customPrompt}".
      ${langInstruction}
      1. Adapt your role, personality, and game rules to fit the user's description exactly.
      2. Start the game immediately with an introductory message or the first challenge.
      3. If the user's request is a game with a win condition (like guessing something), append "GAME_OVER_WIN" to your response when they win.
      4. Keep the interaction engaging and immersive.
      5. If the user's prompt is unclear, ask for clarification before starting.`,
    },
  });
};

export const generateSpeech = async (text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string | undefined> => {
  const cacheKey = `${voice}:${text}`;
  if (ttsCache.has(cacheKey)) {
    // Return cached base64 string immediately
    return ttsCache.get(cacheKey);
  }

  try {
    // Gemini TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (data) {
      ttsCache.set(cacheKey, data);
      // Prevent infinite memory growth
      if (ttsCache.size > 50) {
        const firstKey = ttsCache.keys().next().value;
        if (firstKey) ttsCache.delete(firstKey);
      }
    }
    return data;
  } catch (error) {
    console.error("Error generating speech:", error);
    return undefined;
  }
};