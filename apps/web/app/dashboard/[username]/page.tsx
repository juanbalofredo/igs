import { redirect } from "next/navigation";
import { AccountDetail } from "@/components/AccountDetail";
import { DashboardNav } from "@/components/DashboardNav";
import { getSession } from "@/lib/auth";

export default async function AccountPage({ params }: { params: Promise<{ username: string }> }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { username } = await params;

  return (
    <div className="min-h-screen">
      <DashboardNav username={session.igUsername} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <AccountDetail username={username} />
      </main>
    </div>
  );
}
