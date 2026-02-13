import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { ImageGenerateRequest, ImageGenerateResponse } from "@shared/schema";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useGenerateImage() {
  const qc = useQueryClient();
  return useMutation<ImageGenerateResponse, Error, ImageGenerateRequest>({
    mutationFn: async (body) => {
      const validated = api.imageLab.generate.input.parse(body);
      const res = await fetch(api.imageLab.generate.path, {
        method: api.imageLab.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = parseWithLogging(
            api.imageLab.generate.responses[400],
            await res.json(),
            "imageLab.generate.400",
          );
          throw new Error(err.message);
        }
        throw new Error("Failed to generate image");
      }

      return parseWithLogging(
        api.imageLab.generate.responses[200],
        await res.json(),
        "imageLab.generate.200",
      );
    },
    onSuccess: async () => {
      // In case a gallery endpoint is added later, keep future-friendly invalidation
      await qc.invalidateQueries({ queryKey: [api.imageLab.generate.path] });
    },
  });
}
