"use client";

import { useState, useMemo } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { PendingEventsTable, AllEventsTable } from "@/components/admin";

type Tab = "pending" | "all";

export default function AdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const isAdmin = useMemo(() => {
    if (!isLoaded || !isSignedIn || !user) return null;
    const role = user.publicMetadata?.role as string | undefined;
    return role === "admin";
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Sign in required</h1>
        <p className="text-gray-600">Please sign in to access the admin panel.</p>
        <SignInButton mode="modal">
          <button className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          Go to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Panel</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`pb-3 text-sm font-medium ${
                activeTab === "pending"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending Approval
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-3 text-sm font-medium ${
                activeTab === "all"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All Events
            </button>
          </nav>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {activeTab === "pending" ? (
            <div>
              <h2 className="mb-4 text-lg font-medium text-gray-900">Events Pending Approval</h2>
              <PendingEventsTable />
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-medium text-gray-900">All Events</h2>
              <AllEventsTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
