import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Secure Error Handler
 * Returns safe error responses to clients while logging detailed errors server-side
 * Prevents information disclosure through error messages
 */

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string;
  status: number;
}

/**
 * Handles errors and returns appropriate NextResponse
 * Logs detailed errors server-side but returns generic messages to client
 */
export function handleApiError(error: unknown, context: string = 'Operation'): NextResponse {
  // Log detailed error server-side for debugging
  console.error(`${context} error:`, error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Invalid input. Check your request and try again.',
        validation: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle known error types with safe messages
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Authentication required')) {
      return NextResponse.json(
        { error: 'Authentication required. Sign in and try again.' },
        { status: 401 }
      );
    }

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized. You do not have permission to perform this action.' },
        { status: 403 }
      );
    }

    if (error.message.includes('Not found')) {
      return NextResponse.json(
        { error: 'Resource not found.' },
        { status: 404 }
      );
    }

    if (error.message.includes('Rate limit')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Slow down and try again later.' },
        { status: 429 }
      );
    }

    // For other errors, return generic message
    return NextResponse.json(
      { error: `${context} failed. Try again later.` },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    { error: 'An unexpected error occurred. Try again later.' },
    { status: 500 }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Creates a success response with data
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Validates that a required parameter exists
 * Throws error if missing (will be caught by handleApiError)
 */
export function requireParam(value: any, paramName: string): asserts value {
  if (!value) {
    throw new Error(`${paramName} is required`);
  }
}

/**
 * Validates that user is authenticated
 * Throws error if not (will be caught by handleApiError)
 */
export function requireAuth(userId: string | null | undefined): asserts userId is string {
  if (!userId) {
    throw new Error('Authentication required');
  }
}

/**
 * Validates that user owns a resource
 * Throws error if not (will be caught by handleApiError)
 */
export function requireOwnership(resourceUserId: string, currentUserId: string) {
  if (resourceUserId !== currentUserId) {
    throw new Error('Unauthorized: You do not own this resource');
  }
}
