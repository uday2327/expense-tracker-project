import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error) {
  if (error instanceof ZodError) {
    return json(
      {
        message: "Validation failed",
        issues: error.flatten().fieldErrors
      },
      400
    );
  }

  if (error?.message === "UNAUTHORIZED") {
    return json({ message: "Missing or invalid token" }, 401);
  }

  if (error?.status) {
    return json({ message: error.message }, error.status);
  }

  console.error(error);
  return json({ message: error?.message || "Internal server error" }, 500);
}
