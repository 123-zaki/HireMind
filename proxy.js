import arcjet, { detectBot, shield } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/appointments(.*)",
  "/explore(.*)",
  "/onboarding(.*)",
]);


// Trusted external webhook endpoints that should bypass Arcjet protection like stream-webhook
const isTrustedWebhook = createRouteMatcher([
  "/api/webhooks/stream(.*)",
]);

// arcjet shield
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({
      mode: "LIVE",
    }),

    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"]
    })
  ]
});

export default clerkMiddleware(async (auth, req) => {
  // Skip Arcjet protection for trusted webhooks
  if(!isTrustedWebhook(req)) {
    const decision = await aj.protect(req);
    if(decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const authData = await auth();

  const { userId } = authData || {};

  if (!userId && isProtectedRoute(req)) {
    const { redirectToSignIn } = authData || {};

    return redirectToSignIn ? redirectToSignIn() : NextResponse.redirect("/sign-in?redirect_url=" + encodeURIComponent(req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};