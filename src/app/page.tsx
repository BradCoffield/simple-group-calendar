import dynamic from "next/dynamic";

const Calendar = dynamic(() => import("@/components/calendar/Calendar"), { ssr: false });

export default function Home() {
  return (
    <main className="h-screen w-full p-4 md:p-6">
      <Calendar />
    </main>
  );
}
