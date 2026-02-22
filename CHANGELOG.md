# Changelog

All notable changes to the OpenClaw DOM → Markdown skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-21

### Added
- Initial release of the DOM → Markdown skill for OpenClaw
- Smart page type detection (static, SPA, mixed) with framework identification
- Integration with OpenClaw browser tool for JavaScript rendering
- Support for `web_fetch` tool for static page extraction
- Clean HTML to Markdown conversion using turndown with custom rules
- Structured storage system organized by date and domain
- Comprehensive test suite with integration tests
- Full documentation including examples, use cases, and troubleshooting
- Configuration options for debug, wait times, and output directories
- Error handling with retry logic and fallback mechanisms
- Performance monitoring and statistics tracking

### Technical Specifications
- **OpenClaw Version**: 2026.2.13+
- **Browser Requirement**: OpenClaw browser enabled (`browser.enabled: true`)
- **Dependencies**: turndown (for HTML→Markdown conversion)
- **Node.js**: Compatible with Node.js 18+
- **Skill Location**: `~/.openclaw/workspace/skills/dom-to-markdown/`

### Known Limitations
- Skill requires execution within OpenClaw agent context (not standalone)
- Mixed page detection accuracy: ~50%
- SPA rendering requires adequate `waitTime` configuration
- Anti-bot mechanisms on some sites may block headless browser

### Migration Notes
- This is the initial release, no migration required
- Skill is compatible with OpenClaw's AgentSkills specification
- Configuration via `openclaw.json` skills.entries section

## [Unreleased]

### Planned
- Cache system to avoid re-extraction of previously processed URLs
- Improved detection accuracy for mixed pages (SSR + JavaScript)
- Authentication support (cookies, custom headers)
- Media extraction (images, linked PDFs)
- Plugin integration with OpenClaw's `browser_snapshot` hook
- Multi-language support for content extraction rules
- Structured data extraction (tables, lists, metadata)
- LightRAG integration for automatic memory ingestion