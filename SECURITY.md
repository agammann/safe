# Security and privacy scope

Safe tests its own browser connection. There is no network enumeration, packet capture, arbitrary destination input, proxy endpoint, server database, account, or credential collection.

## Data and trust boundaries

The browser contacts one fixed Cloudflare HTTPS diagnostic destination. Cloudflare receives ordinary request information, including the source IP and user agent. Hosting infrastructure receives normal asset requests. The app explains this before a user starts a check.

The diagnostic response is untrusted input. The client applies an 8 KiB streaming bound, a six second abort timer per request, HTTP status checks, and a strict whitelist of relevant fields. A single check has exactly three requests. The interface prevents concurrent checks and provides cancellation.

Saved data is limited to 20 reports and a 100,000 character loading bound. Stored fields are validated and summaries are recalculated. Public IPs and extra fields are removed before persistence and export. React renders labels and diagnostic descriptions as text. No response or saved field becomes HTML.

The HTML includes a restrictive Content Security Policy and no-referrer policy. Only the fixed Cloudflare origin is allowed for external probes. The development policy includes loopback WebSocket connections for Vite. Production hosting should serve HTTPS and can additionally apply frame-ancestors, HSTS, and other response headers appropriate to its host. The included generic static Worker remains compatible with the starter's asset contract.

## Limits

This is not an exhaustive security audit, a device security product, a VPN, or a certification of WiFi safety. Browser certificate trust is relied upon; trusted interception certificates cannot be ruled out. Cloudflare diagnostic availability and semantics are external dependencies.

Local reports are not encrypted. Someone with access to the same browser profile can read their non-IP contents and optional labels. Exported files persist independently. Browser controls should be used for permanent profile cleanup. Undo temporarily retains removed checks in page memory.

## Reporting

For ordinary defects, use the repository issue tracker and include fictional examples. Do not post credentials, real IP addresses, browsing history, or private check labels. For sensitive vulnerabilities, arrange a private disclosure channel with the repository owner before sharing details.
