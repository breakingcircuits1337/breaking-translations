"use client";

import type { FC } from 'react';
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, MicOff, Play, Volume2, AlertCircle } from 'lucide-react';
import type { VoiceOption } from '@/lib/elevenlabs-voices';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SpeakerPanelProps {
  title: string;
  panelId: 'pt' | 'en';
  isRecording: boolean;
  isLoading: boolean;
  onRecordToggle: () => void;
  transcription: string;
  translation: string;
  voices: VoiceOption[];
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  synthesizedAudioUrl: string | null;
  error: string | null;
  actionButtonLabel: string;
  voiceSelectorLabel: string;
  transcriptionLabel: string;
  translationLabel: string;
}

export const SpeakerPanel: FC<SpeakerPanelProps> = ({
  title,
  panelId,
  isRecording,
  isLoading,
  onRecordToggle,
  transcription,
  translation,
  voices,
  selectedVoice,
  onVoiceChange,
  synthesizedAudioUrl,
  error,
  actionButtonLabel,
  voiceSelectorLabel,
  transcriptionLabel,
  translationLabel,
}) => {
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (synthesizedAudioUrl && audioPlayerRef.current) {
      audioPlayerRef.current.src = synthesizedAudioUrl;
      audioPlayerRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  }, [synthesizedAudioUrl]);

  const handlePlaySynthesizedAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  return (
    <Card className="w-full shadow-lg flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button
            onClick={onRecordToggle}
            disabled={isLoading && !isRecording}
            variant={isRecording ? "destructive" : "default"}
            className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground min-w-[160px]"
            aria-label={isRecording ? `Stop recording for ${title}` : `Start recording for ${title}`}
          >
            {isLoading && isRecording ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="mr-2 h-4 w-4" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {isRecording ? 'Stop Recording' : actionButtonLabel}
          </Button>
          <div className="w-full sm:w-auto flex-grow">
            <Select value={selectedVoice} onValueChange={onVoiceChange} disabled={isLoading}>
              <SelectTrigger aria-label={voiceSelectorLabel}>
                <SelectValue placeholder="Select voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{voiceSelectorLabel}</p>
          </div>
        </div>

        {isLoading && !isRecording && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Processing audio...</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor={`transcription-${panelId}`} className="block text-sm font-medium text-foreground mb-1">
            {transcriptionLabel}
          </label>
          <ScrollArea className="h-32 w-full rounded-md border p-2 bg-muted/20">
            <Textarea
              id={`transcription-${panelId}`}
              value={transcription}
              readOnly
              placeholder="Your speech will appear here..."
              className="bg-transparent border-none focus-visible:ring-0 resize-none min-h-[110px]"
              aria-label={`${transcriptionLabel} output`}
            />
          </ScrollArea>
        </div>

        <div>
          <label htmlFor={`translation-${panelId}`} className="block text-sm font-medium text-foreground mb-1">
            {translationLabel}
          </label>
          <ScrollArea className="h-32 w-full rounded-md border p-2 bg-muted/20">
            <Textarea
              id={`translation-${panelId}`}
              value={translation}
              readOnly
              placeholder="Translation will appear here..."
              className="bg-transparent border-none focus-visible:ring-0 resize-none min-h-[110px]"
              aria-label={`${translationLabel} output`}
            />
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <audio ref={audioPlayerRef} className="hidden" aria-label={`Synthesized audio player for ${title}`} />
        {synthesizedAudioUrl && (
          <Button
            onClick={handlePlaySynthesizedAudio}
            variant="outline"
            disabled={isLoading}
            aria-label={`Play synthesized audio for ${title}`}
          >
            <Volume2 className="mr-2 h-4 w-4" />
            Play Translation
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
