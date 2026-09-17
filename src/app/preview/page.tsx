import React from "react";
import { notFound } from "next/navigation";
import ElevatedInternalShell from "@/components/preview/ElevatedInternalShell";

export const metadata = {
  title: "Internal UI Preview | FIND X",
  description: "Live prototype of the elevated internal page design system for FIND X.",
};

export default function PreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <ElevatedInternalShell />;
}
