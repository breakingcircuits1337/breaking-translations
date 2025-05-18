export interface VoiceOption {
  id: string;
  name: string;
  language: 'en' | 'pt';
}

// Note: These are example voice IDs. Replace with actual valid IDs from your Eleven Labs account.
export const ENGLISH_VOICES: VoiceOption[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Default EN)', language: 'en' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam (EN)', language: 'en' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Dorothy (EN)', language: 'en'},
  // Add more English voices as needed
];

export const PORTUGUESE_VOICES: VoiceOption[] = [
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (Default PT)', language: 'pt' }, // Often multilingual
  { id: 'g5CIjZEefquS23S1q4x4', name: 'Gigi (PT)', language: 'pt'}, // Example - check if this ID is PT specific
  { id: 'oWAxZDx7w5VEj9dCyTzz', name: 'Nicole (PT)', language: 'pt' },
  // Add more Portuguese voices as needed.
  // You might need to find specific Brazilian Portuguese voice IDs if available.
];

export const DEFAULT_ENGLISH_VOICE_ID = ENGLISH_VOICES[0]?.id || '21m00Tcm4TlvDq8ikWAM';
export const DEFAULT_PORTUGUESE_VOICE_ID = PORTUGUESE_VOICES[0]?.id || 'ErXwobaYiN019PkySvjV';

export const ALL_VOICES = [...ENGLISH_VOICES, ...PORTUGUESE_VOICES];
