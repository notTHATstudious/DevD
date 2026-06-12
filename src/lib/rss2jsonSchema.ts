import { z } from "zod";

export const rss2JsonItemSchema = z.object({
  title: z.string().optional(),
  link: z.string().optional(),
  pubDate: z.string().optional(),
  author: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
});

export const rss2JsonResponseSchema = z.object({
  status: z.literal("ok"),
  items: z.array(rss2JsonItemSchema),
});

export type Rss2JsonItem = z.infer<typeof rss2JsonItemSchema>;
export type Rss2JsonResponse = z.infer<typeof rss2JsonResponseSchema>;

/** Returns parsed feed data or null when the response shape is invalid. */
export function parseRss2JsonResponse(data: unknown): Rss2JsonResponse | null {
  const result = rss2JsonResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}
