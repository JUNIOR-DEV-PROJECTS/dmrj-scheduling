import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  const urlConfigured = url.length > 0;
  const keyConfigured = key.length > 0;

  let urlValid = false;
  let hostname: string | null = null;

  if (urlConfigured) {
    try {
      const parsed = new URL(url);
      urlValid = parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
      hostname = parsed.hostname;
    } catch {
      urlValid = false;
    }
  }

  const keyFormatValid =
    key.startsWith("sb_publishable_") || key.startsWith("eyJ");

  const result: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    environment: {
      urlConfigured,
      keyConfigured,
      urlValid,
      keyFormatValid,
      hostname,
    },
    supabaseAuth: {
      tested: false,
      reachable: false,
      httpStatus: null as number | null,
      diagnosis: "not_tested",
    },
  };

  if (!urlConfigured || !keyConfigured) {
    result.supabaseAuth = {
      tested: false,
      reachable: false,
      httpStatus: null,
      diagnosis: "missing_environment_variable",
    };
    return NextResponse.json(result, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!urlValid || !keyFormatValid) {
    result.supabaseAuth = {
      tested: false,
      reachable: false,
      httpStatus: null,
      diagnosis: "invalid_url_or_key_format",
    };
    return NextResponse.json(result, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    result.supabaseAuth = {
      tested: true,
      reachable: response.ok,
      httpStatus: response.status,
      diagnosis: response.ok
        ? "connected"
        : response.status === 401 || response.status === 403
          ? "key_rejected"
          : response.status === 404
            ? "auth_endpoint_not_found"
            : "supabase_returned_error",
    };

    return NextResponse.json(result, {
      status: response.ok ? 200 : 502,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    result.supabaseAuth = {
      tested: true,
      reachable: false,
      httpStatus: null,
      diagnosis: error instanceof Error && error.name === "TimeoutError"
        ? "supabase_request_timed_out"
        : "network_or_dns_error",
    };

    return NextResponse.json(result, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
