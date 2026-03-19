/**
 * One-time import script for TRAILS Symposium events from ICS file
 *
 * This script:
 * 1. Parses the ICS file
 * 2. Filters for TRAILS events on May 20-22, 2026
 * 3. Extracts presenter and location info from descriptions
 * 4. Inserts events into the database
 *
 * Usage: npx tsx scripts/import-symposium-events.ts
 */

import { readFileSync } from "fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { events } from "../src/db/schema";
import "dotenv/config";

interface ParsedEvent {
  uid: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  description: string | null;
  location: string | null;
  allDay: boolean;
}

function parseICSDate(dateStr: string, isAllDay: boolean = false): Date {
  // Handle different ICS date formats:
  // - All day: 20260520 (VALUE=DATE)
  // - With timezone: 20260521T150000 (TZID=America/Denver)
  // - UTC: 20260520T201000Z

  if (isAllDay) {
    // All-day format: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day);
  }

  // Extract date/time parts
  const dateMatch = dateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (!dateMatch) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const [, year, month, day, hour, minute, second, isUTC] = dateMatch;

  if (isUTC) {
    return new Date(
      Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second),
      ),
    );
  }

  // For America/Denver timezone, create date and adjust
  // Denver is UTC-6 (MDT) in May
  const localDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second),
  );

  // Convert from Denver time (MDT = UTC-6) to UTC
  const denverOffsetMinutes = 6 * 60; // MDT offset
  return new Date(localDate.getTime() + denverOffsetMinutes * 60 * 1000);
}

function unescapeICS(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseDescription(rawDesc: string | null): {
  presenter: string | null;
  location: string | null;
} {
  if (!rawDesc) return { presenter: null, location: null };

  const desc = unescapeICS(rawDesc);

  // Extract presenter from <em>...</em> tags
  const presenterMatch = desc.match(/<em>([^<]+)<\/em>/);
  const presenter = presenterMatch ? presenterMatch[1].trim() : null;

  // Extract location - it's usually after <br> or on its own line
  let location: string | null = null;
  const brMatch = desc.match(/<br\s*\/?>\s*([^<\n]+)/i);
  if (brMatch) {
    location = brMatch[1].trim();
  } else if (!presenterMatch && desc.trim()) {
    // If no presenter tag, the whole description might be the location
    location = desc.replace(/<[^>]+>/g, "").trim();
  }

  return { presenter, location };
}

function parseICSFile(filePath: string): ParsedEvent[] {
  const content = readFileSync(filePath, "utf-8");
  const events: ParsedEvent[] = [];

  // Split into VEVENT blocks
  const eventBlocks = content.split("BEGIN:VEVENT");

  for (const block of eventBlocks.slice(1)) {
    // Skip first empty block
    const endIndex = block.indexOf("END:VEVENT");
    if (endIndex === -1) continue;

    const eventContent = block.substring(0, endIndex);

    // Parse fields - handle line folding (lines starting with space are continuations)
    const unfoldedContent = eventContent.replace(/\r?\n[ \t]/g, "");
    const lines = unfoldedContent.split(/\r?\n/);

    const fields: Record<string, string> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      // Store with the base key name (before any parameters like ;TZID=...)
      const baseKey = key.split(";")[0];
      fields[baseKey] = value;
      fields[key] = value; // Also store full key for date parsing
    }

    // Check if this is a TRAILS event in May 20-22, 2026
    const summary = fields["SUMMARY"] || "";
    if (!summary.startsWith("TRAILS")) continue;

    // Get start date string to check date range
    let dtstart = "";
    let isAllDay = false;

    for (const key of Object.keys(fields)) {
      if (key.startsWith("DTSTART")) {
        dtstart = fields[key];
        isAllDay = key.includes("VALUE=DATE") && !key.includes("VALUE=DATE-TIME");
        break;
      }
    }

    if (!dtstart) continue;

    // Check if date is in May 20-22, 2026
    const datePrefix = dtstart.substring(0, 8);
    if (!["20260520", "20260521", "20260522"].includes(datePrefix)) continue;

    // Parse dates
    let startTime: Date;
    let endTime: Date | null = null;

    try {
      startTime = parseICSDate(dtstart, isAllDay);

      // Get end date
      for (const key of Object.keys(fields)) {
        if (key.startsWith("DTEND")) {
          const dtend = fields[key];
          const endIsAllDay = key.includes("VALUE=DATE") && !key.includes("VALUE=DATE-TIME");
          endTime = parseICSDate(dtend, endIsAllDay);
          break;
        }
      }
    } catch (e) {
      console.error(`Error parsing date for event "${summary}":`, e);
      continue;
    }

    // Parse description for presenter and location info
    const rawDescription = fields["DESCRIPTION"] || null;
    const { presenter, location: descLocation } = parseDescription(rawDescription);

    // Use LOCATION field if available, otherwise use location from description
    const location = fields["LOCATION"] ? unescapeICS(fields["LOCATION"]) : descLocation;

    // Build description with presenter info
    let description = "";
    if (presenter) {
      description = `Presenter: ${presenter}`;
    }
    if (descLocation && descLocation !== location) {
      description += description ? `\nRoom: ${descLocation}` : `Room: ${descLocation}`;
    }

    events.push({
      uid: fields["UID"] || "",
      title: unescapeICS(summary.replace("TRAILS ", "")), // Remove TRAILS prefix for cleaner titles
      startTime,
      endTime,
      description: description || null,
      location,
      allDay: isAllDay,
    });
  }

  return events;
}

async function importEvents() {
  // Parse arguments - find the ICS path (non-flag argument)
  const args = process.argv.slice(2);
  const icsPath =
    args.find((arg) => !arg.startsWith("--")) ||
    "./Staff Desk Schedule_carroll.edu_mpv06jpb8cm1i05fsl65170994@group.calendar.google.com.ics";

  console.log(`Parsing ICS file: ${icsPath}`);
  const parsedEvents = parseICSFile(icsPath);

  console.log(`Found ${parsedEvents.length} TRAILS symposium events for May 20-22, 2026\n`);

  // Preview events
  console.log("Events to import:");
  console.log("=".repeat(80));
  for (const event of parsedEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())) {
    console.log(`${event.startTime.toISOString()} - ${event.title}`);
    if (event.location) console.log(`  Location: ${event.location}`);
    if (event.description) console.log(`  ${event.description.replace(/\n/g, "\n  ")}`);
    console.log();
  }
  console.log("=".repeat(80));

  // Check for --dry-run flag
  if (process.argv.includes("--dry-run")) {
    console.log("\n[DRY RUN] No events were inserted. Remove --dry-run flag to insert events.");
    return;
  }

  // Connect to database
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("\nInserting events into database...");

  let inserted = 0;
  let errors = 0;

  for (const event of parsedEvents) {
    try {
      await db.insert(events).values({
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        description: event.description,
        location: event.location,
        submittedByUserId: "import:symposium-2026",
        submittedByName: "TRAILS Symposium Import",
        submittedByOrg: "Carroll College Library",
        color: "#00a99d",
        approved: true, // Auto-approve imported events
      });
      inserted++;
      console.log(`✓ Inserted: ${event.title}`);
    } catch (e) {
      errors++;
      console.error(`✗ Error inserting "${event.title}":`, e);
    }
  }

  console.log(`\nImport complete: ${inserted} inserted, ${errors} errors`);
}

importEvents().catch(console.error);
