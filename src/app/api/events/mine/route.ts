import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { corsResponse, corsOptionsResponse } from '@/lib/cors';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    const results = await db
      .select()
      .from(events)
      .where(eq(events.submittedByUserId, userId));

    const formattedEvents = results.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime?.toISOString() || null,
      allDay: event.allDay,
      description: event.description,
      location: event.location,
      color: event.color,
      approved: event.approved,
      createdAt: event.createdAt?.toISOString(),
      extendedProps: {
        submittedByName: event.submittedByName,
        submittedByOrg: event.submittedByOrg,
      },
    }));

    return corsResponse(formattedEvents);
  } catch (error) {
    console.error('Error fetching user events:', error);
    return corsResponse({ error: 'Failed to fetch user events' }, 500);
  }
}
