# Whereby integration verification

Verified against the official [room creation reference](https://docs.whereby.com/whereby-product-features/using-the-rest-api), [OpenAPI schema](https://docs.whereby.com/reference/whereby-rest-api-reference/meetings), [embed attributes](https://docs.whereby.com/reference/using-the-whereby-embed-element) and [webhook signature documentation](https://docs.whereby.com/whereby-product-features/insights-suite-and-api/webhooks).

Rooms are lazily created under an appointment row lock with `isLocked: true`, `roomMode: normal`, `roomNamePrefix: mn-`, `endDate: ends_at` and host URL fields. Recording type is explicitly `none`; live transcription start trigger is `none`. Chat, screen sharing and people controls are hidden. Only the clinician receives the host URL; both stored URLs use AES-256-GCM. No room URL is logged.

TODO(question): The requested `appointmentId:role` externalId is rejected by Whereby's current limit (36 characters, only alphanumeric/hyphen/underscore). The app uses the UUID without hyphens plus `-e` / `-p`, with an HMAC-signed `appointmentId:role` in metadata. Webhooks verify the raw-body signature, timestamp, meeting ID, signed role and Whereby host/visitor role before recording attendance.

Whereby's `endDate` does not terminate the call. Mind Nexus denies access at the scheduled end, unmounts the iframe at that time, and the attendance cron deletes ended/cancelled rooms via the REST API. Native deletion can lag by the five-minute cron interval; Whereby's own later cleanup is not relied upon. Add the application domain to the account's allowed domains and verify recording/transcription are disabled in account settings before live use.

Missing API keys render the requested placeholder only in development. Production requires real Whereby credentials and webhook setup. Signed delivery and actual camera/microphone calls still need account-backed acceptance testing.
