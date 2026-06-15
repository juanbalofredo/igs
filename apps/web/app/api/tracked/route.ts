import { subDays } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { normalizeUsername } from "@/lib/utils";
import { scraperTrack, scraperUntrack } from "@/lib/scraper";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await requireSession();
    const supabase = getSupabase();

    const tracked = await supabase
      .from("user_tracked")
      .select("tracked_at, instagram_accounts(*)")
      .eq("user_id", session.userId)
      .order("tracked_at", { ascending: false });

    const sevenDaysAgo = subDays(new Date(), 7).toISOString().slice(0, 10);

    const accounts = await Promise.all(
      (tracked.data || []).map(async (row) => {
        const account = row.instagram_accounts as unknown as {
          id: string;
          username: string;
          full_name: string | null;
          is_private: boolean;
          profile_pic_url: string | null;
          last_synced_at: string | null;
          last_sync_error: string | null;
        };
        const accountId = account.id;

        const latestSnapshot = await supabase
          .from("snapshots")
          .select("follower_count, following_count")
          .eq("instagram_account_id", accountId)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        const recentChanges = await supabase
          .from("changes")
          .select("id", { count: "exact", head: true })
          .eq("instagram_account_id", accountId)
          .gte("detected_date", sevenDaysAgo);

        return {
          ...account,
          tracked_at: row.tracked_at,
          follower_count: latestSnapshot.data?.follower_count ?? 0,
          following_count: latestSnapshot.data?.following_count ?? 0,
          recent_changes: recentChanges.count ?? 0,
        };
      })
    );

    return NextResponse.json({ accounts });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const username = normalizeUsername(body.username || "");

    if (!username) {
      return NextResponse.json(
        { error_code: "missing_username", error_message: "Ingresá un usuario" },
        { status: 400 }
      );
    }

    const result = await scraperTrack(session.userId, username);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const err = error as { error_message?: string; error_code?: string };
    return NextResponse.json(
      {
        error_code: err.error_code || "server_error",
        error_message: err.error_message || "Error al agregar cuenta",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const username = normalizeUsername(body.username || "");

    await scraperUntrack(session.userId, username);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
