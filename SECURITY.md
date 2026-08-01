# Security Policy

## Supported versions

finra-ui is pre-1.0. Fixes land on the latest minor release only, and there are no long-term support branches yet.

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | Yes                |
| Older   | No, please upgrade |

All three packages (`@utk09/finra-ui`, `@utk09/finra-ui-finance`, `@utk09/finra-ui-icons`) are versioned and released together.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through [GitHub Security Advisories](https://github.com/utk09/finra-ui/security/advisories/new). That creates a confidential thread with the maintainers and gives you credit in the eventual advisory if you would like it.

Useful things to include, as far as you have them:

- Which package and version
- What an attacker can do, and what they need in order to do it
- A minimal reproduction, ideally a small component or a failing test
- Any suggested fix

## What happens next

- We aim to acknowledge a report within three working days.
- We will tell you whether we consider it a vulnerability, and why, within ten working days.
- If it is one, we will agree a disclosure timeline with you. We would rather ship a fix before publishing details.

This is a small project maintained in spare time, so those are intentions rather than contractual guarantees.

## Scope

This is a client-side component library. It renders UI, parses user input and manages focus. It does not authenticate, authorise, store credentials or talk to a network of its own.

Things we treat as vulnerabilities:

- Cross-site scripting reachable through a documented prop or a normal user interaction
- Prototype pollution or similar in the parsing utilities, which accept untrusted text by design
- A supply-chain problem in what we publish, such as a compromised or unexpected build artifact

Things we do not, though we still want to hear about them as ordinary bugs:

- A component rendering `dangerouslySetInnerHTML` content you passed it yourself
- Vulnerabilities in your own application code that merely surface through a finra-ui component
- Advisories in development-only dependencies that never reach the published packages

## Acknowledgements

We are happy to credit reporters in the advisory and the changelog. Tell us how you would like to be named, or say if you would rather stay anonymous.
