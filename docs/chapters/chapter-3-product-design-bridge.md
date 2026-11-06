# Chapter 3 — Product Design Bridge

## Status

**Home Journal / Домашен журнал is the owner-approved visual direction. This
implementation plan is prepared for independent audit; the plan and runtime
implementation are not yet approved. No Chapter 3 UI has been implemented.**

```text
Plan prepared                  2026-11-06
Inspected starting branch      development (clean, including ordinary untracked files)
Baseline HEAD                  499cc0947f9a44cb775d2eb5d7fb0a6c5242fbea
Owner-authorized branch         feature/chapter-3-design-bridge
Current checkpoint             Permanent plan only; documentation and verification
Proposed implementation        3A → 3B → 3C → 3D → 3E, after plan approval
Backend / shared docs          Read-only; no changes authorized by this plan task
Git operations                 No staging, commit, merge, push, rebase or reset
```

The owner has superseded the discovery report's Clear Local recommendation with
Home Journal. Approval concerns the visual direction and bounded bridge scope;
it does not approve a new product name, every prototype detail, photography,
the proposed launch strategy or future product features. Existing Chapter 1/2
architecture and behavior remain binding. This document defines the proposed
implementation parameters sufficiently to audit without access to ignored assets.

## 1. Chapter purpose and approved direction

Establish a durable visual language and apply it to the existing localized
homepage, public shell and listings catalog. The result should feel warm,
editorial and architectural while making the current discovery journey quick to
read and operate. This is presentation alignment, not a feature-delivery chapter.

The essential Home Journal qualities are:

- Warm ivory surfaces, deep burgundy accents and natural property photography.
- Expressive serif display type, restrained italic emphasis and readable modern
  body/UI type, with actual Macedonian and Latin coverage.
- Thin architectural rules, deliberate whitespace and magazine-like grouping.
- Compact but comfortable calls to action, clear asking prices and labelled facts.
- Subtle vintage character produced by composition and typography, without aged
  textures, ornamental badges, heavy animation or low-contrast functional text.

The approved scope includes tokens, existing page composition, header/footer,
search-form presentation, catalog/card hierarchy and responsive/accessibility
refinement. The homepage remains data-free; the catalog continues to consume its
existing server operation. The page set remains `/{locale}` and
`/{locale}/listings`, for `mk` and `en`.

## 2. Discovery references, evidence and decision status

### 2.1 Evidence retained

The local [discovery report][discovery] contains the A–J investigation of the
frontend, backend and actual shared repository. The [visual exploration][visual]
contains the three concepts, [Home Journal desktop homepage][reference-home],
[catalog][reference-catalog] and [mobile catalog][reference-mobile]. These are
ignored local evidence, not portable implementation dependencies or production
screenshots. Keep them as historical proposals; this permanent document records
the later approval and supersession.

The latest owner message refers to an attached preferred screenshot, but no new
attachment was available to this planning session. The saved Home Journal
homepage was actually inspected. Its characteristics match the written brief.
**Confirm that this saved reference is the intended image, or reconcile the
separate image, before 3B visual implementation.** Do not claim the unseen image
was inspected. This reference clarification does not prevent an actionable plan
or 3A token specification.

Technical authority remains the [frontend context][context], [Chapter 1][chapter1],
[Chapter 2][chapter2], actual source/tests and committed contracts. The separate
[shared README][shared-readme] describes product-documentation ownership;
[vision][shared-vision] and [decisions][shared-decisions] contain historical
assumptions that require explicit reconciliation, not automatic adoption.

### 2.2 Approval register

| Decision                                                                               | Status and consequence                                                                                                       |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Home Journal visual identity                                                           | **Approved by owner.** Supersedes Clear Local as the selected direction.                                                     |
| Chapter 3 as an existing-interface design bridge                                       | **Approved scope.** No new feature controls, routes or backend work.                                                         |
| Creation of this branch and permanent plan                                             | **Authorized and performed.** Does not authorize runtime changes.                                                            |
| Token values, type sizes, two-column grid and checkpoints below                        | **Concrete plan proposals awaiting audit and owner approval.** Direction approval is not approval of every numerical choice. |
| Домашен журнал as final brand                                                          | **Pending.** Keep existing `common.appName` values until a naming decision is approved.                                      |
| Homepage photograph and production reuse of generated study images                     | **Pending.** No production license, suitability or owner asset approval is inferred.                                         |
| First-MVP scope, AI/maps priority, supply/launch model, locality and buy/rent coverage | **Pending discovery product decisions.** None is settled by the visual choice.                                               |
| Shared-product document edits and future chapter numbering                             | **Pending exact scope approval.** Inventory in section 15 only.                                                              |
| Plan acceptance and permission to begin 3A                                             | **Pending.** Independent plan audit and owner approval precede UI changes.                                                   |

### 2.3 Current implementation facts relevant to design

- [Locale layout][locale-layout] owns document language and Geist/Geist Mono
  through `next/font`, with Latin and Cyrillic subsets. [Public layout][public-layout]
  owns one skip link, header, main target and footer.
- [Home][home] has a heading, Browse CTA and three informational blocks; it does
  not fetch listings. Some existing copy still says “future” filters.
- [Catalog route][catalog] has async params/searchParams, server retrieval and
  metadata. Its [form][search-form] exposes only `q`, `listingType` and
  `propertyType`; URL state also includes `page`. The selector offers Apartment
  and House, while unfiltered cards support all four property roots.
- [Results][results] currently use one/two/three columns. [Cards][card] are
  noninteractive articles with a title, location, labelled facts and language
  annotation. [Media][media] uses a stable 4:3 frame and safe fallback.
- There are no implemented detail, advertiser-contact, agency, auth or management
  pages. Backend-only capabilities are not present user-facing features.

## 3. Product and UX principles

1. **Useful information first.** Asking price, property identity, location and
   practical facts must remain easy to scan. Editorial composition cannot hide
   controls or force extra steps.
2. **Truthful expression.** Do not invent inventory counts, verification, reviews,
   freshness, curated selection, available contact channels or market intelligence.
   Price/m² is asking-price arithmetic, not valuation or comparison with a market.
3. **Continuity of behavior.** Visual improvements preserve accepted server/client,
   URL, metadata, locale, media, error and native GET boundaries.
4. **One coherent public shell.** There is no reason to introduce route groups,
   dashboards, mobile menus or alternate authenticated shells for this chapter.
5. **Photographs support assessment.** No filters, text overlays obscuring a room,
   carousel, invented property imagery or visual treatment that suggests a fake
   listing is real.
6. **Premium includes accessibility.** Legibility, keyboard access, touch size,
   error recovery, both themes and long Macedonian content are design requirements.
7. **Small implementation surface.** Reuse presentational components and semantic
   tokens. No design-system framework, external font dependency, new transport,
   animation library, UI kit or global state store is needed.

The design supports anonymous discovery today. The proposed future
find → assess → contact value proposition remains a product recommendation;
Chapter 3 must not promise that the unfinished journey already works.

## 4. Design system specification

### 4.1 Reference analysis and translation

The inspected homepage uses an ivory canvas, burgundy masthead accents, a large
centered two-part serif headline with an italic second phrase, an early Browse
CTA, a panoramic interior image, fine rules, a compact explanatory section and
a burgundy footer. Preserve the relationship between typography, image and empty
space rather than exact pixel positions.

Translate the identity as follows:

| Reference characteristic                        | Production interpretation                                                                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Journal masthead                                | Style the current approved name editorially; retain actual Home/Listings navigation and functional locale/theme utilities. No concept monogram or renamed brand by default. |
| Large italic phrase                             | One short emphasized phrase within a readable heading; no fixed line breaks required to imitate the sample. Localization owns phrasing.                                     |
| Broad framed interior photograph                | One appropriately licensed/approved illustrative hero asset, separate from inventory, with stable dimensions and responsive crop. Asset gate in section 14.                 |
| Folio numbers, “edition” and editorial captions | Optional quiet grouping only where meaningful. Omit fictitious editions, “editor's selection,” prototype notices and invented rankings.                                     |
| Printed rules                                   | Low-key separators for structure; stronger, distinct input boundaries and focus rings for interaction.                                                                      |
| Editorial catalog                               | Two columns at usable desktop/tablet widths, photo-led articles with untruncated facts. Retain current 4:3 catalog image contract.                                          |
| Small reference controls                        | Increase to accessible sizes; do not reproduce tiny captions, inputs or hit areas.                                                                                          |

Do not copy the isolated prototype's demo filtering, fixed MK/light specimen
labels, hidden mobile Home link, sample inventory, live result-count region,
sale-only price/m² sample logic or mixed catalog image aspect ratios.

### 4.2 Semantic colors

Implement through [tokens.css][tokens] `:root`/`.dark` and existing `@theme inline`
aliases, consumed as Tailwind semantic utilities. Preserve token names. Do not
scatter brand hex values through feature JSX or add a parallel Tailwind config.
These are proposed implementation values; actual rendered-state checks are 3A/3D
acceptance work.

| Existing token                       | Light                 | Dark                  | Meaning                                                        |
| ------------------------------------ | --------------------- | --------------------- | -------------------------------------------------------------- |
| `--background`                       | `#FAF5EB`             | `#211A1B`             | Warm paper / deep warm charcoal canvas                         |
| `--foreground`                       | `#302A27`             | `#FFF4E4`             | Main reading text                                              |
| `--surface`                          | `#FFFDF7`             | `#2B2324`             | Controls and restrained raised surfaces                        |
| `--on-surface`                       | `#302A27`             | `#FFF4E4`             | Text on those surfaces                                         |
| `--surface-muted`                    | `#EFE7DA`             | `#352B2D`             | Quiet grouping and media fallback                              |
| `--on-surface-muted`                 | `#6C6058`             | `#D1BDB1`             | Secondary facts, captions and hints                            |
| `--border`                           | `#CFC2B0`             | `#66504F`             | Decorative rules; not sufficient as the sole control boundary  |
| `--input`                            | `#8A7768`             | `#A18D82`             | Perceivable input/select boundary                              |
| `--focus-ring`                       | `#702F37`             | `#EFBAC1`             | Keyboard focus against page/control surfaces                   |
| `--primary`                          | `#702F37`             | `#EFBAC1`             | Main action, selected state and burgundy identity              |
| `--on-primary`                       | `#FFF7ED`             | `#35171D`             | Text on primary fill                                           |
| `--accent`                           | `#96432E`             | `#EFB08F`             | Restrained warm secondary emphasis                             |
| `--on-accent`                        | `#FFFFFF`             | `#371B0E`             | Text if accent is used as a fill                               |
| `--destructive` / `--on-destructive` | `#B91C1C` / `#FFFFFF` | `#FCA5A5` / `#450A0A` | Retain current error semantics, with explicit labels           |
| `--success` / `--on-success`         | `#166534` / `#FFFFFF` | `#86EFAC` / `#052E16` | Retain current genuine success semantics                       |
| `--warning` / `--on-warning`         | `#FACC15` / `#422006` | `#FDE68A` / `#422006` | Retain warning pair; warning foreground belongs on its fill    |
| `--disabled` / `--on-disabled`       | `#E4DBCE` / `#62564E` | `#403437` / `#CBB8B4` | Explicit unavailable state; never create a fake future control |
| `--skeleton`                         | `#DED3C5`             | `#403437`             | Existing shell suspense placeholder only; no catalog skeleton  |

Calculated opaque-color checks on 6 November 2026: across background, surface and
surface-muted, main-text minimum contrast is 11.51:1 Light / 12.58:1 Dark;
secondary text 4.96:1 / 7.57:1; input boundaries 3.48:1 / 4.33:1; focus
7.96:1 / 8.12:1. Primary text/fill pairs are 9.20:1 / 9.65:1.
These calculations are planning evidence, not rendered WCAG conformance.

The reference's light decorative border has approximately 1.61:1 contrast on
paper, so use `border-input` or an independently verified boundary for controls.
Current form boundaries use `border-on-surface-muted/70`; explicitly verify or
replace that presentation with the input token during 3C. Never infer contrast
from a swatch when opacity, hover, disabled states or a different surface apply.

Dark mode interprets the journal as warm charcoal and cream, with pale berry
actions. It must not be a sepia overlay on photographs. The footer can use primary
fill/on-primary in Light and surface/foreground with burgundy rules in Dark;
avoid a large pale-pink footer simply because dark primary is lighter. Error and
selected states must be distinguished by text, role and shape, not hue alone.

### 4.3 Typography and content rhythm

Retain the existing Geist Latin/Cyrillic `--font-sans` and Geist Mono ownership in
the locale layout. Add only `--font-display: Georgia, "Times New Roman", serif`
to the CSS-first theme for display headings. This uses installed system fonts;
it does not download, bundle or license a new font. Georgia matches the inspected
study on this Windows environment. Fallbacks vary across platforms: verify real
Macedonian glyphs (including Ѓ, Ќ, Љ, Њ, Џ, Ѕ and lower case) and Latin, roman
and italic. Do not assume identical metrics. A custom local font requires a
separate asset/license/size decision before substitution.

| Role                         | Proposed size / line height             | Usage                                                              |
| ---------------------------- | --------------------------------------- | ------------------------------------------------------------------ |
| Home display H1              | 40/44 mobile; fluid up to 76/80 desktop | Georgia regular; short italic accent phrase in primary color       |
| Catalog H1                   | 32/36 mobile; up to 48/54 desktop       | Serif, compact introduction rather than a second oversized hero    |
| Section heading              | 24/30 mobile; 28/34 desktop             | Serif, clear hierarchy                                             |
| Card title                   | 22/28 mobile; 26/32 desktop             | Serif regular; no clamp or fixed text height                       |
| Asking price                 | 24/30 mobile; 28/34 desktop             | Strong serif numeral treatment; clear currency, no cramped italics |
| Body / form values           | 16/24; body may use 16/26               | Geist, practical reading and mobile input legibility               |
| Labels / secondary facts     | 14/20                                   | Geist; labels remain visible and associated                        |
| Decorative eyebrow / caption | 12/18 minimum                           | Restrained tracking; not the only carrier of essential facts       |

Use rem-based values, normal wrapping and short paragraphs. Avoid all-caps
functional labels, tracking on long Macedonian strings, and italic descriptions
or forms. Body measure is approximately 60–68 characters; the display heading
can use a wider 16–20-character composition without forced platform-specific
line breaks. One semantic H1 per ordinary page. Do not split a translated sentence
by slicing a string at runtime; an emphasized phrase must be a typed, complete
dictionary entry or preserve the existing complete heading until copy is agreed.

### 4.4 Spacing, containers and geometry

- Reuse the Tailwind spacing scale: 4, 8, 12, 16, 24, 32, 48, 64 and 80px. No
  new spacing framework. Compact interfaces use 8–16px internal spacing;
  homepage sections use 32–64px, with at most 80px on wide screens.
- Retain `max-w-6xl` (72rem outer container), centered, with 16px gutters below
  640px, 24px at `sm`, 32px at `lg`. Shared header/home/catalog/footer align.
  Do not adopt the prototype's wider canvas without a later measured reason.
- Card columns: one below 768px; two from 768px upward, including 1280/1440px.
  Gap 24px, optionally 32px at `lg` after long-content verification. No masonry,
  arbitrary featured spans, row reordering or three-column return at `xl`.
- Set existing radius primitives to small 2px, medium 4px, large 6px, extra-large
  8px. Controls use medium; catalog photos 0–4px; articles use rules and paper
  rather than padded rounded tiles. Focus rings must not be clipped.
- Borders are normally 1px. Use decorative rules to separate sections/card facts,
  not a border around every nested element. Keep a sufficiently strong outline
  where the boundary communicates a control.
- Proposed elevation: `--elevation-sm: 0 1px 2px rgb(48 42 39 / 0.06)` in
  Light, `0 1px 2px rgb(0 0 0 / 0.24)` in Dark; medium elevation is reserved
  and unused by these pages. Cards and section groups should use no shadow.
  Do not create overlays just to use an elevation token.

### 4.5 Controls, icons and motion

Keep native form elements and existing Button variants. Primary actions are
compact burgundy rectangles with at least a 44px height and adequate horizontal
padding; primary hit targets aim for 44×44 CSS pixels even when the visual mark
is smaller. A 44px design target is stricter than WCAG's minimum, not a claim
about the standard's exact minimum. Labels must wrap instead of clipping.

Keep the global 3px focus outline and visible offset. Hover treatment must remain
legible; no moving buttons or photographic lift/zoom. Active and selected states
retain their current semantics. Verify actual `hover:bg-primary/95` rendering
if retained, including dark mode. Disabled styling must not rely on opacity alone.

Use existing Lucide icons only for an understood purpose; decorative arrows are
`aria-hidden`. An internal catalog link must not be styled as an external link
through a misleading external-link icon. No icon-only theme or locale controls,
custom icon family, logo dependency, animation package or automatic carousel.
Preserve [global reduced-motion behavior][globals]; limit optional transitions to
color/opacity, at most 150ms, and remove them under reduced motion.

## 5. Homepage layout specification

### Desktop composition

```text
Skip link → editorial public header, real navigation and utilities
Thin rule
Short locality/product eyebrow
Centered serif H1 with one short italic phrase
Brief truthful explanation
Browse listings → existing localized catalog
Approved architectural photograph, wide but bounded
Optional factual caption / required credit
Thin rule → three compact explanatory columns
Purposeful footer
```

Keep the primary action before photography in DOM and visual order. It uses the
existing localized route helper and `prefetch={false}`. Do not add a homepage
search form, category tabs, counters, featured listings, contact capture or
newsletter form. The largest image must not delay access to the catalog.

The three existing explanatory blocks become an editorial strip with slim
separators, short headings and real present-tense information: search by keyword
and the supported types; read asking price/area/location; read asking-price/m²
when supplied. Remove “future results” language and avoid “comparable pricing”
copy that implies an implemented comparison tool. Do not promise optional rooms
or images on every listing. Supportive copy may describe the catalogue without
claiming that its inventory is complete, vetted or limited to residential roots.

Retain existing product names in the dictionaries until separately approved:
Macedonian “Недвижности” and English “Real Estate Frontend”. Present this naming
limitation openly at review; do not silently replace either with Домашен журнал.
The latter remains the design concept name in documentation.

### Photography and performance

The future approved hero uses natural interior/architectural photography,
straight verticals and a crop that retains room context. Proposed ratio: about
3:1 on desktop, 3:2 on mobile; the catalog remains 4:3. Explicit dimensions or an
aspect-ratio container prevent layout shift. No image text overlays, filters,
video or client-side carousel. It must not look like a featured available listing.

Before adding an asset, record source, permitted use/license, attribution needs,
owner selection and intended crop. Use the existing Next Image pipeline with
correct responsive sizes; do not add a third-party image host or weaken the
backend-media trust boundary. Optimize to a restrained source asset (target at
most about 300KB for the desktop hero source, subject to visible quality) and
check delivered responsive resources. Do not preload all imagery; choose any
hero loading priority based on the actual viewport/LCP role and installed Next
documentation. Asset bytes are an implementation target, not measured evidence.

The generated study photograph is not approved for production. If a suitable
asset is not available, 3B's photo portion stays blocked until the owner supplies
or approves an asset, or explicitly accepts a photo-free editorial variant.
Do not quietly substitute an unrelated stock photo, synthetic property, broken
frame or fake loading placeholder to declare the design complete.

### Mobile and states

Stack header utilities, eyebrow, heading, short description and full-width or
comfortably sized CTA before the image. Reduce whitespace to 24–40px; preserve
the typography hierarchy without shrinking practical text. Explanatory columns
stack with horizontal rules. The footer wraps naturally. No mobile-only feature
menu or alternate brand. The static home has no invented loading/error/empty
inventory states; inherited app feedback receives token consistency only.

## 6. Public catalog layout specification

### 6.1 Page and form

```text
Same public header
Compact serif H1 + one short explanatory paragraph
Thin ruled search region:
  labelled keyword + hint | listing type | property type | Search
  existing field errors / pending feedback / reset as applicable
True localized result count
Two-column editorial articles (one column on mobile)
Existing previous / current-page / next pagination
Same footer
```

Reduce the current catalog's 56/80px top padding to about 24px mobile / 32px
desktop, and the introduction-to-form gap to 24px. Preserve a clear hierarchy,
but prioritize search and the first results over a magazine cover on this page.
The form spans the available container; remove the heavy rounded-panel effect
through presentation only. Do not hide filters behind disclosure or a dialog.

Retain `Form`, action, GET semantics, `prefetch={false}`, names, values, hint/error
IDs, keyed controls and [committed-control lifecycle][committed-controls]. Submit
keeps page-reset behavior. Reset remains a link with the existing conditional
presence and clean destination. Native select options remain unchanged.

Layout: below 640px each field and submit stacks; from 640–1023px keyword takes
the full row, selects share a row when labels/values fit, submit can span the row;
at 1024px upward use the current readable four-track arrangement. Minimum select
width is about 14rem at the wide arrangement. All widths retain `min-w-0`, labels,
hints, 16px field values and 44px control height. No placeholder-only labels.

### 6.2 Listing article

Proposed DOM and reading order: photograph → textual listing/property type → H2
title and location → labelled asking price, area, optional rooms and optional
price/m². Asking price is the strongest fact by size/color; title is the strongest
textual identifier. Use a ruled facts block with price first and enough wrapping
space, not a cramped four-column table. Card styling should read as a composed
photo and caption rather than a padded dashboard tile.

Retain article `aria-labelledby`, unique H2 IDs and actual backend `lang` on
title/location. Fixed UI labels remain in the route language. Preserve location
deduplication and all existing number/currency formatters. Optional values keep
their current `!== undefined` checks, including valid zero. Do not infer monthly
rent or suppress existing rent price/m² based on the isolated sample design.
Any future price-basis change requires contract/product work outside this chapter.

Maintain all four root labels and source ordering. No truncation, line clamp,
fixed title height, guessed address, “verified” badge, synthetic cover image,
ranking index, agency badge, favorite, photo count or “view details” affordance.
Cards have no link wrapper, tab stop, click handler or pointer/hover treatment
suggesting navigation until a real detail destination exists in a later chapter.

Media remains 4:3 for success, absent/rejected source and runtime failure. Retain
safe origin/path resolution, empty alt on the redundant preview and localized
fallback text. Change only responsive `sizes` to match the two-column geometry
(roughly 90vw below 768px, about 45–50vw above, bounded by the container), verified
against measured image width. Current 30vw desktop sizing is no longer appropriate.
Preserve image failure reset when a new source arrives and lazy-loading behavior.

### 6.3 Counts, pagination and feedback

The count comes from the actual response and remains a normal localized paragraph
in the named results section, not a new `aria-live` announcement. Keep backend
newest ordering and fixed page size 20. Preserve previous/next URLs, page labels,
`aria-current`, link pending indicators, conditional presence and filter context.
Do not add numeric page buttons, infinite scrolling, sort or a display-mode switch.

| State                                           | Existing meaning and proposed appearance                                                                                                                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Submitting search / following a pagination link | Retain inline `useFormStatus`/`useLinkStatus` feedback and existing content. Use legible status text; no route skeleton, full-page overlay or animation-only signal.                                                                               |
| Invalid keyword                                 | Keep field description/error associations, raw invalid input, alert summary and no backend request. Use error color plus explicit wording.                                                                                                         |
| Empty unfiltered catalog                        | Honest no-listings message, quiet ruled panel and no invented reset destination.                                                                                                                                                                   |
| Zero matching results                           | Existing localized explanation and clear-search recovery. Do not recommend nonexistent filters.                                                                                                                                                    |
| Positive out-of-range page                      | Explain page unavailability, preserve real total count and first-page recovery with filters. Remains a valid response, not 404 or zero-inventory claim.                                                                                            |
| Classified API/network/contract failure         | Preserve localized description, current-URL retry and genuine support ID/copy feedback when supplied. Support IDs wrap and remain selectable.                                                                                                      |
| Unexpected catalog error                        | Preserve route-local supported client retry and alert/heading semantics. Its current ErrorState uses a callback button, not a no-JS retry link; do not invent that capability. Do not alter the locale-root retry issue as incidental design work. |
| Missing/failed media                            | Same 4:3 neutral warm frame; honest localized fallback. No fake property photo.                                                                                                                                                                    |

Generic feedback components may receive narrow presentation changes if tokens
alone do not establish consistency. Their retry, clipboard, request-ID ownership
and race handling remain untouched. Preserve existing semantic levels where the
whole route is replaced versus an inline error inside a catalog with an H1.

## 7. Navigation and responsive behavior

Use the existing public shell. At wide widths the brand sits left, navigation
next, language/theme utilities at the right. At tablet widths utilities may wrap
onto a second aligned row. On mobile use a deliberate stack: brand/navigation,
then locale group and theme group, wrapping further when long labels demand it.
Both Home and Listings remain available. No hamburger, sticky overlay or hidden
utility is justified for two destinations.

Keep native links and actual `LocaleSwitcher` / `ThemeControl`, their accessible
group/navigation names, language annotations, `aria-current`, `aria-pressed`,
mounting/disabled behavior, persistence and hydration. The reference's fixed
“MK · light” text is not an implementation. Do not add a pathname client island
solely to copy a decorative active underline that the current header does not own.

DOM/tab order remains skip link → brand → Home → Listings → locale links →
System/Light/Dark buttons → page controls. Keep skip-link focus transfer to
`main-content`, `tabIndex={-1}`, visible focus and native navigation. Do not
reorder visually with CSS while leaving a contradictory keyboard sequence.
No positive tabindex, hover-only controls or automatic focus jump on rendering.

Breakpoints follow existing Tailwind defaults: `sm` 640, `md` 768, `lg` 1024,
`xl` 1280px. The catalog remains two columns at `xl`. Header wrapping responds to
actual content width; don't force a single row at a nominal breakpoint. Preserve
touch targets and no horizontal clipping at 320px and actual browser zoom.

Browser navigation behavior is unchanged: URL owns committed filters/page;
same-URL rerenders keep unsubmitted edits; distinct committed raw URLs restore
server defaults even when normalized filters match; Back/Forward and locale
switching preserve the accepted path/query semantics. Styling must not remove
the keys or logic that makes these cases work.

## 8. Accessibility and localization requirements

- Target WCAG 2.2 AA with semantic HTML, labelled native controls, keyboard access,
  no obscured focus, visible errors and status text. Automated checks complement
  manual review; passing axe alone does not certify accessibility.
- Normal text contrast at least 4.5:1; large text at least 3:1; meaningful control
  boundaries/focus at least 3:1 against adjacent colors. Check rendered blends,
  dark mode and selected/error/hover states, not just base palette pairs.
- Preserve landmarks, named sections, heading structure, real current-state
  semantics, announcement ownership and accessible media fallbacks.
- Keep the complete server dictionary and narrow client subset. Edit fixed copy
  in [mk][dictionary-mk], [en][dictionary-en] and [types][dictionary-types] only
  where needed; no external i18n framework or client-loaded home dictionary.
- Backend-authored content is never translated, reformatted as marketing copy
  or assumed to match route language. Preserve content `lang`, actual currency
  and locale number formatting.
- Test long Macedonian nav/error labels, multi-line titles, long location values,
  unavailable images, large prices, absent and zero optional facts. No clipping
  through the public shell's existing `overflow-x-clip` may be accepted as a fix.
- Verify 320/360/390/640/768/1024/1280/1440px, both locales, Light/Dark and System
  resolving to each. Test 200% native browser zoom and reflow to 320 CSS pixels;
  identify reduced-viewport simulations separately if used. Do not report a
  simulated viewport as a native zoom result.
- Use reduced-motion settings, keyboard-only tasks and a manual reading-order/
  accessible-name review. Capture any untested screen-reader or browser scope
  explicitly; current automated coverage is Chromium, not a Safari claim.

## 9. Future interface principles — documentation only

These layouts extend the visual identity without approving their implementation,
release priority, route creation or new controls in Chapter 3.

| Future experience  | Provisional composition                                                                                                                                                                               | Dependency / constraint                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property details   | Back-to-results context; editorial title/price/location; gallery; labelled facts; description; genuine advertiser/contact block. Mobile stacks in that order; desktop may place contact beside facts. | Reuse backend public detail/media in a later feature plan. Four roots must be supported; optional information stays honest. Preserve result URL context.               |
| Advertiser contact | Clearly name the responsible advertiser, show only supported real channels, explain unavailable contact honestly.                                                                                     | Public personal-contact contract is absent; agency contact is optional. No private-profile workaround, invented contact form or messaging promise.                     |
| Advanced search    | Same restrained typography/rules, grouped location/budget/space fields; accessible draft/committed behavior specified when needed.                                                                    | Reuse existing backend filters rather than invent APIs; price filters/sort require currency. Drawer, chips and dependent state need a separate UX/implementation plan. |

Do not reserve empty sections or render disabled future controls. Similar listings,
maps, favorites, account and agency surfaces remain separately planned. Future
chapter numbering remains provisional; this plan does not adopt discovery
roadmap priorities as approved product scope.

## 10. Exact existing code areas likely affected

Links identify inspected existing files. A path being listed is not permission
to change its logic. Do not create a generic component unless actual repetition
in the approved scope justifies it.

| Area                | Existing files / ownership                                                                                                     | Permitted later change                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Foundations         | [tokens][tokens], [globals][globals], [Button][button]                                                                         | Theme values, small display-font alias, radii and presentation states. Button props/behavior unchanged.                                    |
| Font ownership      | [locale layout][locale-layout]                                                                                                 | Inspect; no expected runtime edit for the system-serif strategy. Preserve Geist loading and document/provider ownership.                   |
| Public composition  | [public layout][public-layout], [home page][home]                                                                              | Containers, home composition and typed copy use; existing server behavior and route actions retained.                                      |
| Shell               | [header][header], [footer][footer], [locale switcher][locale-switcher], [theme control][theme-control], [skip link][skip-link] | Visual arrangement and classes; actual controls, accessibility and state ownership preserved.                                              |
| Copy                | [mk][dictionary-mk], [en][dictionary-en], [types][dictionary-types]                                                            | Present-tense current-capability copy, necessary editorial phrase keys. No product rename or unapproved metadata claims.                   |
| Catalog composition | [route][catalog], [results][results], [search form][search-form]                                                               | Wrapper spacing, form grouping and two-column layout; metadata/parser/retrieval logic unchanged.                                           |
| Articles/media      | [card][card], [media][media]                                                                                                   | Typography/fact grouping, frame presentation and accurate responsive sizes; no mapping or image trust changes.                             |
| Results feedback    | [empty state][empty-state], [pagination][pagination], [form status][form-status], [link status][link-status]                   | Legible consistent presentation only; semantics and conditional behavior unchanged.                                                        |
| Generic feedback    | [error state][error-state], [refresh error][refresh-error]                                                                     | Only necessary class/layout changes; do not alter callback/clipboard logic.                                                                |
| Regression evidence | [foundation E2E][foundation-tests], [route-frame E2E][frame-tests], [catalog E2E][catalog-tests] and colocated component tests | Preserve behavioral assertions; deliberately amend only approved geometry/copy expectations and add focused semantic coverage if required. |
| Durable closeout    | This document, [context][context], [README][readme]                                                                            | Reconcile status and approved visual decisions in 3E; preserve historical evidence and pending product decisions.                          |

Read-only boundaries include `src/proxy.ts`, `next.config.ts`, route helper logic,
`src/contracts/generated/openapi.d.ts`, `src/lib/api`, `src/lib/media`,
`src/features/listings/api`, `search`, `model` and `utils`. The committed-controls
module is inspected and tested but no change is expected. Any necessary departure
requires a specific scope decision, not an incidental redesign rewrite.

## 11. Explicit implementation boundaries

Preserve server-only public retrieval, generated types, strict validation,
`no-store` transport policy, URL normalization, pagination, locale/content-language
behavior, validated media origin, classified errors and current retry behavior.
Metadata stays localized with validated `SITE_URL`, clean canonicals/alternates,
and `noindex,follow` for every query-bearing catalog document. Proxy owns its
overwritten query-presence signal and HTML-versus-Flight distinction; preserve
`skipProxyUrlNormalize` and its tests.

Retain targeted catalog `prefetch={false}`, native GET/no-JS behavior,
`useFormStatus`/`useLinkStatus`, strict async Next.js params and Server Components
with narrow existing client islands. Do not introduce `loading.tsx`, a catch-all
proxy, browser fetch/cache, extra API call or a global store.

Excluded: new routes, details, contact, filters/sorting, accounts, saved items,
maps, AI, chat, uploads, listing submission, dashboards, database changes,
infrastructure changes, contract generation, dependency upgrades and new product
dependencies. Backend code/data and the shared product repository remain untouched.
Existing bug fixes outside presentation, including C2-06, require their own
bounded authorization and verification.

Only this permanent plan is created in the current tracked-source scope. This
task does not implement 3A, update the shared repository, or treat eventual
checkpoint completion as permission to stage/commit/merge. The owner manages Git.

## 12. Phased implementation checkpoints

Sequence is dependency-aware: **approved/audited plan → 3A → 3B → 3C → 3D → 3E**.
Do not begin a checkpoint until the previous focused result is reviewed and the
owner authorizes continuation. Keep each diff bounded and inspect the working
tree first. The current owner-authorized branch holds the plan checkpoint; any
later per-checkpoint branch/integration handling follows owner instructions.

Before runtime work, read applicable installed Next.js 16 guides under
`node_modules/next/dist/docs/`, including layout, image/font and form/navigation
guides relevant to the actual edit. Do not rely on remembered APIs or use a build
as permission to regenerate contracts.

### 3A — Design system and tokens

- **Purpose:** establish warm editorial foundations without changing page structure.
- **Dependency:** independent plan audit and owner acceptance; no production image
  or new brand needed.
- **Bounded scope:** semantic Light/Dark palette, display-font alias, radius and
  elevation values; retain existing globals/focus/reduced-motion ownership. Avoid
  globally converting every heading to serif; application is explicit in 3B/3C.
- **Affected areas:** `src/styles/tokens.css`, `src/styles/globals.css` only as
  necessary. No expected locale-layout edit. Button appearance should normally
  inherit tokens; any small required class change is explicitly reviewed.
- **Deliverables:** token diff, contrast evidence including status/disabled pairs,
  both-locale/theme samples of existing pages and recorded font fallback checks.
- **Acceptance tests:** focused formatting, lint/typecheck; existing Button and
  theme component tests; foundation theme initialization/persistence, focus,
  reduced-motion and contrast/browser checks; inspect catalog inputs/error states
  because shared tokens affect them immediately. `git diff --check`.
- **Non-goals:** page composition, card geometry, asset installation, new copy,
  font download, provider changes, design-system abstractions or new features.

### 3B — Public shell and homepage presentation

- **Purpose:** express the journal identity at entry while keeping actual navigation
  and controls immediate.
- **Dependency:** accepted 3A; confirm intended reference image; resolve hero asset
  rights/selection or explicitly approve a photo-free alternative before home work.
- **Bounded scope:** first review shell/header/footer styling, then homepage
  composition/copy and approved static image. These are two reviewable substeps;
  do not combine unrelated structural refactors. Retain existing names by default.
- **Affected areas:** public layout/home, shell components, necessary Button
  presentation and mk/en/types copy. A new local asset path is recorded only after
  its approval; no guessed asset is part of this plan's affected-file list.
- **Deliverables:** real mk/en home and shell in Light/Dark, mobile/tablet/desktop
  captures, approved asset provenance if used, copy and keyboard-order review.
- **Acceptance tests:** shell, locale/theme and dictionary tests; foundation
  landmarks/headings, skip link, navigation/query preservation, touch/focus,
  metadata and reflow checks. Confirm no home backend fetch, no extra client
  dictionary data, no new destination and no image layout shift. Preserve catalog
  entry metadata/history checks after navigation markup changes.
- **Non-goals:** final brand decision, homepage search/live inventory, new header
  controls, menus, new metadata policies, backend media changes or feature links.

### 3C — Catalog, search form and listing articles

- **Purpose:** make search and results coherent with Home Journal while preserving
  the accepted catalogue journey.
- **Dependency:** accepted 3A/3B shell and approved two-column proposal.
- **Bounded scope:** compact intro and ruled form; article typography/facts;
  one/two-column results; accurate image sizes; pagination and feedback visual
  alignment. Keep parsing, mapping, requests and state transitions unchanged.
- **Affected areas:** catalog route presentation; listing components named in
  section 10; narrow generic feedback presentation if necessary; associated tests.
- **Deliverables:** populated four-root cards and complete invalid/empty/out-of-range/
  error/pending/media state captures in both locales/themes; reviewed geometry diff.
- **Acceptance tests:** existing card, media, results, search-form, pagination,
  empty-state, pending-status and route page/metadata/error tests. Amend results'
  exact `xl:grid-cols-3` expectation and media's exact `sizes` expectation only to
  match the approved geometry. Update both catalog browser grid assertions to
  two columns at 1280/1440; retain every viewport, source order, 4:3 fallback,
  untruncated labels and no-overflow checks. Run accepted search/history/no-JS,
  query metadata, empty/recovery and pending browser coverage.
- **Non-goals:** new controls, new content fields, clickable cards, galleries,
  formatters/contract/parser changes, new result announcements or demo data.

### 3D — Responsive, accessibility and visual refinement

- **Purpose:** make the selected identity reliable across content, theme and size.
- **Dependency:** accepted 3B/3C; no unresolved asset/reference mismatch hidden by
  screenshot fixtures.
- **Bounded scope:** defects in wrapping, layout rhythm, contrast, focus, target
  sizes, theme equivalence and actual media sizing in the same presentation files.
  Avoid aesthetic scope expansion or a second design direction.
- **Affected areas:** scoped CSS/classes from 3A–3C and focused regression assertions.
- **Deliverables:** reviewed visual matrix; manual keyboard/zoom/reflow/reduced-motion
  checklist; unresolved findings with owners and reproduction evidence.
- **Acceptance tests:** section 13 matrix, existing axe/contrast/semantic tests,
  System resolving to Light/Dark and reload persistence; native zoom separately
  reported; long Macedonian/backend fallback content; request ID wrap/copy and
  media recovery. New tests only for changed meaningful semantics/interactions.
- **Non-goals:** new browser automation framework, blanket screenshot snapshots,
  dependency upgrades, feature work or weakening accepted tests to obtain green.

### 3E — Documentation reconciliation, verification and closeout

- **Purpose:** leave a truthful implementation record and independently auditable
  final bridge, without declaring the wider MVP launched.
- **Dependency:** accepted 3A–3D with real test/visual evidence.
- **Bounded scope:** reconcile this chapter, frontend context and README; record
  approved numerical refinements, actual affected files, limitations and evidence.
  Replace the old Chapter 3 search label with the bridge and keep later feature
  numbering provisional. Review the quality handoff without hiding unresolved items.
- **Affected areas:** frontend documentation and test evidence only. Runtime defects
  discovered here return to their bounded checkpoint before renewed closeout.
- **Deliverables:** final requirement/evidence matrix, decision log, actual full-gate
  results, remaining product decisions, independent implementation audit handoff.
  Shared-document update is separately gated by section 15; it is not required
  to fabricate product agreement to finish the frontend bridge.
- **Acceptance tests:** `npm run check` (already includes format, lint, typecheck and
  Vitest), `npm run build`, `npm run test:e2e`, recorded production metadata/history
  verification and `git diff --check`. Report each constituent gate. Avoid duplicate
  runs unless a failure/change warrants them. No ordinary gate contacts the backend.
- **Non-goals:** self-approving final audit, deployment/live supply certification,
  shared product rewrite without approval, migrations, API generation or Git publish.

## 13. Regression and visual acceptance criteria

### 13.1 Existing behavior coverage

Use the installed [package scripts][package] and current test fixtures. Normal
verification does not start the backend or access its database. Do not run
`npm ci` while FE-TOOL-01 remains unresolved; preserve healthy dependencies.

| Coverage                   | Existing evidence location                                                        | Requirement                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Shell/theme/locale         | `src/components/shell/*.test.tsx`, [foundation browser suite][foundation-tests]   | Same routes, utilities, semantics, hydration, persistence, keyboard order and focus.                            |
| Dictionary boundary        | `src/i18n/client-dictionary.test.ts`, `get-dictionary.server.test.ts`             | Complete server dictionaries; narrow client slice; both locales compile and render.                             |
| Articles/media/results     | Colocated tests for [card][card], [media][media] and [results][results]           | Four roots, optional/zero facts, currency, content language, source order, fallback/recovery and approved grid. |
| Search/state/pagination    | Colocated form, pagination, pending tests; [catalog browser suite][catalog-tests] | Native GET, page reset, safe normalization, dirty-input preservation, raw URL transitions and Back/Forward.     |
| Metadata/security boundary | Catalog `page.metadata.test.ts`, `src/proxy.test.ts`, catalog browser suite       | Query-bearing noindex, clean canonicals/alternates, HTML/Flight distinction and targeted prefetch mitigation.   |
| Failures/recovery          | Catalog `error.test.tsx`, generic feedback tests and catalog browser suite        | Current-URL retry, no-JS recovery, real support IDs, clipboard races, error classification and no fake success. |
| Layout/accessibility       | Foundation, [route-frame][frame-tests] and catalog browser suites                 | Current widths, both themes/locales, named landmarks, contrast, keyboard, reduced motion and non-clipping.      |

Two known geometry expectations require intentional change: results unit tests
expect `md:grid-cols-2 xl:grid-cols-3`; the catalog browser matrix and separate
grid test expect three columns at 1280/1440px. Change those to the approved
two-column design; do not remove tests or relax no-overflow/source-order rules.

After shell/navigation changes retain the established production-mode
metadata/history path in Chapter 2, including clean/query navigation, Back/Forward,
invalid/unknown/repeated parameters and document versus Flight query presence.
Repeated verification is warranted by that documented metadata lifecycle risk,
not by an arbitrary run count. Record exact command/selection and actual results.

### 13.2 Visual review matrix

At 3B/3C capture focused states; 3D/3E complete the matrix, reusing evidence only
when the relevant files have not changed. Screenshots belong in ignored planning
evidence, not production assets or an automatically adopted snapshot suite.

| Dimension    | Acceptance                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locale/theme | mk and en × Light/Dark; System resolving to each, persistence and hydration checked separately                                                                 |
| Width        | 320, 360, 390, 640, 768, 1024, 1280 and 1440 CSS pixels; one column below 768, two thereafter                                                                  |
| Home         | Heading/action remain legible before image; correct real brand/links; no claims unsupported by current product; responsive approved image with no layout shift |
| Catalog      | Search is prominent; labels/hints remain readable; count and pagination truthful; editorial hierarchy does not bury asking prices                              |
| Cards        | Long titles/location/currency, four roots, missing/zero optional facts and language fallback; all image states retain 4:3                                      |
| Feedback     | Invalid, zero unfiltered/filtered, out-of-range, API/network/malformed/unexpected failures, pending and clipboard feedback                                     |
| Interaction  | Keyboard, focus, touch, native GET/no-JS, dirty controls, Back/Forward, locale query preservation and reduced motion                                           |
| Zoom/reflow  | Actual 200% browser zoom plus 320px reflow; no hidden clipping or horizontal form/card scroll                                                                  |

Compare the approved identity, hierarchy and usable states, not pixel equality
with a static Windows font rendering. Avoid performance regressions through new
client bundles, unnecessary preload/download, decorative animation or broad
refactors. Record before/after image request sizes and layout-shift observations
if a hero or catalog `sizes` changes; do not invent Lighthouse or field metrics.
Stop test-owned browsers, frontend/fixture servers after verification; do not
terminate unrelated user processes.

## 14. Risks, tradeoffs and open design decisions

| Item                                       | Consequence and disposition                                                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cited new reference attachment unavailable | Saved Home Journal image was inspected. Owner confirms it matches or supplies the separate reference before 3B; material differences require plan amendment, not silent invention.                             |
| Production hero asset unresolved           | Block photo implementation in 3B until rights and selection are approved, or an explicit photo-free variant is accepted. Planning AI images stay ignored.                                                      |
| Working concept name                       | Preserve existing names; a final public name and any monogram require separate approval. This does not block token or layout work.                                                                             |
| System-serif variation                     | No new dependency or font request, but platform glyphs/italic metrics vary. Verify Cyrillic and wrapping; a custom font is a separately justified choice.                                                      |
| Editorial two-column density               | Fewer properties visible at once than the current three columns; larger imagery and readable facts are the deliberate tradeoff. Keep compact catalog intro/form.                                               |
| Faint rules versus usable forms            | Separate border/input tokens and test rendered contrast; decorative subtlety cannot weaken controls.                                                                                                           |
| Dark visual direction unimplemented        | Exact dark values remain plan parameters until tested. Do not claim light prototype checks establish dark production quality.                                                                                  |
| Global token blast radius                  | Existing feedback, locale/theme buttons and fallbacks change immediately; check them at 3A, not only closeout.                                                                                                 |
| Legacy quality items                       | [Quality handoff][quality] retains C2-06, BE-ENV-01, BE-DEP-01 and FE-TOOL-01. Do not fix or erase them incidentally. Separate backend upgrade/dependency work remains unauthorized.                           |
| Historical status wording                  | Chapter 2/context retain pending-audit wording despite owner-reported acceptance and merge/tag history. Reconcile only with actual accepted evidence in 3E; this plan does not self-issue historical approval. |

No future MVP decision is required merely to change current surfaces truthfully.
The plan approval, reference confirmation and asset decision are narrower than
agreement on a launch strategy.

## 15. Shared product update inventory and pending product decisions

Read-only reinspection found `realestate_docs` clean on `main...origin/main`,
HEAD `237f64465d19394c630bd819d6f7bf2ea0f25445`, with three tracked documents.
There is no separate `mvp` folder. Its current ownership/history is preserved.

The shared repository should eventually record approved product-level identity,
experience principles and cross-repository priorities. Exact CSS values, component
paths, checkpoint execution and frontend acceptance stay here. The inventory
below is a proposal, not authorization to edit shared files.

| Shared file / actual sections                                                                                                                                               | Proposed later update                                                                                                                                                   | Approval needed                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [README][shared-readme]: workspace example and repository responsibilities                                                                                                  | Correct the example spelling to actual `realestate_docs`; link the agreed product/technical authorities without duplicating the frontend plan                           | Exact shared edit scope and roadmap ownership                                     |
| [01-mvp-vision.md][shared-vision]: Product Vision, Primary Users, Core Product Experience, MVP Includes, Not Part of Current MVP, MVP Success Criteria, Long-Term Direction | Reconcile approved first-release promise, audience and scope; distinguish implemented facts from future work                                                            | Owner product decisions; visual approval alone is insufficient                    |
| Same: Map Exploration, Listing Limit, Future Intelligence, Current Implementation State                                                                                     | Record superseded assumptions with dates; correct stale Chapter-9/416-test statements and historical quota assumptions using actual technical evidence                  | Authorized factual reconciliation scope; separate map/AI product priorities       |
| [02-product-decisions.md][shared-decisions]: Frontend Decision                                                                                                              | Record Home Journal as approved visual direction; warm editorial identity, truthful discovery, accessibility and naming/asset caveats; link this frontend specification | Exact shared-edit authorization, even though visual direction is already approved |
| Same: opening first-MVP statement, Discovery, Listing Management, Agency, AI, AI Readiness, Smart Feature, Not Included Yet and Current Roadmap decisions                   | Resolve competing historical MVP/AI/map/supply assumptions through dated decisions; keep one agreed cross-project roadmap                                               | Explicit product/supply/priority and milestone-sequence approval                  |
| Same: Backend-First Decision                                                                                                                                                | Update implementation-state facts without changing backend ownership/contracts                                                                                          | Exact evidence-based edit scope                                                   |

Unresolved product choices include the anonymous discovery→assessment→contact
release proposal versus the historically expanded role scope; the AI-first
contradiction; map priority; agency/personal supply and actual partners/locality;
buy/rent coverage and structured rent-price basis; supported onboarding/contact
dependencies; operational ownership; shared roadmap authority and future numbering.
Retain these as pending. Do not describe the agency-assisted pilot or AI/maps
deferral as approved decisions in frontend marketing or shared documents.

Frontend 3E may correct its own chapter identity/status/linking and preserve
technical boundaries while shared edits remain gated. Avoid creating a competing
approved roadmap in this file. If product approval arrives later, update the
shared authority once and link it from this chapter.

## 16. Completion criteria and independent audit

### Plan readiness and current-task evidence

This plan is ready for independent review because the selected visual direction,
inspected code, preserved behavior, exact affected areas, proposed tokens and
bounded acceptance criteria are sufficient to execute after approval. The
reference and asset gates are explicit and limited to dependent work. Pending
MVP strategy does not make the visual bridge undefined.

For this documentation-only task validate Markdown formatting, actual local
links/paths, plan/source consistency, Git scope and `git diff --check`. Do not run
application builds, browser suites or backend services to validate a Markdown plan.
The document is initially untracked and unstaged; only the owner decides staging
and subsequent Git operations. Record actual audit findings and their disposition
instead of replacing this status with an unsupported completion claim.

The independent **plan audit** must check approval separation, reference handling,
token/contrast feasibility, realistic typography, complete state coverage, scope,
file ownership, media/grid test impact, executable checkpoints and shared-document
gates. Owner acceptance of that audit/plan is required before 3A.

Preparation verification on 6 November 2026:

| Check                | Result                                                                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown             | Existing Prettier formatter/check passed for this document.                                                                                                                                                                   |
| Local evidence links | All 43 reference definitions resolve; no unresolved reference labels. Ignored local artifacts are explicitly identified as optional historical evidence.                                                                      |
| Source consistency   | Read-only frontend and shared-product reviews completed. The unexpected-error retry description was corrected to distinguish its client callback from classified failures' no-JS link. These reviews do not approve the plan. |
| Scope                | Only this new chapter document is ordinary untracked work; existing tracked frontend files are unchanged. Backend and shared repository working trees remain clean.                                                           |
| Whitespace           | `git diff --check` and a separate check of the new untracked document passed.                                                                                                                                                 |
| Runtime verification | Not run: no production code, assets, dependencies or runtime configuration changed.                                                                                                                                           |

### Future implementation completion

1. Checkpoints 3A–3E have reviewed bounded diffs and their required evidence.
2. The real existing pages express Home Journal consistently in both languages
   and themes, with approved asset use or an explicitly accepted alternative.
3. The complete accepted Chapter 1/2 behavior survives; justified geometry/copy
   test changes preserve assertions about semantics, order, contracts and safety.
4. No fake controls, new features, backend/shared data changes or unauthorized
   dependencies/branding have entered the diff.
5. Required checks and manual visual/accessibility review pass, with limitations
   stated accurately. Outstanding legacy and product decisions remain visible.
6. Frontend documentation describes actual implemented state and approved decisions;
   shared edits are either separately approved/completed or explicitly pending.
7. A separate implementation auditor reviews the final code and evidence, records
   findings and verifies fixes. The implementing agent does not approve its own
   chapter closeout. Owner controls acceptance, staging and integration.

### Decision log

| Date       | Decision / evidence                                                                                         | State                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 2026-11-06 | Discovery and three visual concepts preserved as ignored local planning evidence                            | Historical investigation; recommendations were unapproved              |
| 2026-11-06 | Owner selected Home Journal, superseding the Clear Local recommendation                                     | Visual direction approved; brand, photo and product proposals excluded |
| 2026-11-06 | Clean development baseline checked; owner-authorized `feature/chapter-3-design-bridge` created at `499cc09` | Branch created; no source UI changes                                   |
| 2026-11-06 | Permanent plan prepared with 3A–3E, proposed tokens and explicit open gates                                 | Awaiting independent plan audit and owner approval                     |

[discovery]: ../planning/chapter-3/discovery-report.md
[visual]: ../planning/chapter-3/visual-exploration-report.md
[reference-home]: ../planning/chapter-3/visual-exploration/screenshots/02-home-journal-home-desktop.png
[reference-catalog]: ../planning/chapter-3/visual-exploration/screenshots/02-home-journal-catalog-desktop.png
[reference-mobile]: ../planning/chapter-3/visual-exploration/screenshots/02-home-journal-catalog-mobile.png
[context]: ../frontend-context.md
[chapter1]: chapter-1-frontend-foundation.md
[chapter2]: chapter-2-public-listings-catalog.md
[quality]: ../frontend-quality-handoff.md
[readme]: ../../README.md
[package]: ../../package.json
[shared-readme]: ../../../realestate_docs/README.md
[shared-vision]: ../../../realestate_docs/docs/01-mvp-vision.md
[shared-decisions]: ../../../realestate_docs/docs/02-product-decisions.md
[tokens]: ../../src/styles/tokens.css
[globals]: ../../src/styles/globals.css

[locale-layout]: ../../src/app/[locale]/layout.tsx
[public-layout]: ../../src/app/[locale]/(public)/layout.tsx
[home]: ../../src/app/[locale]/(public)/page.tsx
[catalog]: ../../src/app/[locale]/(public)/listings/page.tsx
[button]: ../../src/components/ui/button.tsx
[header]: ../../src/components/shell/public-header.tsx
[footer]: ../../src/components/shell/public-footer.tsx
[locale-switcher]: ../../src/components/shell/locale-switcher.tsx
[theme-control]: ../../src/components/shell/theme-control.tsx
[skip-link]: ../../src/components/shell/skip-link.tsx
[dictionary-mk]: ../../src/i18n/dictionaries/mk.ts
[dictionary-en]: ../../src/i18n/dictionaries/en.ts
[dictionary-types]: ../../src/i18n/dictionaries/types.ts
[search-form]: ../../src/features/listings/components/public-listings-search-form.tsx
[committed-controls]: ../../src/features/listings/components/public-listings-committed-controls.tsx
[results]: ../../src/features/listings/components/public-listings-results.tsx
[card]: ../../src/features/listings/components/public-listing-card.tsx
[media]: ../../src/features/listings/components/public-listing-media.tsx
[empty-state]: ../../src/features/listings/components/public-listings-empty-state.tsx
[pagination]: ../../src/features/listings/components/public-listings-pagination.tsx
[form-status]: ../../src/features/listings/components/public-listings-form-status.tsx
[link-status]: ../../src/features/listings/components/public-listings-link-status.tsx
[error-state]: ../../src/components/feedback/error-state.tsx
[refresh-error]: ../../src/components/feedback/refresh-error-state.tsx
[foundation-tests]: ../../tests/e2e/foundation.spec.ts
[frame-tests]: ../../tests/e2e/catalog-route-frame.spec.ts
[catalog-tests]: ../../tests/e2e/public-listings.spec.ts
