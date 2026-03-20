import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { corsResponse, corsOptionsResponse } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptionsResponse();
}

export async function POST(req: Request) {
  try {
    const adminUser = await currentUser();
    if (!adminUser) {
      return corsResponse({ error: "Unauthorized" }, 401);
    }

    const adminRole = adminUser.publicMetadata?.role as string | undefined;
    if (adminRole !== "admin") {
      return corsResponse({ error: "Forbidden" }, 403);
    }

    const { emailAddress } = await req.json();

    if (!emailAddress || typeof emailAddress !== "string") {
      return corsResponse({ error: "emailAddress is required" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      return corsResponse({ error: "Invalid email address" }, 400);
    }

    const client = await clerkClient();

    // Determine the base URL for the redirect
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://trails-group-calendar.vercel.app");

    const invitation = await client.invitations.createInvitation({
      emailAddress,
      publicMetadata: {
        role: "contributor",
      },
      redirectUrl: `${baseUrl}/sign-up`,
      ignoreExisting: false,
    });

    return corsResponse({
      success: true,
      invitation: {
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        status: invitation.status,
      },
    });
  } catch (error: unknown) {
    console.error("Error sending invitation:", error);

    if (error && typeof error === "object" && "errors" in error) {
      const clerkError = error as { errors: Array<{ message: string; code: string }> };
      const firstError = clerkError.errors?.[0];
      if (firstError?.code === "duplicate_record") {
        return corsResponse({ error: "An invitation has already been sent to this email" }, 409);
      }
      if (firstError?.message) {
        return corsResponse({ error: firstError.message }, 400);
      }
    }

    return corsResponse({ error: "Failed to send invitation" }, 500);
  }
}
