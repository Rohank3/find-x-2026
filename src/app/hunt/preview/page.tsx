import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HuntPreviewClient from "./HuntPreviewClient";

export const dynamic = "force-dynamic";

export default async function HuntPreviewPage() {
  // In production environments, completely block this sandbox route
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  // Strictly require authenticated organizer session
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ORGANIZER") {
    redirect("/hunt");
  }

  return <HuntPreviewClient />;
}
