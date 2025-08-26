import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export function validateRequest<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  return new Promise((resolve, reject) => {
    request.json()
      .then((data) => {
        try {
          const validatedData = schema.parse(data);
          resolve(validatedData);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            reject(new Error(`Validation failed: ${errorMessage}`));
          } else {
            reject(new Error('Validation failed'));
          }
        }
      })
      .catch(() => {
        reject(new Error('Invalid JSON'));
      });
  });
}

export function createValidationHandler<T extends z.ZodSchema>(schema: T) {
  return async (request: NextRequest) => {
    try {
      const validatedData = await validateRequest(request, schema);
      return { success: true, data: validatedData };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  };
}
