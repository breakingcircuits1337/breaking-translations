"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BreakingTranslationsLogo } from '@/components/breakingtranslations/Logo';
import { SpeakerPanel } from '@/components/breakingtranslations/SpeakerPanel';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Languages, Settings, KeyRound } from 'lucide-react';

import { transcribeAudio, type TranscribeAudioInput } from '@/ai/flows/transcribe-audio';
import { translateText, type TranslateTextInput } from '@/ai/flows/translate-text';
import { synthesizeSpeech, type SynthesizeSpeechInput } from '@/ai/flows/synthesize-speech';

import { ENGLISH_VOICES, PORTUGUESE_VOICES, DEFAULT_ENGLISH_VOICE_ID, DEFAULT_PORTUGUESE_VOICE_ID } from '@/lib/elevenlabs-voices';
import { blobToDataURL } from '@/lib/audio-utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


type PanelId = 'pt' | 'en';

export default function BreakingTranslationsClientPage() {
  const { toast } = useToast();

  // State for Panel 1: Portuguese input, English output
  const [isRecordingPt, setIsRecordingPt] = useState(false);
  const [isLoadingPt, setIsLoadingPt] = useState(false);
  const [transcriptionPt, setTranscriptionPt] = useState('');
  const [translationPtToEn, setTranslationPtToEn] = useState('');
  const [synthesizedAudioEn, setSynthesizedAudioEn] = useState<string | null>(null);
  const [selectedEnglishVoice, setSelectedEnglishVoice] = useState(DEFAULT_ENGLISH_VOICE_ID);
  const [errorPt, setErrorPt] = useState<string | null>(null);
  const mediaRecorderPtRef = useRef<MediaRecorder | null>(null);
  const audioChunksPtRef = useRef<Blob[]>([]);

  // State for Panel 2: English input, Portuguese output
  const [isRecordingEn, setIsRecordingEn] = useState(false);
  const [isLoadingEn, setIsLoadingEn] = useState(false);
  const [transcriptionEn, setTranscriptionEn] = useState('');
  const [translationEnToPt, setTranslationEnToPt] = useState('');
  const [synthesizedAudioPt, setSynthesizedAudioPt] = useState<string | null>(null);
  const [selectedPortugueseVoice, setSelectedPortugueseVoice] = useState(DEFAULT_PORTUGUESE_VOICE_ID);
  const [errorEn, setErrorEn] = useState<string | null>(null);
  const mediaRecorderEnRef = useRef<MediaRecorder | null>(null);
  const audioChunksEnRef = useRef<Blob[]>([]);

  // Shared state
  const [includeSlang, setIncludeSlang] = useState(false);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  
  const processAudio = useCallback(async (audioBlob: Blob, inputLang: PanelId) => {
    const setIsLoading = inputLang === 'pt' ? setIsLoadingPt : setIsLoadingEn;
    const setError = inputLang === 'pt' ? setErrorPt : setErrorEn;
    const setTranscription = inputLang === 'pt' ? setTranscriptionPt : setTranscriptionEn;
    const setTranslation = inputLang === 'pt' ? setTranslationPtToEn : setTranslationEnToPt;
    const setSynthesizedAudio = inputLang === 'pt' ? setSynthesizedAudioEn : setSynthesizedAudioPt;
    
    const sourceLanguageCode = inputLang === 'pt' ? 'pt-BR' : 'en-US';
    const targetLanguageCode = inputLang === 'pt' ? 'en' : 'pt';
    const outputVoiceId = inputLang === 'pt' ? selectedEnglishVoice : selectedPortugueseVoice;

    if (!elevenLabsApiKey && !process.env.NEXT_PUBLIC_ELEVEN_LABS_API_KEY) { 
        const msg = "Eleven Labs API Key is not set. Please enter it in the API Key Configuration section.";
        setError(msg);
        toast({
            title: "API Key Missing",
            description: msg,
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);
    setTranscription('');
    setTranslation('');
    setSynthesizedAudio(null);

    try {
      const audioDataUri = await blobToDataURL(audioBlob);

      // 1. Transcribe Audio
      const transcribeInput: TranscribeAudioInput = { audioDataUri, languageCode: sourceLanguageCode as 'pt-BR' | 'en-US' };
      const transcriptionResult = await transcribeAudio(transcribeInput);
      setTranscription(transcriptionResult.transcription);

      if (!transcriptionResult.transcription) {
        throw new Error("Transcription failed or returned empty.");
      }

      // 2. Translate Text
      const translateInput: TranslateTextInput = {
        text: transcriptionResult.transcription,
        sourceLanguage: inputLang,
        targetLanguage: targetLanguageCode as 'en' | 'pt',
        includeSlang,
      };
      const translationResult = await translateText(translateInput);
      setTranslation(translationResult.translation);

      if (!translationResult.translation) {
        throw new Error("Translation failed or returned empty.");
      }

      // 3. Synthesize Speech
      const synthesizeInput: SynthesizeSpeechInput = {
        text: translationResult.translation,
        voiceId: outputVoiceId,
        apiKey: elevenLabsApiKey, 
      };
      const synthesisResult = await synthesizeSpeech(synthesizeInput);
      setSynthesizedAudio(synthesisResult.audioDataUri);

    } catch (err: any) {
      console.error(`Error processing ${inputLang} audio:`, err);
      const errorMessage = err.message || `An error occurred during ${inputLang} processing.`;
      setError(errorMessage);
      toast({
        title: `Error processing ${inputLang.toUpperCase()} audio`,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [includeSlang, selectedEnglishVoice, selectedPortugueseVoice, toast, elevenLabsApiKey]);


  const handleRecordToggle = async (panelId: PanelId) => {
    const isRecording = panelId === 'pt' ? isRecordingPt : isRecordingEn;
    const setIsRecording = panelId === 'pt' ? setIsRecordingPt : setIsRecordingEn;
    const mediaRecorderRef = panelId === 'pt' ? mediaRecorderPtRef : mediaRecorderEnRef;
    const audioChunksRef = panelId === 'pt' ? audioChunksPtRef : audioChunksEnRef;
    const currentErrorSetter = panelId === 'pt' ? setErrorPt : setErrorEn;

    currentErrorSetter(null); // Clear previous errors

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size > 0) {
            await processAudio(audioBlob, panelId);
          } else {
            const msg = "Recording was too short or failed to capture audio.";
            currentErrorSetter(msg);
            toast({ title: "Recording Error", description: msg, variant: "destructive" });
          }
          // Clean up stream tracks
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorderRef.current.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          const msg = "An error occurred with the media recorder.";
          currentErrorSetter(msg);
          toast({ title: "Recorder Error", description: msg, variant: "destructive" });
          setIsRecording(false);
           // Clean up stream tracks
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting recording:", err);
        const msg = "Failed to access microphone. Please check permissions.";
        currentErrorSetter(msg);
        toast({
          title: "Microphone Error",
          description: msg,
          variant: "destructive",
        });
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-background font-sans">
      <header className="w-full max-w-5xl mb-8 text-center">
        <div className="flex items-center justify-center space-x-3">
          <Languages className="h-10 w-10 text-primary" />
          <BreakingTranslationsLogo />
        </div>
        <p className="text-muted-foreground mt-2">Real-time speech translation between Brazilian Portuguese and English.</p>
      </header>

      <Card className="w-full max-w-5xl mb-6 shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <KeyRound className="h-5 w-5 mr-2 text-primary" />
            API Key Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="elevenlabs-api-key" className="mb-1 block text-sm font-medium">
            Eleven Labs API Key
          </Label>
          <Input
            id="elevenlabs-api-key"
            type="password"
            placeholder="Enter your Eleven Labs API Key"
            value={elevenLabsApiKey}
            onChange={(e) => setElevenLabsApiKey(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Used for text-to-speech. Stored in component state, not persisted. For production, use environment variables.
          </p>
        </CardContent>
      </Card>

      <Card className="w-full max-w-5xl mb-6 shadow">
        <CardHeader>
           <CardTitle className="flex items-center text-lg">
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Translation Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="include-slang"
              checked={includeSlang}
              onCheckedChange={setIncludeSlang}
              aria-label="Toggle inclusion of slang and idioms in translation"
            />
            <Label htmlFor="include-slang">Include Slang/Idioms</Label>
          </div>
        </CardContent>
      </Card>

      <main className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <SpeakerPanel
          title="Fale em Português"
          panelId="pt"
          isRecording={isRecordingPt}
          isLoading={isLoadingPt}
          onRecordToggle={() => handleRecordToggle('pt')}
          transcription={transcriptionPt}
          translation={translationPtToEn}
          voices={ENGLISH_VOICES}
          selectedVoice={selectedEnglishVoice}
          onVoiceChange={setSelectedEnglishVoice}
          synthesizedAudioUrl={synthesizedAudioEn}
          error={errorPt}
          actionButtonLabel="Record Portuguese"
          voiceSelectorLabel="English Output Voice"
          transcriptionLabel="Você disse (Português):"
          translationLabel="Tradução (Inglês):"
        />
        <SpeakerPanel
          title="Speak in English"
          panelId="en"
          isRecording={isRecordingEn}
          isLoading={isLoadingEn}
          onRecordToggle={() => handleRecordToggle('en')}
          transcription={transcriptionEn}
          translation={translationEnToPt}
          voices={PORTUGUESE_VOICES}
          selectedVoice={selectedPortugueseVoice}
          onVoiceChange={setSelectedPortugueseVoice}
          synthesizedAudioUrl={synthesizedAudioPt}
          error={errorEn}
          actionButtonLabel="Record English"
          voiceSelectorLabel="Portuguese Output Voice"
          transcriptionLabel="You said (English):"
          translationLabel="Translation (Portuguese):"
        />
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Breaking Translations. Powered by AI.</p>
      </footer>
    </div>
  );
}
