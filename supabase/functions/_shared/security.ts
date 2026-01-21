// Shared security utilities for edge functions

/**
 * Returns a safe, user-friendly error message that doesn't leak internal details
 */
export function getSafeErrorMessage(error: unknown, context: string): string {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  
  // Allow specific validation errors (user-facing)
  if (errorMessage.includes('invalid') || errorMessage.includes('must be') || errorMessage.includes('required')) {
    return error instanceof Error ? error.message : 'Invalid request';
  }
  
  // Map known error patterns to safe messages
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return 'Too many requests. Please try again later.';
  }
  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication') || errorMessage.includes('no authorization')) {
    return 'Authentication required. Please sign in again.';
  }
  if (errorMessage.includes('ai') || errorMessage.includes('gateway') || errorMessage.includes('api error')) {
    return 'AI service temporarily unavailable. Please try again.';
  }
  if (errorMessage.includes('not found')) {
    return 'The requested resource was not found.';
  }
  
  // Generic message for all other errors (database errors, internal errors, etc.)
  return `An error occurred while processing your ${context} request. Please try again or contact support if the issue persists.`;
}

/**
 * Checks if an error is a validation error (should return 400)
 */
export function isValidationError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
  return errorMessage.includes('invalid') || errorMessage.includes('must be') || errorMessage.includes('required');
}

/**
 * Gets CORS headers with origin validation for Lovable apps
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  
  // Allow Lovable preview and production domains
  const isLovable = origin.includes(".lovable.app") || origin.includes(".lovableproject.com");
  const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
  
  // Use the actual origin if it's allowed, otherwise use a default
  const allowedOrigin = (isLovable || isLocalhost) ? origin : "https://care-flow-wellness.lovable.app";
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
