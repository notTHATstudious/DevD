import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ContactForm from "@/components/ContactForm";

vi.mock("@/api/client", async (orig) => ({
  ...(await orig<typeof import("@/api/client")>()),
  apiClient: vi.fn().mockResolvedValue({ message: "Thanks! Your message has been sent." }),
}));

import { apiClient } from "@/api/client";

describe("ContactForm", () => {
  it("needs a real message before sending", () => {
    render(<ContactForm onDone={() => {}} />);
    const send = screen.getByRole("button", { name: "Send message" });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: "too short" } });
    expect(send).toBeDisabled();
  });

  it("sends through our API and never shows an email address", async () => {
    render(<ContactForm onDone={() => {}} />);
    fireEvent.change(screen.getByLabelText(/^Message/), { target: { value: "The feed is great, thanks!" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(screen.getByText("Thanks! Your message has been sent.")).toBeInTheDocument());
    expect(apiClient).toHaveBeenCalledWith("/api/v1/contact", expect.objectContaining({ method: "POST" }));
    expect(document.body.textContent).not.toMatch(/@[a-z]/i);
  });
});
