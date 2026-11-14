import { NextResponse } from "next/server";
import { api, databaseError } from "@/lib/api";
import { eventInput } from "@/lib/contracts";

export async function POST(request: Request) {
  return api(async (client) => {
    const input = eventInput.parse(await request.json());
    const { data, error } = await client.rpc("create_event", {
      p_name: input.name,
      p_slug: input.slug,
      p_description: input.description,
    });
    return error
      ? databaseError(error)
      : NextResponse.json({ data }, { status: 201 });
  });
}
