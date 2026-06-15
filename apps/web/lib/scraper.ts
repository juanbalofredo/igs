function getScraperConfig() {
  const url = process.env.SCRAPER_URL;
  const apiKey = process.env.SCRAPER_API_KEY;

  if (!url || !apiKey) {
    throw new Error("Faltan SCRAPER_URL o SCRAPER_API_KEY");
  }

  return { url: url.replace(/\/$/, ""), apiKey };
}

async function scraperFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { url, apiKey } = getScraperConfig();

  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        ...(options.headers || {}),
      },
    });
  } catch {
    throw {
      error_code: "scraper_unreachable",
      error_message: `No se pudo conectar con el scraper en ${url}. Verificá que Railway esté activo.`,
    };
  }

  const text = await response.text();
  let data: Record<string, unknown> = {};

  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw {
        error_code: "scraper_invalid_response",
        error_message: `El scraper respondió con un error (${response.status}). Revisá el deploy en Railway.`,
      };
    }
  }

  if (!response.ok) {
    const detail = data.detail || data;
    throw {
      status: response.status,
      ...(typeof detail === "object" ? (detail as Record<string, unknown>) : { error_message: String(detail) }),
    };
  }

  return data as T;
}

export interface LoginResult {
  success: boolean;
  user_id?: string;
  ig_username?: string;
  ig_user_id?: string;
  error_code?: string;
  error_message?: string;
}

export interface TrackResult {
  success: boolean;
  account_id?: string;
  username?: string;
  follower_count?: number;
  following_count?: number;
  is_private?: boolean;
  error_code?: string;
  error_message?: string;
}

export async function scraperLogin(
  username: string,
  password: string,
  verificationCode?: string
): Promise<LoginResult> {
  return scraperFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      verification_code: verificationCode || null,
    }),
  });
}

export async function scraperTrack(userId: string, username: string): Promise<TrackResult> {
  return scraperFetch<TrackResult>("/track", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, username }),
  });
}

export async function scraperUntrack(userId: string, username: string) {
  return scraperFetch("/untrack", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, username }),
  });
}

export async function scraperSync(userId: string, username: string): Promise<TrackResult> {
  return scraperFetch<TrackResult>("/sync", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, username }),
  });
}

export async function scraperSyncAll() {
  return scraperFetch<{
    total: number;
    success: number;
    failed: number;
    results: TrackResult[];
  }>("/sync/all", {
    method: "POST",
  });
}
