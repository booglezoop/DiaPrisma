# DiaPrisma

A white-label seller-qualification tool for Bulgarian real estate agencies. It replaces a generic "leave your phone number" contact form with a structured ~10-question diagnostic quiz that scores and profiles a seller *before* an agent ever picks up the phone.

**Status: pre-validation.** No seller has completed this quiz in a live agency deployment yet. Scoring weights reflect design intent, not observed behavior. Treat every number in this repo as a hypothesis, not a result.

---

## The problem it's trying to solve

Agencies get inbound seller leads through a contact form that captures a name and a phone number. Every lead looks identical until an agent calls and manually extracts context - timeline, price expectations, documentation status, how many viewings they've already had. That triage work is repeated by hand, per lead, forever.

DiaPrisma moves that triage into a 2-minute quiz embedded on the agency's own site, before the human conversation starts.

## How it works

**1. Diagnostic quiz (`quiz.js`)**
10 questions: 4 shared property questions, a branch question (already listed vs. not yet listed), 4 track-specific questions (pre-market or on-market), and a shared "what worries you" multiselect. Pre-market and on-market sellers get different questions because they're solving different problems (getting ready to sell vs. already stuck trying to sell).

**2. Dual scoring**
- **Client Score** (20–85, shown to the seller): starts at 85, deducts for risk signals. This is the "how ready are you" number the seller sees.
- **Lead Quality Score** (0–100, agent-only): additive, capped at 100. Measures urgency and problem severity, not seller-facing readiness. Determines routing tier: **hot** (70+, immediate email), **warm** (40–69, immediate email), **nurture** (<40, daily 09:00 digest).

**3. Risk diagnosis**
A rules engine (`getPrimaryRisk()`) picks one primary driver - market rejection (viewings, no offers), invisible listing (no viewings at all), mispricing, documentation risk, or lack of strategy - using a fixed priority order, plus up to two secondary risk points (`buildSecondary()`).

**4. Routing**
`submit-lead.js` (Netlify function) validates and writes to Supabase. n8n workflows pick it up from there:
- **Lead capture and routing** - real-time email on insert, split by tier and by track (pre/on-market), each with a different email template.
- **Lead Daily Digest** - 09:00 rollup of nurture-tier leads.
- **Lead Reconciliation** - watchdog that re-checks every 4 hours for hot/warm leads that never got `notified_at` set (i.e. the real-time webhook silently failed).

## Architecture

```
Agency website
   └─ quiz.js (client-side, all scoring logic runs in-browser)
        └─ submit-lead.js (Netlify function → validates, sanitises, rate-limits)
             └─ Supabase (leads table)
                  └─ n8n: Lead capture and routing (real-time, Gmail)
                  └─ n8n: Lead Daily Digest (nurture tier, 09:00)
                  └─ n8n: Lead Reconciliation (4h watchdog, catches missed sends)
```

Deployment model: **one Supabase instance, one Netlify deployment, one n8n workflow set per agency.** No shared multi-tenant infrastructure yet - appropriate for a 2–3 agency pilot, not a scaling strategy.

**Stack:** Supabase (persistence), Netlify (hosting + serverless function), n8n (routing/digest/reconciliation), Umami (analytics, per-question named events for funnel tracking).

**Design system:** dark slate/bronze/charcoal. Fraunces (display), Space Grotesk (UI/body), DM Mono (data/labels).

## Business model

One-time setup fee + monthly retainer covering performance reporting, scoring recalibration, and quiz iteration. DiaPrisma is embedded on the agency's own site - it's a qualification/routing layer, not a lead-generation channel.

## Known limitations (documented, not hidden)

- **No real-time routing path for nurture-tier leads** - they only surface in the 09:00 digest, which means a nurture lead submitted at 09:01 waits ~24 hours before anyone sees it.
- **~4-hour worst-case detection lag** in the reconciliation watchdog for hot/warm leads whose real-time webhook failed.
- **Manually-maintained parallel constant** between client (`quiz.js`) and server (`submit-lead.js`) - no shared source of truth, so they can silently drift out of sync.
- **Unescaped HTML interpolation** in the n8n Gmail templates (lead data is inserted into HTML email bodies without escaping).
- **Proxy form completion is an unmodeled noise source** - an adult relative filling out the form on behalf of an older seller looks identical, in the data, to the seller answering for themselves. Nothing in the scoring accounts for this.
- **Self-report ceiling** - the quiz can't surface a pricing misperception the seller doesn't already recognize. Feedback from an agency contact ([see below](#market-feedback-unvalidated)) suggests this is the actual bottleneck in at least one target market segment, which the current question design structurally can't reach.
- **`fears` secondary-risk priority order** silently drops a seller-stated fear when mispricing and documentation risk are both already present (capped at 2 secondary points, priority: mispricing → docs → fears - an explicit tradeoff, not a bug).

## Market feedback (unvalidated)

Notes from a discovery conversation with an agency contact (Anton Iliev, June 2026) whose own lead flow comes from Facebook ad clicks → survey - a different channel and audience than DiaPrisma's on-site quiz. Treat as one practitioner's anecdote, not a market fact:

- Claims the real bottleneck isn't inventory but **seller motivation** - he estimates ~70% of active listings are from owners without genuine intent to sell ("experimenters"), based on his own lead pool, no stated methodology.
- Says motivation and price realism only become visible **after an in-person valuation visit**, not through anything a seller would self-report beforehand.
- Notes older sellers (60+) sometimes have a relative complete forms on their behalf - anecdotal, no stated frequency.
- Says some agents in his market knowingly list overpriced properties just to have inventory, without expecting a sale within ~18 months.

**Why this matters for DiaPrisma, and why it's not settled:** if true, no self-report question can measure a misperception the seller doesn't recognize yet - that would cap what this quiz can ever detect for that segment. But it's a single source with a directly competing business model (in-person valuation vs. a pre-contact quiz), no numbers behind the percentages, and a different traffic channel. It's a reason to test the assumption with pilot data, not a reason to redesign the quiz around it yet.

## Local setup

1. Serve `index.html` / `privacy.html` / `style.css` as static files (any static host works locally; production uses Netlify).
2. `netlify/functions/submit-lead.js` needs `SUPABASE_SERVICE_KEY` set as an environment variable.
3. Supabase: create a `leads` table matching the fields written in `submit-lead.js` (`name`, `phone`, `email`, `client_score`, `lead_tier`, `track`, etc.).
4. Import the three n8n workflow JSON files and connect Gmail OAuth2 + Supabase credentials per agency instance.

## Privacy

GDPR-scoped: quiz answers stay client-side and are never persisted unless the contact form is submitted. `privacy.html` documents legal basis (legitimate interest), retention (12 months for lead data, 30 days for IP), and processors (Supabase EU-West, Netlify, Umami).

## Roadmap

- Close the nurture real-time routing gap before any live pilot deployment.
- Validate scoring weights against actual pilot behavior (currently zero real submissions to calibrate against).
- Investigate whether a rental-segment variant is worth building - question design, not engineering, is the open problem there.
- Public repo once the pilot has real data behind it.

## Author

Iliyan Donev - solo-built, currently in pilot outreach to Bulgarian real estate agencies.
