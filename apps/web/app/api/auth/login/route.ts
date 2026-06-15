import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, requireSession, setSessionCookie } from "@/lib/auth";
import { scraperLogin } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, verification_code: verificationCode } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error_code: "missing_fields", error_message: "Usuario y contraseña requeridos" },
        { status: 400 }
      );
    }

    const result = await scraperLogin(username, password, verificationCode);

    if (!result.success || !result.user_id || !result.ig_username) {
      return NextResponse.json(result, { status: 401 });
    }

    const token = await createSessionToken({
      userId: result.user_id,
      igUsername: result.ig_username,
    });

    const response = NextResponse.json({
      success: true,
      ig_username: result.ig_username,
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    const err = error as { error_code?: string; error_message?: string };
    return NextResponse.json(
      {
        success: false,
        error_code: err.error_code || "server_error",
        error_message: err.error_message || "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await requireSession();
    return NextResponse.json({ ig_username: session.igUsername, user_id: session.userId });
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
}
