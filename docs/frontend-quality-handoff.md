# Frontend Quality Handoff

## Purpose

This file tracks only verified unresolved frontend issues, risks, and deferred hardening work.

It is a live source-controlled issue register, not project history, a completed-work log, a second frontend context, or a resolved-findings archive.

## Maintenance Rules

- Add only evidence-based issues.
- Every issue must include repository or reproducible environment evidence.
- Every issue must include the smallest safe direction.
- Remove the entire issue after it is fixed, tested, and reviewed.
- Do not keep a resolved/archive section.
- Update the relevant chapter document and `frontend-context.md` when a fix changes a lasting rule.
- Review this file at the end of every frontend chapter.

## Unresolved Issues

- **FE-TOOL-01: Clean npm installation can produce an incomplete node_modules tree**
  - Area: Windows local frontend dependency installation.
  - Risk: `npm ci` can report success while installed package directories are missing manifests, executables, or bundled TypeScript declarations, causing unrelated module-resolution and startup failures.
  - Evidence: Earlier clean installs reproduced missing files from Next.js, Vitest, Playwright, Lucide React, and TypeScript, with `npm ls` reporting invalid/extraneous packages; removing only `node_modules` and reinstalling restored the files without changing `package-lock.json`. A controlled 2026-08-05 investigation on Windows 10 x64, Node 24.16.0, and npm 12.0.2 did not reproduce the failure: three fresh `npm ci` runs from a Desktop sibling and three from `C:\fe01` all exited successfully, passed `npm ls --depth=0`, and contained all six previously affected package files. A fresh short-path hoisted `npm install` control also passed without manifest or lockfile drift. The similar-path installs were slower (69.63-175.47 seconds) than the short-path installs (62.57-65.60 seconds), but their verbose logs contained no access, extraction, path, or file-locking errors. No alternate Node installation was available for comparison.
  - Smallest safe direction: Keep the issue open without a repository configuration change. Preserve the next failed disposable tree before reinstalling, including its per-run verbose/timing logs, `npm ls --depth=0` output, required-file checks, exact npm shim/CLI paths, and contemporaneous Node/npm process and Windows security-event evidence; then repeat the same tracked-files archive at `C:\fe01` and under an already-installed supported alternate Node LTS version if one is available.
  - Classification: Local tooling reliability issue; not an application-code defect and not currently proven to affect CI.

- **FE-TOOL-04: next-themes bootstrap emits a React client-render warning**
  - Area: Next.js 16 and React 19 theme bootstrap during client locale navigation.
  - Risk: React warns that a script encountered during client rendering is not executed, so a future route or provider change could affect theme initialization even though current behavior passes.
  - Evidence: The final Chromium suite reproducibly emits the script-tag warning during client locale/theme navigation with `next-themes`; System, Light, Dark, and persisted reload behavior all pass without a hydration mismatch.
  - Smallest safe direction: Reproduce the warning in an isolated tooling branch, confirm upstream compatibility for the installed Next.js, React, and `next-themes` versions, and change provider placement or dependency versions only with theme-flash and persistence regression coverage.
  - Classification: Non-blocking integration warning; no current functional defect.

- **FE-DEP-01: Installation summary and explicit npm audit results have been inconsistent**
  - Area: Dependency-security reporting.
  - Risk: `npm install` or `npm ci` may report advisory counts that differ from immediately repeated explicit audit commands, making the real remediation state unclear.
  - Evidence: Installation output reported 2 moderate and 4 high advisories, while separate explicit audit runs previously reported zero vulnerabilities.
  - Smallest safe direction: Capture `npm audit --omit=dev`, `npm audit`, and `npm audit --json` from the same stable installation and map every advisory to its owning direct dependency before changing versions.
  - Classification: Investigation required; do not run `npm audit fix --force`.
