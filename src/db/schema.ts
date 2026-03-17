import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  allDay: boolean('all_day').default(false),
  description: text('description'),
  location: text('location'),
  submittedByUserId: text('submitted_by_user_id').notNull(),
  submittedByName: text('submitted_by_name').notNull(),
  submittedByOrg: text('submitted_by_org'),
  color: text('color').default('#1a73e8'),
  approved: boolean('approved').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
