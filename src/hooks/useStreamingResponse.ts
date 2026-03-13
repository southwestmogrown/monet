"use client";

import { useState, useRef, useCallback } from "react";

interface UseStreamingResponseOptions {
  onChunk?: (chunk: string, accumulated: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export function useStreamingResponse(options: UseStreamingResponseOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(
    async (url: string, body: unknown, extraHeaders?: Record<string, string>) => {
      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setStreamingText("");
      setError(null);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `HTTP ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingText(accumulated);
          options.onChunk?.(chunk, accumulated);
        }

        options.onComplete?.(accumulated);
        return accumulated;
      } catch (err) {
        if ((err as Error).name === "AbortError") return "";
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        return "";
      } finally {
        setIsStreaming(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { stream, isStreaming, streamingText, error, cancel };
}
