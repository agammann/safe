# Changes

## 1.0.1

- Provide an explicit same-origin SVG favicon so browsers receive the intended icon instead of a missing default favicon request.
- Keep the application and exported report version aligned with the immutable source package.
- Verify the built icon loads and decodes without missing same-origin assets or local console errors.

## 1.0.0

Safe records evidence from three browser HTTPS diagnostic requests, saves the latest 20 reports without public IP addresses, compares session observations and exports readable JSON reports.

Unreadable saved data stays unchanged when a new check completes. New results remain available in the session until you explicitly reset saved data in Privacy. Duplicate saved identifiers are recovered once, and persistence errors remain visible after removal, reset or undo.

This release adds the MIT application license, updates available dependency patches, and provides a versioned source ZIP with checksums. Linux and Windows checks install, build, test and run the extracted source consumer before publication. The public website has a separate deployment verification.
