// Netlify Scheduled Function — emails the day's board every morning.
// Runs server-side: hits the app's cron endpoint, which builds today's board
// from the live schedule and sends it via Resend. No browser needed.
//
// Requires these environment variables on the Netlify site:
//   RESEND_API_KEY     — from resend.com
//   RESEND_FROM        — e.g. "Hooligans GameBoard <board@yourbar.com>" (verified domain)
//   EMAIL_CRON_TOKEN   — any long random string (must match the request)
//   MORNING_BOARD_TO   — comma-separated recipient emails
//
// Cron is UTC. 12:00 UTC ≈ 8:00 AM Eastern (EDT). Adjust as needed.
export const config = { schedule: "0 12 * * *" };

export default async () => {
  const site = process.env.URL || process.env.DEPLOY_PRIME_URL;
  const token = process.env.EMAIL_CRON_TOKEN;
  if (!site || !token) {
    return new Response("Missing URL or EMAIL_CRON_TOKEN", { status: 200 });
  }
  const res = await fetch(`${site}/api/email-board?token=${encodeURIComponent(token)}`);
  const body = await res.text();
  return new Response(`morning-board: ${res.status} ${body}`, { status: 200 });
};
