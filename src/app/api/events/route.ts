import { NextRequest } from "next/server";
import { eventBus } from "@/lib/services/event-bus";

// SSE endpoint for real-time app events
export async function GET(req: NextRequest) {
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const safeEnqueue = (chunk: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // If enqueue fails, assume the stream is closed and cleanup
          close();
        }
      };

      // Send initial ping to open the stream
      safeEnqueue(`event: ping\ndata: connected\n\n`);

      const unsubscribe = eventBus.subscribe((evt) => {
        if (isClosed) return;
        const payload = JSON.stringify(evt);
        safeEnqueue(`event: ${evt.type}\n`);
        safeEnqueue(`data: ${payload}\n\n`);
      });

      const keepAlive = setInterval(() => {
        if (isClosed) return;
        safeEnqueue(`event: ping\ndata: keep-alive\n\n`);
      }, 15000);

      // Handle close
      const close = () => {
        if (isClosed) return;
        isClosed = true;
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // Notified when the client disconnects
      req.signal.addEventListener("abort", close);

      // Expose close for any external callers if needed
      (controller as any).close = close;
    },
    cancel() {
      // Stream cancelled by client
      // Make sure everything is cleaned up
      // Note: close is captured from start scope via controller as any
      try {
        (this as any).close?.();
      } catch {
        // ignore
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}


