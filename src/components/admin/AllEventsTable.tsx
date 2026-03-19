"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { EventForm } from "@/components/dashboard";

interface AdminEvent {
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

type StatusFilter = "all" | "approved" | "pending";
type SortField = "date" | "title";
type SortDirection = "asc" | "desc";

export default function AllEventsTable() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchAllEvents = useCallback(async () => {
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/events/pending"),
      ]);

      const approved = approvedRes.ok ? await approvedRes.json() : [];
      const pending = pendingRes.ok ? await pendingRes.json() : [];

      const allEvents = [...approved, ...pending].sort(
        (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
      );

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (response.ok) {
        setEvents(events.filter((e) => e.id !== id));
      }
    } catch (error) {
      console.error("Error deleting event:", error);
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update event");
    }

    setEditingEvent(null);
    fetchAllEvents();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.extendedProps.submittedByName.toLowerCase().includes(query) ||
          event.extendedProps.submittedByOrg?.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query),
      );
    }

    // Apply status filter
    if (statusFilter === "approved") {
      result = result.filter((event) => event.approved);
    } else if (statusFilter === "pending") {
      result = result.filter((event) => !event.approved);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "date") {
        comparison = new Date(a.start).getTime() - new Date(b.start).getTime();
      } else if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [events, searchQuery, statusFilter, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
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
            end_time: editingEvent.end?.slice(0, 16) || "",
            all_day: editingEvent.allDay,
            location: editingEvent.location || "",
            submitted_by_org: editingEvent.extendedProps.submittedByOrg || "",
            description: editingEvent.description || "",
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
    return <div className="text-center py-8 text-gray-500">No events found.</div>;
  }

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a99d] focus:border-transparent text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a99d] focus:border-transparent text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Results count */}
      <div className="mb-2 text-sm text-gray-500">
        Showing {filteredEvents.length} of {events.length} events
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No events match your search.
          <button
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="ml-2 text-[#00a99d] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  onClick={() => toggleSort("title")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Event {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th
                  onClick={() => toggleSort("date")}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
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
              {filteredEvents.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">{event.title}</div>
                        <div className="text-sm text-gray-500">
                          {event.extendedProps.submittedByName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(event.start)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.approved
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {event.approved ? "Approved" : "Needs Review"}
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
      )}
    </div>
  );
}
