import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a unique ID similar to cuid using cryptographically secure random
 * Uses crypto.randomBytes for better security and collision resistance
 */
export function cuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = randomBytes(8).toString('hex').slice(0, 12)
  return `c${timestamp}${randomPart}`
}
