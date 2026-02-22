# GitHub Repository Setup

This document provides instructions for publishing the DOM → Markdown skill to GitHub.

## Option 1: Manual Setup (Recommended)

### 1. Create a New Repository on GitHub
1. Go to [GitHub](https://github.com/new)
2. Repository name: `dom-to-markdown` (or your preferred name)
3. Description: "OpenClaw skill to convert web pages to clean markdown with automatic page type detection"
4. Choose **Public** or **Private** (Public recommended for sharing)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### 2. Push Local Repository to GitHub
```bash
# Navigate to the skill directory
cd /home/jarvis/.openclaw/workspace/skills/dom-to-markdown

# Add the remote repository (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/dom-to-markdown.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Set Up GitHub Actions (Optional)
Create `.github/workflows/test.yml` for automated testing.

## Option 2: Using GitHub CLI (`gh`)

If you have GitHub CLI installed:

```bash
# Authenticate (if not already)
gh auth login

# Create repository
gh repo create dom-to-markdown \
  --description "OpenClaw skill to convert web pages to clean markdown" \
  --public \
  --source=. \
  --remote=origin \
  --push
```

## Option 3: Using Personal Access Token

### 1. Generate a Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic) with `repo` scope
3. Copy the token (you won't see it again)

### 2. Create Repository via API
```bash
# Set your token
export GITHUB_TOKEN="your_token_here"

# Create repository (replace USERNAME)
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d '{
    "name": "dom-to-markdown",
    "description": "OpenClaw skill to convert web pages to clean markdown",
    "private": false,
    "has_issues": true,
    "has_projects": false,
    "has_wiki": false
  }'
```

### 3. Push Code
```bash
git remote add origin https://$GITHUB_TOKEN@github.com/USERNAME/dom-to-markdown.git
git push -u origin main
```

## Repository Structure Overview

```
dom-to-markdown/
├── .gitignore           # Ignore node_modules, exports, etc.
├── CHANGELOG.md         # Version history
├── README.md            # Comprehensive documentation
├── SETUP_GITHUB.md      # These instructions
├── SKILL.md            # OpenClaw skill definition
├── package.json        # Dependencies and metadata
├── index.js            # Main entry point
├── src/                # Source code
│   ├── detector.js     # Page type detection
│   ├── converter.js    # Main conversion logic
│   └── browser-wrapper.js # OpenClaw browser integration
├── tests/              # Test suite
├── examples/           # Usage examples
└── [other documentation files]
```

## Post-Setup Steps

1. **Add Topics/Labels**: Add relevant topics like `openclaw`, `skill`, `markdown`, `web-scraping`
2. **Create Releases**: Use GitHub Releases for version tags
3. **Enable Issues**: For bug reports and feature requests
4. **Update OpenClaw Documentation**: Consider submitting to [ClawHub](https://clawhub.com)

## Publishing to ClawHub (OpenClaw Skill Registry)

Once the repository is on GitHub, you can publish it to ClawHub:

```bash
# Install clawhub CLI if not already
npm install -g @clawhub/cli

# Sync skill to registry
clawhub sync --publish
```

## Support

For issues with the skill or GitHub setup:
- Open an issue on the GitHub repository
- Join the OpenClaw community on [Discord](https://discord.com/invite/clawd)
- Check [OpenClaw documentation](https://docs.openclaw.ai)