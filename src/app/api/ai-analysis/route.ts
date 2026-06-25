import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { z } from "zod";
import {
  parseBody,
  validationErrorResponse,
  ValidationError,
} from "../_validators";

const aiConfigSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

const analysisRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  context: z.string().optional(),
  config: aiConfigSchema.optional(),
});

/**
 * Wraps an async iterable so each `next()` call races against a timeout.
 * If the stream stalls for longer than `ms` no chunk arrives, the generator
 * rejects with a timeout error.
 */
async function* withTimeout<T>(
  iterable: AsyncIterable<T>,
  ms: number,
): AsyncGenerator<T> {
  const iterator = iterable[Symbol.asyncIterator]();
  while (true) {
    const result = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Stream timed out after ${ms}ms`)), ms),
      ),
    ]);
    if (result.done) break;
    yield result.value;
  }
}

/**
 * 使用 fetch 直连 OpenAI 兼容 API 的 SSE 流
 */
async function* openaiStream(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  temperature: number,
  disconnectSignal?: AbortSignal,
): AsyncGenerator<string, void, undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  // When the client disconnects, abort the fetch too so we don't
  // waste resources on a response nobody will read.
  disconnectSignal?.addEventListener("abort", () => controller.abort());

  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "Unknown error");
      throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed?.choices?.[0]?.delta?.content || "";
          if (content) {
            yield content;
          }
        } catch {
          // 跳过无法解析的 chunk
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  let body: z.infer<typeof analysisRequestSchema>;
  try {
    body = await parseBody(request, analysisRequestSchema);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationErrorResponse(error);
    }
    return new Response(JSON.stringify({ success: false, error: "Unknown error" }), { status: 500 });
  }
  const { prompt, context, config } = body;

  const messages = [
    ...(context ? [{ role: "system" as const, content: context }] : []),
    { role: "user" as const, content: prompt },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false;

      // Detect client disconnect and close the stream gracefully.
      // Without this the AI call runs to completion even when nobody is listening.
      if (request.signal.aborted) {
        aborted = true;
        try { controller.close(); } catch { /* ok */ }
        return;
      }
      request.signal.addEventListener("abort", () => {
        aborted = true;
        try {
          controller.close();
        } catch {
          // Already closed — race between this and the normal path is harmless.
        }
      });

      try {
        const useDirectFetch = !!(config?.apiKey && config?.baseUrl);

        if (useDirectFetch) {
          // 通道1: fetch 直连 OpenAI 兼容 API
          const model = (config?.model || "gpt-3.5-turbo").toLowerCase();
          const temperature = config?.temperature ?? 0.8;

          for await (const content of openaiStream(
            config!.baseUrl!,
            config!.apiKey!,
            model,
            messages,
            temperature,
            request.signal, // pass disconnect signal so fetch is aborted too
          )) {
            if (aborted) break;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } else {
          // 通道2: 使用 coze SDK（回退逻辑）
          const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
          const cozeConfig = new Config();
          const client = new LLMClient(cozeConfig, customHeaders);

          const llmStream = client.stream(messages, {
            model: (config?.model || "doubao-seed-2-0-lite-260215").toLowerCase(),
            temperature: config?.temperature ?? 0.8,
          });

          // Apply a timeout so a stalled upstream provider doesn't keep the
          // connection open indefinitely (matching the 30 s timeout the direct
          // fetch path already uses).
          for await (const chunk of withTimeout(llmStream, 30_000)) {
            if (aborted) break;
            if (chunk.content) {
              const text = chunk.content.toString();
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
            }
          }
        }

        if (!aborted) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      } catch (error) {
        if (!aborted) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
