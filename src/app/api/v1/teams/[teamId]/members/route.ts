import { NextResponse } from "next/server";
import { api, databaseError } from "@/lib/api";
import { idInput, memberInput } from "@/lib/contracts";

export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> },
) {
  return api(async (client) => {
    const id = idInput.parse((await context.params).teamId);
    const input = memberInput.parse(await request.json());
    const { data, error } = await client.rpc("add_team_member", {
      p_team_id: id,
      p_user_id: input.user_id,
      p_role: input.role,
    });
    return error
      ? databaseError(error)
      : NextResponse.json({ data }, { status: 201 });
  });
}
