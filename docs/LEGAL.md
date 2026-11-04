# Legal checklist

> Not legal advice. This covers the usual basics for a small, free, no-account
> news aggregator. If you add accounts, payments, ads or analytics, or expect
> many users in the EU/UK/US, get a professional review.

## Already in the app (footer → Privacy / Terms / Contact)

- Copyright notice: "© 2026 Maheeesh. All rights reserved."
- Privacy Policy: no accounts/ads/analytics/tracking cookies; data stays in the
  browser; searches not stored; host access logs; Google favicon service
  disclosed; contact messages kept max 12 months; how to request deletion.
- Terms: articles belong to publishers (titles, excerpts, links only); provided
  "as is"; no misuse/scraping; app code © owner; takedown via Contact; terms may change.
- Contact form (email hidden), with "Content removal" and "Privacy request" topics.
- No cookie banner needed: the app sets no cookies and uses no trackers
  (localStorage for the visitor's own settings is "strictly necessary").

## What I need from you

| Item | Why it matters | Example |
|---|---|---|
| **Legal name** of the owner (person or business) | Privacy laws require naming who is responsible for data (the "controller"); copyright notice | "Mahesh K." or "XYZ Labs" |
| **Country (and state)** you operate from | Decides which laws apply and the "governing law" line in the Terms | India, Maharashtra |
| **Contact route for legal/privacy requests** | Required by GDPR and India's DPDP Act; the contact form counts, but some laws expect an email or postal address on request | Keep the form; optionally a separate `privacy@your-domain` |
| **Grievance officer** (if you serve users in India at scale) | DPDP Act / IT Rules expect a named contact who responds within set timelines | Your name + form |
| **Minimum age** | Usually 13 (or 18 for some regions) — needed if you ever collect data from children | "Not intended for children under 13" |
| **Effective date** | Shown on Privacy/Terms | "1 December 2026" |
| **Domain** | Used in policy text once you buy it | dailyd.dev |

## Optional but recommended later

- A **governing law / jurisdiction** sentence in Terms (needs your country).
- A **DMCA / copyright agent** if you mainly serve US users and want US safe-harbour protection.
- An **Accessibility** statement (good practice).
- Keep the Google-favicon line in Privacy as long as icons load from Google.

Once you send the items above, the Privacy and Terms text in
`src/components/LegalFooter.tsx` can be updated in a few minutes.
