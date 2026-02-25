# Security Policy

## Reporting a Vulnerability

If you discover a potential security vulnerability in this project, please report it by opening an issue on the repository or contacting the maintainer directly. We take security seriously and will address reports as quickly as possible.

## Security Controls

This project implements several security measures to protect your financial data:

1.  **Server-Side Logic**: Sensitive calculations and data fetching from Google Sheets are performed in Firebase Cloud Functions, keeping your API keys and sheet structure hidden from the client.
2.  **Authentication**: Timing-safe password comparison (`crypto.timingSafeEqual`) prevents timing attacks. Optional biometric authentication uses WebAuthn with ECDSA signature verification against stored public keys.
3.  **Content Security Policy (CSP)**: A strict CSP is enforced via Firebase Hosting to prevent Cross-Site Scripting (XSS) and other code injection attacks.
4.  **Session Management**: Authentication tokens are stored in `sessionStorage` and validated on every API request. Sessions have a limited lifespan and are cleared upon expiration or logout.
5.  **CSRF Protection**: All sensitive API requests include headers to prevent Cross-Site Request Forgery (CSRF).
6.  **Rate Limiting**: IP-based rate limiting using load-balancer-provided IP addresses (no spoofable `X-Forwarded-For` headers). 5 attempts per 15-minute window with Firestore-backed counters.
7.  **Error Handling**: Structured error reporting via a centralized error service. No silent catch blocks — all errors are logged with component context for debugging without exposing internals to end users.

## Data Privacy

- The application only accesses the Google Sheet you specify.
- No financial data is stored in the browser's persistent storage.
- All data is transmitted over encrypted HTTPS connections.

## Security Reviews

Comprehensive security reviews are conducted periodically. The most recent review was completed in February 2026, addressing timing-safe password comparison, WebAuthn signature verification, and rate limiter IP source hardening.
