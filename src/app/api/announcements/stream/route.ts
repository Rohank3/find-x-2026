import { announcementEvents } from "@/lib/announcements";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * Connection limiter — prevents resource exhaustion from anonymous SSE floods.
 * Each connection holds a ReadableStream, an EventEmitter listener, and a 20s
 * keepalive timer, so uncapped connections can exhaust memory/file descriptors.
 */
const MAX_SSE_CONNECTIONS = 500;
let activeConnections = 0;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Unauthorized. Sign in required.", { status: 401 });
  }

  const userIdentifier = session.user.id || session.user.email;
  if (!userIdentifier) {
    return new Response("Unauthorized. Sign in required.", { status: 401 });
  }

  const userSseKey = `sse:user:${userIdentifier}`;
  let userCount = 0;
  try {
    userCount = await redis.incr(userSseKey);
    if (userCount === 1) {
      await redis.expire(userSseKey, 3600);
    }
  } catch {
    // If Redis is temporarily unreachable, fall back to global count
  }

  if (userCount > 3) {
    await redis.decr(userSseKey).catch(() => {});
    return new Response("Too many concurrent active announcement streams for your account. Please close extra tabs.", {
      status: 429,
      headers: { "Retry-After": "10" },
    });
  }

  if (activeConnections >= MAX_SSE_CONNECTIONS) {
    await redis.decr(userSseKey).catch(() => {});
    return new Response("Too many concurrent connections. Please try again later.", {
      status: 503,
      headers: { "Retry-After": "10" },
    });
  }

  activeConnections++;

  let isClosed = false;
  let keepAliveTimer: NodeJS.Timeout | undefined;
  // Hoisted so cancel() routes through the exact same teardown as the abort
  // event — otherwise a cancel-without-abort leaks the event listener, the
  // 20s keep-alive timer, and the ReadableStream controller per connection.
  let cleanup: () => void = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream error or client disconnect — trigger immediate cleanup
          cleanup();
        }
      };

      const onUpdate = (payload: unknown) => {
        sendEvent("update", payload);
      };

      cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        activeConnections = Math.max(0, activeConnections - 1);
        redis.decr(userSseKey).catch(() => {});
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        announcementEvents.off("announcement_update", onUpdate);
        req.signal.removeEventListener("abort", cleanup);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      req.signal.addEventListener("abort", cleanup);
      announcementEvents.on("announcement_update", onUpdate);

      // Periodic keep-alive ping to prevent proxy/browser timeout
      keepAliveTimer = setInterval(() => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // Client socket dropped — trigger immediate teardown
          cleanup();
        }
      }, 20000);

      // Initial connection greeting
      sendEvent("connected", { timestamp: Date.now() });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
