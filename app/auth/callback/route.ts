import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/painel";
  const safeNext = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/painel";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?erro=confirmacao", requestUrl.origin));
}
