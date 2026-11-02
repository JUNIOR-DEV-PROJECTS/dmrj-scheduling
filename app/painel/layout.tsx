import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

export default async function BusinessPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    redirect("/login?erro=config");
  }

  const supabase = await createClient();
  const { data: { claims }, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claims?.sub) {
    redirect("/login");
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", claims.sub)
    .eq("status", "active")
    .limit(1);

  if (membershipError || !memberships || memberships.length === 0) {
    redirect("/login?erro=permissao");
  }

  return <>{children}</>;
}
