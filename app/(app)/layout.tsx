import { redirect } from "next/navigation";
import { NavBar } from "@/components/glass/NavBar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <main className="flex-1 px-6 pt-12 pb-28">{children}</main>
      <NavBar />
    </div>
  );
}
