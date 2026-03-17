'use client';

import { useState, useEffect, useCallback } from 'react';

interface PendingEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  description: string | null;
  location: string | null;
  color: string;
  approved: boolean;
  createdAt: string;
  extendedProps: {
    submittedByName: string;
    submittedByOrg: string | null;
    submittedByUserId: string;
  };
}

export default function PendingEventsTable() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events/pending');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching pending events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      });
      if (response.ok) {
        setEvents(events.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject (delete) this event?')) return;

    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEvents(events.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pending events to review.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Submitted By
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: event.color }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{event.title}</div>
                    {event.location && (
                      <div className="text-sm text-gray-500">{event.location}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {event.extendedProps.submittedByName}
                </div>
                {event.extendedProps.submittedByOrg && (
                  <div className="text-sm text-gray-500">
                    {event.extendedProps.submittedByOrg}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(event.start)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                <button
                  onClick={() => handleApprove(event.id)}
                  className="text-green-600 hover:text-green-800 mr-3 font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(event.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
