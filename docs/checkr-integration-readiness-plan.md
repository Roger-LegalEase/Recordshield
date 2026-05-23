# Checkr Integration Readiness Plan

This is an internal readiness plan for the RecordShield and LegalEase Checkr integration. It is not a completed reviewer packet and it should not be sent to Checkr as proof that the integration is operational.

## Current Status

- Checkr is not integrated yet.
- This document is a readiness plan.
- Codespaces verification passed for the current app codebase.
- Application verification passed. Checkr integration verification is pending.
- No production Checkr calls are enabled.
- No live Checkr credentials should be used yet.
- Screenshots are placeholders until the integration UI is built.
- Webhook event logs, audit logs, integration health, and neutral status labels are required build items.

## What Codespaces Verification Means

Codespaces verification confirms that the current application installs dependencies and passes baseline checks in a clean Linux environment. It does not prove that Checkr API calls, hosted invitations, report retrieval, webhook processing, audit logs, or admin review workflows are operational.

The detailed app verification record remains in docs/checkr-guided-api-review-readiness.md.

## Required Build Items Before Checkr Review

- Admin Checkr settings page
- Checkr API credential configuration
- Integration health diagnostics
- Candidate/report request flow, staging only
- Webhook receiver
- Webhook event log
- Audit log
- Neutral status labels
- Error handling
- Production gating
- No secrets exposure checks
- Demo data / staging data policy

## Staging And Credential Policy

Until the integration is built and reviewed, use Checkr staging only. Do not add live Checkr credentials. Do not enable production Checkr calls. Do not expose Checkr secrets to browser code. Do not run live candidate checks.

## Placeholder Screenshots

The screenshot list is a build checklist, not evidence. Screenshots should be captured only after the related UI or log is implemented and tested in staging.

Required later:

- Admin Checkr page
- Integration health
- Staging checklist
- Candidate invitation creation
- Webhook event log
- Audit log
- Neutral report status labels
- Readiness documentation

## Do Not Claim Yet

- Do not claim Checkr is integrated.
- Do not claim webhook logs are operational.
- Do not claim production readiness.
- Do not claim live API validation.
- Do not claim reviewer packet is ready to send.

## Path to Reviewer Packet

After the required build items are implemented, tested with Checkr staging credentials, and reviewed for compliance, create docs/checkr-reviewer-packet.md with screenshots and evidence.

That future packet should include staging API evidence, webhook evidence, audit log examples, integration health output, neutral status labels, screenshot evidence, and a concise explanation of how RecordShield protects sensitive data and prevents automatic adjudication.
