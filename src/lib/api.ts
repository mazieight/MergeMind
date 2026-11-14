import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { supabase } from "./supabase";
import { getSupabaseConfig } from "./env";

export function failure(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function api(
  work: (
    client: Awaited<ReturnType<typeof supabase>>,
    userId: string,
  ) => Promise<Response>,
) {
  if (!getSupabaseConfig())
    return failure(
      "NOT_CONFIGURED",
      "Complete Supabase setup to continue.",
      503,
    );
  try {
    const client = await supabase();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error || !user)
      return failure("UNAUTHENTICATED", "Sign in to continue.", 401);
    return await work(client, user.id);
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError)
      return failure("INVALID_INPUT", "Check the submitted fields.", 400);
    return failure(
      "INTERNAL_ERROR",
      "The request could not be completed.",
      500,
    );
  }
}

export function databaseError(error: { code?: string }) {
  if (error.code === "23505")
    return failure("CONFLICT", "This entry already exists.", 409);
  if (error.code === "42501")
    return failure(
      "FORBIDDEN",
      "You do not have permission for this action.",
      403,
    );
  if (error.code === "23503")
    return failure(
      "INVALID_REFERENCE",
      "The referenced account or record does not exist.",
      400,
    );
  return failure("DATABASE_ERROR", "The request could not be saved.", 500);
}
