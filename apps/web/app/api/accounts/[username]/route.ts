import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { countChangesByType } from "@/lib/filters";
import { getSupabase } from "@/lib/supabase";
import { normalizeUsername } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const session = await requireSession();
    const { username: rawUsername } = await params;
    const username = normalizeUsername(rawUsername);
    const supabase = getSupabase();

    const accountResult = await supabase
      .from("instagram_accounts")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!accountResult.data) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const tracked = await supabase
      .from("user_tracked")
      .select("user_id")
      .eq("user_id", session.userId)
      .eq("instagram_account_id", accountResult.data.id)
      .maybeSingle();

    if (!tracked.data) {
      return NextResponse.json({ error: "NOT_TRACKED" }, { status: 403 });
    }

    const snapshots = await supabase
      .from("snapshots")
      .select("*")
      .eq("instagram_account_id", accountResult.data.id)
      .order("snapshot_date", { ascending: true });

    const changes = await supabase
      .from("changes")
      .select("*")
      .eq("instagram_account_id", accountResult.data.id)
      .order("detected_date", { ascending: false });

    const latestSnapshot = snapshots.data?.at(-1);

    return NextResponse.json({
      account: {
        ...accountResult.data,
        follower_count: latestSnapshot?.follower_count ?? 0,
        following_count: latestSnapshot?.following_count ?? 0,
      },
      snapshots: snapshots.data || [],
      changes: changes.data || [],
      stats: countChangesByType(changes.data || []),
    });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
