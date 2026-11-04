import { apiClient } from "./client";

export type ContactCategory = "feedback" | "complaint" | "content_removal" | "privacy" | "other";

export type ContactRequest = {
  category: ContactCategory;
  message: string;
  name?: string;
  email?: string;
  /** Honeypot: must stay empty (hidden from people, bots fill it in). */
  website?: string;
};

export async function sendContactMessage(body: ContactRequest): Promise<string> {
  const data = await apiClient<{ message?: string }>("/api/v1/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.message ?? "Thanks! Your message has been sent.";
}
