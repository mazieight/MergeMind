import { NextResponse } from "next/server";
import { api, databaseError } from "@/lib/api";
import { idInput, teamInput } from "@/lib/contracts";

type Context = { params: Promise<{ eventId: string }> };
export async function POST(request: Request, context: Context) {
  return api(async (client) => {
    const id = idInput.parse((await context.params).eventId);
    const input = teamInput.parse(await request.json());
    const { data, error } = await client.rpc("create_team", {
      p_event_id: id,
      p_name: input.name,
      p_description: input.description,
    });
    return error
      ? databaseError(error)
      : NextResponse.json({ data }, { status: 201 });
  });
}

export async function GET(_request: Request, context: Context) {
  return api(async (client) => {
    const id = idInput.parse((await context.params).eventId);
    const { data, error } = await client
      .from("teams")
      .select("id,name,description,status")
      .eq("event_id", id)
      .order("created_at");
    return error ? databaseError(error) : NextResponse.json({ data });
  });
}
