# Changelog

## 0.1.2 - 2026-07-20

### Fixed

- Prevented multi-image expand/collapse from shifting the page scroll position.
- Improved mobile card auto-selection so the card nearest the reading position is selected instead of a taller partially visible card.
- Restored the mobile active-card placeholder outline while keeping the selected card offset visible.
- Made bb title and content typography theme-driven through CSS variables, avoiding hard-coded theme font assumptions.

### Changed

- Mobile card active styling now works without hover and keeps the original dashed placeholder visible.
- Image carousel positioning uses non-smooth initial placement to avoid jumpy first-open behavior.

