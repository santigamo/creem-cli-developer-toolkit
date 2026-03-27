export function logInfo(message: string, details?: unknown): void {
  if (details === undefined) {
    console.log(`[minimal-integration] ${message}`);
    return;
  }

  console.log(`[minimal-integration] ${message}`, details);
}

export function logError(message: string, details?: unknown): void {
  if (details === undefined) {
    console.error(`[minimal-integration] ${message}`);
    return;
  }

  console.error(`[minimal-integration] ${message}`, details);
}

