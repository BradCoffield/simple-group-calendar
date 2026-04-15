"use client";

import dynamic from "next/dynamic";

const EmbedCalendar = dynamic(
  () => import("@/components/calendar/EmbedCalendar"),
  { ssr: false },
);

export default function EmbedPage() {
  return (
    <main className="h-screen w-full bg-white overflow-hidden">
      <EmbedCalendar />
    </main>
  );
}
