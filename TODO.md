# TODO / Future Improvements

## High Priority
- [ ] **Better SPA detection**: Improve confidence scoring for React/Vue/Angular/Next.js
- [ ] **Playwright multi‑browser support**: Add Firefox/WebKit options with auto‑fallback
- [ ] **Rate limiting & politeness**: Respect robots.txt, add delays between requests
- [ ] **Image extraction**: Download and localize images (with optional resizing)
- [ ] **PDF export**: Option to generate PDF alongside markdown

## Medium Priority
- [ ] **Table preservation**: Improve markdown table conversion from HTML tables
- [ ] **Code block language detection**: Auto‑detect programming language in code blocks
- [ ] **Social media embeds**: Convert Twitter/Instagram/YouTube embeds to markdown links
- [ ] **Authentication support**: Handle pages behind login (cookie injection)
- [ ] **Batch processing**: Parallel conversion of URL lists with progress tracking

## Low Priority
- [ ] **Internationalization**: Support for right‑to‑left languages, CJK character handling
- [ ] **Accessibility info**: Preserve ARIA labels and alt text in markdown
- [ ] **Custom rule system**: Allow users to define custom HTML‑to‑markdown rules
- [ ] **Plugin system**: Extend with third‑party converters (e.g., Readability, Mercury)
- [ ] **CLI tool**: Standalone command‑line interface for non‑OpenClaw usage

## Infrastructure
- [ ] **Comprehensive test suite**: Add end‑to‑end tests for top 100 sites
- [ ] **Performance benchmarking**: Compare extraction speed across methods
- [ ] **Error recovery**: Better handling of timeouts, network errors, malformed HTML
- [ ] **Documentation**: Add video tutorial, more real‑world examples
- [ ] **Community contributions**: Create contribution guidelines, issue templates

---

*Last updated: 2026‑02‑24 (v1.3.0)*