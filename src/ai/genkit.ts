import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GOOGLE_API_KEY && process.env.NODE_ENV === 'production') {
  throw new Error(
    'The GOOGLE_API_KEY environment variable is not set. Please add it to your environment variables.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
