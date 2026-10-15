"use client";

import dynamic from "next/dynamic";

const GlobalOceanBackground = dynamic(
  () => import("@/components/layout/GlobalOceanBackground"),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-[#0c0805] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: "url('/assets/bg_seamless.webp')" }}
      />
    ),
  }
);

export default function LazyOceanBackground() {
  return <GlobalOceanBackground />;
}
