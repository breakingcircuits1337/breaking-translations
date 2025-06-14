// synthesize-speech.ts
'use server';

/**
 * @fileOverview Text-to-speech flow using the Eleven Labs API.
 *
 * - synthesizeSpeech - A function that synthesizes speech from text.
 * - SynthesizeSpeechInput - The input type for the synthesizeSpeech function.
 * - SynthesizeSpeechOutput - The return type for the synthesizeSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SynthesizeSpeechInputSchema = z.object({
  text: z.string().describe('The text to synthesize into speech.'),
  voiceId: z.string().describe('The ID of the voice to use for speech synthesis.'),
});
export type SynthesizeSpeechInput = z.infer<typeof SynthesizeSpeechInputSchema>;

const SynthesizeSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data as a data URI.'),
});
export type SynthesizeSpeechOutput = z.infer<typeof SynthesizeSpeechOutputSchema>;

export async function synthesizeSpeech(input: SynthesizeSpeechInput): Promise<SynthesizeSpeechOutput> {
  return synthesizeSpeechFlow(input);
}

const synthesizeSpeechFlow = ai.defineFlow(
  {
    name: 'synthesizeSpeechFlow',
    inputSchema: SynthesizeSpeechInputSchema,
    outputSchema: SynthesizeSpeechOutputSchema,
  },
  async input => {
    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

    if (!elevenLabsApiKey) {
      throw new Error('Eleven Labs API key is not set. Please set the ELEVEN_LABS_API_KEY environment variable on the server.');
    }

    const voiceId = input.voiceId;
    const text = input.text;

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const headers = {
      'Content-Type': 'application/json',
      'xi-api-key': elevenLabsApiKey,
    };

    const body = JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      console.error('Eleven Labs API Error:', response.status, response.statusText);
      try {
        const errorBody = await response.json();
        console.error('Error Body:', errorBody);
      } catch (jsonError) {
        console.error('Failed to parse error response as JSON.');
      }
      throw new Error(`Eleven Labs API request failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64Audio = btoa(String.fromCharCode.apply(null, [...uint8Array]));
    const audioDataUri = `data:audio/mpeg;base64,${base64Audio}`;

    return {audioDataUri: audioDataUri};
  }
);
