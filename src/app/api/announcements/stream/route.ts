import { announcementEvents } from "@/lib/announcements";

export const dynamic = "force-dynamic";

/**
 * Connection limiter — prevents resource exhaustion from anonymous SSE floods.
 * Each connection holds a ReadableStream, an EventEmitter listener, and a 20s
 * keepalive timer, so uncapped connections can exhaust memory/file descriptors.
 */
const MAX_SSE_CONNECTIONS = 500;
let activeConnections = 0;

export async function GET(req: Request) {
  if (activeConnections >= MAX_SSE_CONNECTIONS) {
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
