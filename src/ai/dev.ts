import { config } from 'dotenv';
config();

import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/synthesize-speech.ts';