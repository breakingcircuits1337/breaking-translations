// src/ai/flows/translate-text.ts
'use server';

/**
 * @fileOverview A real-time translation AI agent.
 *
 * - translateText - A function that handles the text translation process.
 * - TranslateTextInput - The input type for the translateText function.
 * - TranslateTextOutput - The return type for the translateText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  sourceLanguage: z.enum(['en', 'pt']).describe('The source language of the text (en for English, pt for Brazilian Portuguese).'),
  targetLanguage: z.enum(['en', 'pt']).describe('The target language for the translation (en for English, pt for Brazilian Portuguese).'),
  includeSlang: z.boolean().describe('Whether to include slang and idioms in the translation.'),
});

export type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});

export type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;

export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
  return translateTextFlow(input);
}

const translateTextPrompt = ai.definePrompt({
  name: 'translateTextPrompt',
  input: {
    schema: TranslateTextInputSchema,
  },
  output: {
    schema: TranslateTextOutputSchema,
  },
  prompt: `You are a translation expert specializing in translating between English and Brazilian Portuguese.

You will be provided with text in one of the languages, and you will translate it to the other language.

Source Language: {{{sourceLanguage}}}
Target Language: {{{targetLanguage}}}
Text to translate: {{{text}}}

{{~#if includeSlang}}
Include slang and idioms in the translation.
{{~else}}
Do not include slang or idioms in the translation. Translate directly.
{{~/if}}

Translation:`, // Removed unnecessary curly braces around translation
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async input => {
    const {output} = await translateTextPrompt(input);
    return output!;
  }
);
