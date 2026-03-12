/**
 * Creates a ReadableStream that encodes text chunks using TextEncoder.
 * Used by API routes to stream Claude responses to the client.
 */
export function createTextStream(
  asyncIterable: AsyncIterable<string>
): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of asyncIterable) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Creates a ReadableStream for NDJSON events.
 * Each event is serialized as a JSON line terminated with \n.
 */
export function createNdjsonStream(
  producer: (emit: (event: unknown) => void) => Promise<void>
): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        await producer((event) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        });
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}
