"use client";

import { useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import EventModal from "./EventModal";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  description: string | null;
  location: string | null;
  color: string;
  extendedProps: {
    submittedByName: string;
    submittedByOrg: string | null;
  };
}

export default function EmbedCalendar() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = useCallback(async (start: string, end: string) => {
    try {
      const response = await fetch(
        `/api/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      );
      if (response.ok) {
        const data: CalendarEvent[] = await response.json();
        setEvents(
          data.map((event) => ({ ...event, end: event.end || undefined })),
        );
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }, []);

  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      fetchEvents(arg.startStr, arg.endStr);
    },
    [fetchEvents],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const event = arg.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.end ? event.end.toISOString() : null,
      allDay: event.allDay,
      description: event.extendedProps.description || null,
      location: event.extendedProps.location || null,
      color: event.backgroundColor || "#00a99d",
      extendedProps: {
        submittedByName: event.extendedProps.submittedByName,
        submittedByOrg: event.extendedProps.submittedByOrg,
      },
    });
    setIsModalOpen(true);
  }, []);

  return (
    <div className="h-full p-3">
      <FullCalendar
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView="listMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "listMonth,dayGridMonth",
        }}
        buttonText={{
          listMonth: "List",
          dayGridMonth: "Month",
        }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        timeZone="local"
        height="100%"
        eventDisplay="block"
        dayMaxEvents={3}
        nowIndicator={true}
        noEventsText="No upcoming events"
      />
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
