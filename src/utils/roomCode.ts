/**
 * Room Code Generation Utility
 * Generates unique 6-character alphanumeric room codes
 *
 * NOTE: generateUniqueRoomCode previously used Firestore.
 * Room code uniqueness is now handled directly in roomStore.ts using RTDB.
 */

const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding similar looking chars (0, O, 1, I)
const CODE_LENGTH = 6;

/**
 * Generate a random room code
 */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return code;
}

/**
 * Generate a unique room code.
 * NOTE: Uniqueness checking is now done in roomStore.ts via RTDB.
 * This function just generates a random code without checking.
 */
export async function generateUniqueRoomCode(
  _maxAttempts = 10
): Promise<string> {
  return generateRoomCode();
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
