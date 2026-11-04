import { useState } from "react";
import { sendContactMessage, type ContactCategory } from "@/api/contact";
import { ApiError } from "@/api/client";

const CATEGORIES: { value: ContactCategory; label: string }[] = [
  { value: "feedback", label: "Feedback or idea" },
  { value: "complaint", label: "Complaint or bug" },
  { value: "content_removal", label: "Content removal (publishers)" },
  { value: "privacy", label: "Privacy request" },
  { value: "other", label: "Other" },
];

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground";

/** Sends a message to the site owner through our server; their email is never shown. */
export default function ContactForm({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState<ContactCategory>("feedback");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const tooShort = message.trim().length < 10;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tooShort || state === "sending") return;
    setState("sending");
    setError("");
    try {
      const reply = await sendContactMessage({
        category,
        message: message.trim(),
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        website,
      });
      setResult(reply);
      setState("sent");
    } catch (err) {
      setState("idle");
      if (err instanceof ApiError && err.status === 429) {
        setError("You've sent several messages already. Please try again in a few minutes.");
      } else if (err instanceof ApiError && err.status === 422) {
        setError("Please check your email address, or leave it empty.");
      } else {
        setError("Couldn't send your message. Please try again later.");
      }
    }
  };

  if (state === "sent") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{result}</p>
        <button onClick={onDone} className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background">
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Send feedback, a complaint or a removal request. Add your email only if you'd like a reply.
      </p>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Topic</span>
        <select value={category} onChange={(e) => setCategory(e.target.value as ContactCategory)} className={field}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-medium">Name (optional)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={field} autoComplete="name" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            className={field}
            autoComplete="email"
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          className={`${field} resize-none`}
        />
        <span className="block text-right text-[10px] text-muted-foreground">{message.length}/2000</span>
      </label>
      {/* Honeypot: invisible to people and screen readers. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        name="website"
      />
      {error && <p role="alert" className="text-xs text-foreground">{error}</p>}
      <button
        type="submit"
        disabled={tooShort || state === "sending"}
        className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background disabled:opacity-50"
      >
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
