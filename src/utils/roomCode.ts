/**
 * Room Code Generation Utility
 * Generates unique 6-character alphanumeric room codes
 */

import { firebaseFirestore, COLLECTIONS } from '../config/firebase.config';

const CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking chars (0, O, 1, I)
const CODE_LENGTH = 6;

/**
 * Generate a random room code
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return code;
}

/**
 * Generate a unique room code by checking against existing codes in Firestore
 */
export async function generateUniqueRoomCode(maxAttempts = 10): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRoomCode();
    
    // Check if code already exists
    const existingRooms = await firebaseFirestore
      .collection(COLLECTIONS.GAME_ROOMS)
      .where('roomCode', '==', code)
      .where('status', 'in', ['waiting', 'ready', 'playing'])
      .get();
    
    if (existingRooms.empty) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique room code');
}

/**
 * Format room code for display (adds spacing)
 * Example: ABC123 -> ABC 123
 */
export function formatRoomCode(code: string): string {
  if (code.length !== CODE_LENGTH) {
    return code;
  }
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

/**
 * Validate room code format
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== CODE_LENGTH) {
    return false;
  }
  
  return /^[A-Z2-9]{6}$/.test(code);
}
