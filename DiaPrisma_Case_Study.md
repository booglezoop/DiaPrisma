# DiaPrisma — Case Study
### An AI-assisted lead-qualification platform for the Bulgarian real estate market

**Role:** Sole designer, builder, and engineer
**Stack:** Vanilla JS (frontend), Netlify Functions, Supabase/Postgres, n8n, Gmail API
**Status:** Functional, pre-pilot — architecture and logic complete and internally validated; not yet exercised against live seller traffic

---

## The problem

Real estate agencies waste time chasing sellers who aren't actually ready to sell, and treat every inbound inquiry with the same priority regardless of urgency. I built a qualification layer an agency can embed on its own landing page: a seller answers a short, branching quiz, gets an immediate readiness score and a diagnosed risk, and — if they opt in — the agency receives a structured, pre-scored lead instead of a raw form submission.

This is deliberately a **qualification and routing layer**, not a lead-gen tool. It doesn't drive traffic; it makes the traffic an agency already has easier to act on correctly.

## Architecture

```
Landing page + quiz (vanilla JS, client-side scoring/branching)
        │  POST
        ▼
Netlify Function — independent server-side re-validation,
                    IP rate limiting, sanitization, Supabase insert
        │  DB webhook on INSERT
        ▼
Three n8n workflows:
  • Real-time lead routing   → tiered Gmail notifications (hot/warm) by track
  • Daily digest (cron)      → batches low-priority leads into one email
  • Reconciliation (cron)    → watchdog that catches silently-failed
                                 real-time notifications and re-sends them
```

The system deliberately decouples the real-time notification path from a watchdog process, so a single failed webhook doesn't mean a hot lead disappears — it gets caught and re-alerted within a bounded window.

## Notable design decisions

**Two independent scoring models, not one.** The system computes a *seller-facing readiness score* (how ready is this person to sell) and a *separate agent-facing lead-priority score* (how urgently should the agency act) from the same raw answers. These are intentionally decorrelated — a seller can be poorly prepared but highly motivated, or well-prepared but in no hurry — and the agency's action priority should track motivation, not readiness. Keeping the two scores structurally independent (neither feeds into the other) was a deliberate choice to avoid a compelling but wrong shortcut.

**Server never trusts the client.** The client does UX-layer validation for responsiveness, but the Netlify function independently re-validates every field, re-checks score ranges, and rate-limits by IP against a live Supabase read before insert — so a tampered payload can't inject an out-of-range score or bypass validation by skipping the client entirely.

**Defense in depth was scoped honestly, not assumed.** Input sanitization strips HTML and injection-relevant characters before storage, which closes the main stored-XSS path into the downstream email templates. I've also identified — and documented — that if a future field were added without being run through sanitization, there's no second layer of escaping at the template level. Rather than treat "we sanitize on the way in" as sufficient, I've flagged it as an open item to close before pilot.

## What I'd flag as an engineer, not just a builder

Part of doing this seriously was auditing my own system rather than declaring it done. One example: I found and fixed a logic bug in the secondary-risk-messaging branch — a missing block scope meant a mispricing-secondary narrative silently gated an unrelated documentation check behind an extra condition, so certain sellers with undocumented paperwork never saw that flagged. I wrote down the intended logic before patching it, rather than fixing it reflexively.

Two items are still open going into pilot:

- No consistency check between the lead-priority *tier* and the underlying *score* at the API boundary — currently only range-validated, not cross-validated. Low practical risk at pilot scale, but a real gap.
- The reconciliation watchdog has a worst-case ~4-hour detection lag for a lead flow explicitly framed as needing immediate follow-up. The right pattern (decoupled watchdog) is in place; the interval hasn't been stress-tested against an actual webhook failure yet.
I'd rather list these than let a case study imply the system is bug-free — and honestly, finding and cataloguing your own failure modes before a pilot starts is the more useful signal anyway.

## Current status

The system is architecturally complete, GDPR-aligned (documented data retention, EU-hosted processors), and internally consistent. Retention logic is implemented and functioning; it has not yet processed real seller data. What it has **not** yet had is real seller traffic — no agency partner is live yet, so the scoring weights and tier thresholds are validated for internal logic, not for whether they produce sensible outcomes against real answer distributions. That's the actual open question the eventual pilot is meant to answer, and I'm treating it as the real risk — not the code-level bugs above, which are fixable in minutes once prioritized.

## Skills demonstrated

- End-to-end system design across frontend, serverless backend, database, and workflow automation
- Independent server-side validation and defense-in-depth security thinking
- Workflow automation architecture (n8n) with failure-mode handling (watchdog pattern)
- AI-assisted development (Claude) used to implement and debug production logic, with manual code review rather than blind acceptance
- Self-directed technical audit — identifying and documenting real bugs and gaps rather than presenting untested work as finished
