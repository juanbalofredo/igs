import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = getSupabase();
  const user = await supabase.from("users").select("*").eq("id", session.userId).maybeSingle();

  return NextResponse.json({
    user: user.data,
    ig_username: session.igUsername,
  });
}
