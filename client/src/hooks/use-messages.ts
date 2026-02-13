import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateMessageRequest, CreateMessageResponse } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation<
    CreateMessageResponse,
    Error,
    { conversationId: number; body: CreateMessageRequest }
  >({
    mutationFn: async ({ conversationId, body }) => {
      const validated = api.conversations.sendMessage.input.parse(body);

      const url = buildUrl(api.conversations.sendMessage.path, { id: conversationId });
      const res = await fetch(url, {
        method: api.conversations.sendMessage.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(
            api.conversations.sendMessage.responses[400],
            await res.json(),
            "conversations.sendMessage.400",
          );
          throw new Error(err.message);
        }
        if (res.status === 404) {
          const err = parseWithLogging(
            api.conversations.sendMessage.responses[404],
            await res.json(),
            "conversations.sendMessage.404",
          );
          throw new Error(err.message);
        }
        throw new Error("Failed to send message");
      }

      return parseWithLogging(
        api.conversations.sendMessage.responses[200],
        await res.json(),
        "conversations.sendMessage.200",
      );
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: [api.conversations.get.path, vars.conversationId],
      });
      // Also refresh list for title/last activity updates if backend does it later
      await qc.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
  });
}
