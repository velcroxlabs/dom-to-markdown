# Contributing to dom‑to‑markdown

Thank you for your interest in contributing! This document outlines the process for contributing code, documentation, tests, and bug reports to the dom‑to‑markdown OpenClaw skill.

## Getting Started

### Prerequisites

- Node.js 18 or later
- OpenClaw installed and running
- Git

### Development Environment

1. **Fork** the [openclaw/skills](https://github.com/openclaw/skills) repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/skills.git
   cd skills/dom-to-markdown
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Ensure Playwright browsers are installed (required for integration tests):
   ```bash
   npx playwright install chromium
   ```

### Running Tests

The skill includes unit tests and integration (smoke) tests.

- **Unit tests** (`tests/unit/`): Run with `npm test`
- **Playwright smoke tests** (`tests/playwright-smoke.js`): Run with `npm run test:playwright`
- **All tests**: `npm run test:all`

Integration tests require internet access and may take a few minutes. They verify that the conversion works on real websites.

## Code Style

- Use **JavaScript Standard Style** (no configuration needed).
- Prefer **async/await** over callbacks or raw promises.
- Write **descriptive variable names** and add JSDoc comments for public functions.
- Keep functions small and focused on a single responsibility.

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** and ensure they follow the code style.
3. **Add or update tests** as needed. All new functionality should be covered by tests.
4. **Run the test suite** to ensure nothing is broken:
   ```bash
   npm run test:all
   ```
5. **Commit your changes** with clear, descriptive commit messages.
6. **Push your branch** and open a pull request against the `openclaw/skills` repository.
7. **Describe your changes** in the PR, linking to any related issues.
8. **Respond to review feedback** promptly.

## Reporting Bugs

Use the [GitHub Issues](https://github.com/openclaw/skills/issues) page.

Before opening a new issue, please:

1. **Search existing issues** to avoid duplicates.
2. **Include the version** of dom‑to‑markdown (check `package.json`).
3. **Describe the problem** in detail: what you expected, what actually happened, steps to reproduce.
4. **Provide the URL** (if applicable) and the exact command or code you ran.
5. **Include error messages** and logs (if any).

## Feature Requests

Feature requests are welcome! Open an issue and label it as **enhancement**. Describe the use case and why the feature would be valuable to the skill.

## Adding New Integration Test Sites

To expand the smoke‑test suite:

1. Add the URL to `tests/smoke-sites.js` in the appropriate category (`static`, `spa`, or `framework`).
2. Run the smoke test to verify the site works:
   ```bash
   npm run test:playwright
   ```
3. If the site requires special handling (authentication, custom wait‑for selector), update the smoke‑test logic accordingly.

## Documentation

- Update `README.md` for user‑facing changes.
- Update `SKILL.md` for OpenClaw skill‑specific documentation.
- Update `TODO.md` to reflect completed work.
- Add JSDoc comments for new public APIs.

## Questions?

Feel free to ask in the [OpenClaw Discord](https://discord.com/invite/clawd) or mention `@openclaw/core` in the PR.

Thank you for contributing!