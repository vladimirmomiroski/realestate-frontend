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
  - Evidence: Reproduced missing files from Next.js, Vitest, Playwright, Lucide React, and TypeScript. `npm ls` reported invalid/extraneous packages. Removing only `node_modules` and reinstalling restored the files. `package-lock.json` remained byte-for-byte unchanged, npm cache verification passed, and npm configuration did not omit development dependencies.
  - Smallest safe direction: Reproduce from a short non-Desktop path, compare current Node/npm with an approved Node LTS environment, inspect Windows file locking/antivirus behavior, and capture verbose npm logs from the next failed clean install.
  - Classification: Local tooling reliability issue; not an application-code defect and not currently proven to affect CI.

- **FE-TOOL-02: Vitest configuration depends on tooling behavior marked for future change**
  - Area: Vitest/Vite configuration loading.
  - Risk: Vite warns that ESM syntax in `vitest.config.ts` is currently loaded through a CommonJS package boundary and may behave differently when the native config loader becomes the default.
  - Evidence: Vitest passes, but emits the native-loader compatibility warning for `vitest.config.ts`.
  - Smallest safe direction: Test the future loader behavior in an isolated tooling-maintenance branch before changing the project-wide module boundary or configuration filename.
  - Classification: Non-blocking future compatibility risk.

- **FE-TOOL-03: vite-tsconfig-paths may become redundant**
  - Area: Vitest path-alias resolution.
  - Risk: The project may retain an unnecessary dependency after Vite's native TypeScript-path resolution becomes the preferred supported mechanism.
  - Evidence: Vite reports that `vite-tsconfig-paths` is detected and native `resolve.tsconfigPaths` support is available.
  - Smallest safe direction: Compare native path resolution against the current plugin in an isolated branch and remove the dependency only if all alias, test, lint, typecheck, and build behavior remains equivalent.
  - Classification: Low-priority dependency simplification; no current functional defect.

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
