import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { SettingsPage } from "@/components/SettingsPage";
import { getSession } from "@/lib/auth";

export default async function SettingsRoute() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav username={session.igUsername} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <SettingsPage username={session.igUsername} />
      </main>
    </div>
  );
}
