import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { corsResponse, corsOptionsResponse } from '@/lib/cors';
import { isAdmin } from '@/lib/auth';

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    const { id } = await params;

    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));

    if (!existingEvent) {
      return corsResponse({ error: 'Event not found' }, 404);
    }

    const userIsAdmin = await isAdmin();
    const isOwner = existingEvent.submittedByUserId === userId;

    if (!userIsAdmin && !isOwner) {
      return corsResponse({ error: 'Forbidden' }, 403);
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
      approved,
    } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (start_time !== undefined) updateData.startTime = new Date(start_time);
    if (end_time !== undefined) updateData.endTime = end_time ? new Date(end_time) : null;
    if (all_day !== undefined) updateData.allDay = all_day;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (submitted_by_org !== undefined) updateData.submittedByOrg = submitted_by_org;
    if (color !== undefined) updateData.color = color;
    if (approved !== undefined && userIsAdmin) updateData.approved = approved;

    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();

    return corsResponse(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return corsResponse({ error: 'Failed to update event' }, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return corsResponse({ error: 'Unauthorized' }, 401);
    }

    const { id } = await params;

    const [existingEvent] = await db
      .select()
      .from(events)
      .where(eq(events.id, id));

    if (!existingEvent) {
      return corsResponse({ error: 'Event not found' }, 404);
    }

    const userIsAdmin = await isAdmin();
    const isOwner = existingEvent.submittedByUserId === userId;

    if (!userIsAdmin && !isOwner) {
      return corsResponse({ error: 'Forbidden' }, 403);
    }

    await db.delete(events).where(eq(events.id, id));

    return corsResponse({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return corsResponse({ error: 'Failed to delete event' }, 500);
  }
}
