import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SuccessResponse<Data> = {
  status: "success";
  data: Data;
};

type ExpectedErrorResponse<ErrorType> = {
  status: "error";
  error: ErrorType;
};

type ApiResponse<Data, ErrorType> =
  | SuccessResponse<Data>
  | ExpectedErrorResponse<ErrorType>;

// Modify to add request body as an optional parameter
export async function fetchApi<Data, ErrorType>(
  url: string,
  successSchema: z.ZodSchema<Data>,
  errorSchema: z.ZodSchema<ErrorType>,
): Promise<ApiResponse<Data, ErrorType>> {
  try {
    const response = await fetch(url);
    const json: unknown = await response.json();

    if (successSchema.safeParse(json).success) {
      return json as SuccessResponse<Data>;
    }

    if (errorSchema.safeParse(json).success) {
      return json as ExpectedErrorResponse<ErrorType>;
    }

    throw new Error("Unexpected response format");
  } catch (error) {
    throw new Error(`API call failed: ${error as string}`);
  }
}
