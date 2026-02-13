import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateConversationRequest,
  CreateConversationResponse,
  GetConversationResponse,
  ListConversationsResponse,
} from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useConversations() {
  return useQuery<ListConversationsResponse>({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const json = await res.json();
      return parseWithLogging(api.conversations.list.responses[200], json, "conversations.list");
    },
  });
}

export function useConversation(id: number | null) {
  return useQuery<GetConversationResponse | null>({
    enabled: typeof id === "number" && Number.isFinite(id),
    queryKey: [api.conversations.get.path, id ?? "null"],
    queryFn: async () => {
      if (typeof id !== "number") return null;
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch conversation");
      const json = await res.json();
      return parseWithLogging(api.conversations.get.responses[200], json, "conversations.get");
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation<CreateConversationResponse, Error, CreateConversationRequest>({
    mutationFn: async (data) => {
      const validated = api.conversations.create.input.parse(data ?? {});
      const res = await fetch(api.conversations.create.path, {
        method: api.conversations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(
            api.conversations.create.responses[400],
            await res.json(),
            "conversations.create.400",
          );
          throw new Error(err.message);
        }
        throw new Error("Failed to create conversation");
      }

      return parseWithLogging(
        api.conversations.create.responses[201],
        await res.json(),
        "conversations.create.201",
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      const url = buildUrl(api.conversations.delete.path, { id });
      const res = await fetch(url, {
        method: api.conversations.delete.method,
        credentials: "include",
      });

      if (res.status === 404) {
        const err = parseWithLogging(
          api.conversations.delete.responses[404],
          await res.json(),
          "conversations.delete.404",
        );
        throw new Error(err.message);
      }
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
  });
}
