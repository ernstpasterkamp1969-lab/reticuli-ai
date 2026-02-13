import { z } from "zod";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

const llmProvider = z.enum(["gemini", "groq", "huggingface"]);
const imageProvider = z.enum(["pollinations", "craiyon", "huggingface"]);

export const api = {
  conversations: {
    list: {
      method: "GET" as const,
      path: "/api/conversations" as const,
      input: z.void(),
      responses: {
        200: z.array(
          z.object({
            id: z.number(),
            title: z.string(),
            createdAt: z.string().or(z.date()),
          }),
        ),
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/conversations/:id" as const,
      responses: {
        200: z.object({
          id: z.number(),
          title: z.string(),
          createdAt: z.string().or(z.date()),
          messages: z.array(
            z.object({
              id: z.number(),
              conversationId: z.number(),
              role: z.string(),
              content: z.string(),
              createdAt: z.string().or(z.date()),
            }),
          ),
        }),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/conversations" as const,
      input: z.object({ title: z.string().optional() }),
      responses: {
        201: z.object({
          id: z.number(),
          title: z.string(),
          createdAt: z.string().or(z.date()),
        }),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/conversations/:id" as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    sendMessage: {
      method: "POST" as const,
      path: "/api/conversations/:id/messages" as const,
      input: z.object({
        content: z.string().min(1),
        providers: z.array(llmProvider).optional(),
      }),
      responses: {
        200: z.object({
          assistantMessageId: z.number().nullable(),
          content: z.string(),
          providerUsed: llmProvider,
          sourceDate: z.string().nullable(),
          extractedDates: z.array(z.string()),
          failoverTried: z.array(llmProvider),
        }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  imageLab: {
    generate: {
      method: "POST" as const,
      path: "/api/image-lab/generate" as const,
      input: z.object({
        prompt: z.string().min(1),
        provider: imageProvider,
      }),
      responses: {
        200: z.object({
          providerUsed: imageProvider,
          imageUrl: z.string().url(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type InternalError = z.infer<typeof errorSchemas.internal>;
