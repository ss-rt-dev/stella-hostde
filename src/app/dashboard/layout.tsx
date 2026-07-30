import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard/Nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-[#f5f6fa] text-slate-800">
      <DashboardNav user={session.user} />
      <main className="lg:pl-[260px]">
        <div className="mx-auto max-w-[1200px] px-4 py-5 pb-20 lg:px-8 lg:py-7 lg:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
