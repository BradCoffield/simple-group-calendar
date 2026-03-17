import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { corsResponse, corsOptionsResponse } from '@/lib/cors';
import { getCurrentUserInfo, getUserRole } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    let query = db
      .select()
      .from(events)
      .where(eq(events.approved, true));

    if (start && end) {
      query = db
        .select()
        .from(events)
        .where(
          and(
            eq(events.approved, true),
            gte(events.startTime, new Date(start)),
            lte(events.startTime, new Date(end))
          )
        );
    }

    const results = await query;

    const formattedEvents = results.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime.toISOString(),
      end: event.endTime?.toISOString() || null,
      allDay: event.allDay,
      description: event.description,
      location: event.location,
      color: event.color,
      extendedProps: {
        submittedByName: event.submittedByName,
        submittedByOrg: event.submittedByOrg,
      },
    }));

    return corsResponse(formattedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return corsResponse({ error: 'Failed to fetch events' }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    const userInfo = await getCurrentUserInfo();
    if (!userInfo) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    const body = await request.json();
    const {
      title,
      start_time,
      end_time,
      all_day,
      description,
      location,
      submitted_by_org,
      color,
    } = body;

    if (!title || !start_time) {
      return corsResponse({ error: 'Title and start time are required' }, 400);
    }

    const role = await getUserRole();
    const shouldAutoApprove = role === 'admin';

    const [newEvent] = await db
      .insert(events)
      .values({
        title,
        startTime: new Date(start_time),
        endTime: end_time ? new Date(end_time) : null,
        allDay: all_day || false,
        description: description || null,
        location: location || null,
        submittedByUserId: userInfo.id,
        submittedByName: userInfo.name,
        submittedByOrg: submitted_by_org || null,
        color: color || '#1a73e8',
        approved: shouldAutoApprove,
      })
      .returning();

    return corsResponse(newEvent, 201);
  } catch (error) {
    console.error('Error creating event:', error);
    return corsResponse({ error: 'Failed to create event' }, 500);
  }
}
