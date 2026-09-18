# Safe design verification

[Back to the README](../README.md) · [Verification record](verification.md)

Historical review of the original September 12, 2026 release. Capture paths below are relative to the repository root; ignored local captures are not included in the public repository.

final result: passed

## Source and intended adaptation

Source visual truth: https://preview.tabler.io/layout-vertical.html, captured locally as `docs/evidence/tabler-reference.png`.

Implementation: http://127.0.0.1:5173/, captured as `docs/evidence/safe-desktop.png`, `docs/evidence/safe-mobile.png`, and `docs/evidence/safe-light.png`. A clean desktop capture is published as `docs/safe-desktop.png`.

The user asked for an existing template to be chosen for Safe. This is a Tabler template adaptation, not a pixel clone of its fictional analytics dashboard. Original charts, sales, users, avatars, and illustrations are intentionally replaced with a functional WiFi check. Safe imports the actual Tabler CSS and icon components.

## Comparison context

Desktop source and implementation were reviewed together in one comparison input. CSS viewport: 1440 by 1000. Screenshots use browser-native density; no enlarged raster assets are used. The implementation has a 240 px sidebar and Tabler's slate surface palette. Browser scrollbar/capture differences are not treated as design drift.

Saved source pixels: 1425 by 990. Saved desktop implementation pixels: 1440 by 1000. Both were reviewed at their native density with capture edges accounted for, rather than asserting pixel equality. The full-page mobile capture is 375 by 1562 pixels for a 390 by 844 CSS viewport. Its height includes vertical scrolling content.

Mobile CSS viewport: 390 by 844, with an additional full-page home capture. The report, navigation drawer, privacy controls, and home view were inspected. Narrow layout has no horizontal document overflow; document scroll width was 375 px including the space reserved for the browser scrollbar within a 390 px viewport.

## Required surfaces

1. Typography: Inter is bundled locally. Hierarchy is readable and the main question wraps without clipping. Main explanatory report text is 14 px. Small labels and source metadata remain secondary. No external font service is contacted.
2. Spacing and layout: The existing sidebar, page headings, cards, report rows, and thin dividers follow Tabler. Simplified navigation and less dense content are intentional. Columns collapse to a single flow on mobile.
3. Colors and tokens: Slate backgrounds and blue actions match the selected dark template direction. A light alternative uses white surfaces and darker semantic text. Focus outlines are visible. No overall safety score or universal green status is used.
4. Image and icon quality: All icons are from the installed Tabler Icons package. No premium illustrations, copied profile photos, decorative placeholder drawings, or generated mockup screenshots are used as app UI.
5. Copy: Safe and WiFi terminology are consistent. Measured, Explained, and Unknown are distinct. Provider disclosure precedes the primary action. Unsupported capabilities are stated plainly.

## Iterations

Initial desktop comparison preserved the template structure but exposed small explanatory type. Explanations were increased to 14 px and supporting notices to 12 px. Mobile review found closed navigation remained keyboard discoverable; visibility was corrected and the accessibility tree rechecked. A compact heading lost a space when its line break was hidden; the text was corrected and the mobile screen recaptured. Navigation now returns the user to the top of the new view.

Post-fix desktop source and implementation were viewed together. Mobile and light-theme captures were inspected separately as intentional variants. No remaining actionable P0, P1, or P2 visual findings were observed. A separate focused crop was not necessary because headings, controls, and report rows were readable in the full-resolution captures.

## Functional checks and limits

Live check, repeat check, comparison, persistence after reload, report reopening, removal and undo, clear history, export file, theme switch, and mobile navigation were exercised. Browser console inspection returned no warnings or errors. See the [verification record](verification.md) for precise evidence and untested platforms.

This result describes the inspected Chromium layouts and core interactions. It does not claim universal browser or device compatibility.
