'use client';

import { useState, useEffect, useCallback } from 'react';
import EventForm from './EventForm';

interface MyEvent {
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
  };
}

export default function MyEventsTable() {
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<MyEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events/mine');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEvents(events.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleUpdate = async (data: {
    title: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location: string;
    submitted_by_org: string;
    description: string;
    color: string;
  }) => {
    if (!editingEvent) return;

    const response = await fetch(`/api/events/${editingEvent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }

    setEditingEvent(null);
    fetchEvents();
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

  if (editingEvent) {
    return (
      <div>
        <h3 className="text-lg font-medium mb-4">Edit Event</h3>
        <EventForm
          initialData={{
            title: editingEvent.title,
            start_time: editingEvent.start.slice(0, 16),
            end_time: editingEvent.end?.slice(0, 16) || '',
            all_day: editingEvent.allDay,
            location: editingEvent.location || '',
            submitted_by_org: editingEvent.extendedProps.submittedByOrg || '',
            description: editingEvent.description || '',
            color: editingEvent.color,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditingEvent(null)}
          submitLabel="Update Event"
        />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        You haven&apos;t submitted any events yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {events.map((event) => (
            <tr key={event.id}>
              <td className="px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: event.color }}
                  />
                  <span className="font-medium text-gray-900">{event.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatDate(event.start)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    event.approved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {event.approved ? 'Approved' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                <button
                  onClick={() => setEditingEvent(event)}
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
