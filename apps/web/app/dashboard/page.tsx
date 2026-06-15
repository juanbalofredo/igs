import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { DashboardHome } from "@/components/DashboardHome";
import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <DashboardNav username={session.igUsername} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <DashboardHome />
      </main>
    </div>
  );
}
