# Frontend Quality Handoff

## Purpose

This file tracks verified unresolved frontend issues, external integration prerequisites, and deferred hardening work. Backend-owned items remain separate work; their presence here does not authorize backend changes.

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

- **C2-06: Locale-root error boundary uses an obsolete retry prop**
  - Area: Inherited Chapter 1 error recovery, outside the catalog-local boundary.
  - Evidence: `src/app/[locale]/error.tsx` still accepts and passes `unstable_retry`; the installed Next.js 16.3 `error.js` guide documents `retry`. The catalog's own `listings/error.tsx` already uses the supported API.
  - Risk: Locale-root recovery is not wired to the installed framework's retry callback. Passing catalog-boundary tests does not verify this separate boundary.
  - Smallest safe direction: A separate bounded foundation correction with a real boundary retry regression. Do not fold runtime changes into documentation closeout.
  - Classification: Inherited nonblocking Chapter 2 audit finding; unresolved at 2Q.

- **BE-ENV-01: Protected Development database upgrade remains separate work**
  - Area: Backend environment prerequisite for populated live integration verification.
  - Evidence: The retained 2P smoke and 2R read-only assessment recorded `realestate_db` with 24 listings and 14 applied migrations, while the accepted backend has 21 migrations. Isolated verification databases used all 21; the protected database was not upgraded. These are historical observations, not a fresh database assessment at 2Q.
  - Smallest safe direction: Obtain an explicit backend upgrade/data-review plan and authorization before migrations or record changes. Preserve the existing container and volume. The historical 2R check found no negative Rooms, but validator fixes alone do not establish future data integrity.
  - Classification: Separate backend/environment handoff; normal frontend tests do not depend on this database.

- **BE-DEP-01: Backend cryptography dependency advisories need separate review**
  - Area: Backend dependency maintenance, not frontend runtime dependencies.
  - Evidence: Retained 2R restore output reported NU1902/NU1903 for `System.Security.Cryptography.Pkcs` 10.0.10 (GHSA-2fmv-rv2c-59x7, GHSA-846f-f764-76mx) and NU1903 for `System.Security.Cryptography.Xml` 10.0.10 (GHSA-7hqp-7c5m-4vq6, GHSA-c399-9853-6jmj). The backend test project's existing resolved assets still contain those versions at 2Q inspection.
  - Smallest safe direction: Review current advisory applicability and dependency paths in an authorized backend maintenance checkpoint, then test an appropriate update. No fresh vulnerability scan or exploitability assessment was performed during 2Q.
  - Classification: Inherited dependency handoff; no dependency or backend change authorized here.

- **FE-TOOL-01: Clean npm installation can produce an incomplete node_modules tree**
  - Area: Windows local frontend dependency installation.
  - Risk: `npm ci` can report success while installed package directories are missing manifests, executables, or bundled TypeScript declarations, causing unrelated module-resolution and startup failures.
  - Evidence: Earlier clean installs reproduced missing files from Next.js, Vitest, Playwright, Lucide React, and TypeScript, with `npm ls` reporting invalid/extraneous packages; removing only `node_modules` and reinstalling restored the files without changing `package-lock.json`. A controlled 2026-08-05 investigation on Windows 10 x64, Node 24.16.0, and npm 12.0.2 did not reproduce the failure: three fresh `npm ci` runs from a Desktop sibling and three from `C:\fe01` all exited successfully, passed `npm ls --depth=0`, and contained all six previously affected package files. A fresh short-path hoisted `npm install` control also passed without manifest or lockfile drift. The similar-path installs were slower (69.63-175.47 seconds) than the short-path installs (62.57-65.60 seconds), but their verbose logs contained no access, extraction, path, or file-locking errors. No alternate Node installation was available for comparison.
  - Smallest safe direction: Keep the issue open without a repository configuration change. Preserve the next failed disposable tree before reinstalling, including its per-run verbose/timing logs, `npm ls --depth=0` output, required-file checks, exact npm shim/CLI paths, and contemporaneous Node/npm process and Windows security-event evidence; then repeat the same tracked-files archive at `C:\fe01` and under an already-installed supported alternate Node LTS version if one is available.
  - Classification: Local tooling reliability issue; not an application-code defect and not currently proven to affect CI.
