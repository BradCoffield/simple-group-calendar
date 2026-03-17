'use client';

import { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import { EventForm, MyEventsTable } from '@/components/dashboard';

type Tab = 'submit' | 'my-events';

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('submit');

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
        <p className="text-gray-600">Please sign in to access the dashboard.</p>
        <SignInButton mode="modal">
          <button className="rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  const handleSubmitEvent = async (data: {
    title: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location: string;
    submitted_by_org: string;
    description: string;
    color: string;
  }) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit event');
    }

    setActiveTab('my-events');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('submit')}
              className={`pb-3 text-sm font-medium ${
                activeTab === 'submit'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Submit New Event
            </button>
            <button
              onClick={() => setActiveTab('my-events')}
              className={`pb-3 text-sm font-medium ${
                activeTab === 'my-events'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Submitted Events
            </button>
          </nav>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {activeTab === 'submit' ? (
            <div>
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                Submit a New Event
              </h2>
              <p className="mb-6 text-sm text-gray-600">
                Events will be reviewed by an administrator before appearing on the public calendar.
              </p>
              <EventForm onSubmit={handleSubmitEvent} />
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-medium text-gray-900">
                My Submitted Events
              </h2>
              <MyEventsTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
