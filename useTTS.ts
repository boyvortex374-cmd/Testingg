import { useState, useEffect, useCallback, useRef } from 'react';
import { Language } from '../types';
import { generateSpeech } from '../services/geminiService';
import { decodeAudioData } from '../utils/audio';

export const useTTS = (lang: Language) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentRequestId = useRef(0);

  useEffect(() => {
    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text || !audioContextRef.current) return;

    cancel(); 
    
    const requestId = ++currentRequestId.current;
    setIsLoading(true);

    try {
      // 'Kore' is a good general purpose female voice
      const voiceName = 'Kore'; 

      // Generate speech (this hits the cache in geminiService if pre-fetched)
      const base64Audio = await generateSpeech(text, voiceName);

      // Check if a new request came in while we were awaiting
      if (currentRequestId.current !== requestId) return;

      if (!base64Audio) {
        console.warn("No audio data received from Gemini TTS");
        setIsLoading(false);
        return;
      }

      // Ensure context is running (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current);
      
      // Double check request ID after decoding
      if (currentRequestId.current !== requestId) return;

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        if (currentRequestId.current === requestId) {
          setIsSpeaking(false);
        }
        sourceRef.current = null;
      };

      sourceRef.current = source;
      source.start();
      setIsSpeaking(true);

    } catch (error) {
      console.error("TTS Playback Error:", error);
    } finally {
      if (currentRequestId.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [cancel]);

  return { speak, cancel, isSpeaking, isLoading, supported: true };
};