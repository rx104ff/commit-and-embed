# Commit and Embed — Obsidian Plugin

A small Obsidian plugin to extract a selection into a new note (Theorem, Lemma, Proposition, Corollary, Definition), create a block ID, and replace the selection with an embed to that new note. The new note is created in a configurable folder and the plugin appends a Details / Proof section when appropriate.

## Requirements
- Node.js >= 16
- Obsidian (for testing inside a vault)

## Install (development)
1. Clone into your vault plugin folder or a dev folder:
   - Vault: .obsidian/plugins/math-input
2. Install dependencies:
   - npm install
3. Start the dev build/watch:
   - npm run dev
4. Reload Obsidian and enable the plugin in Settings → Community plugins.

## Commands
- "Commit and Embed Selection" — extracts selected text, prompts for item type and name, creates a new note, inserts an embed to the created block in-place.

## Settings
Open Settings → Math Input (Commit & Embed) to configure:
- Target folder — where created items are saved (will be created if missing).
- Theorem Counter — numeric counter used in item labels (can be reset).

## Behavior notes
- Created item types: Theorem, Lemma, Proposition, Corollary, Definition.
- Definitions append a "Details" section; other types append "Proof & Details".
- The plugin creates a unique block ID (^thm-<timestamp>) and embeds only that block.
- The Proof/Details section is appended to the created file after creation to avoid leaving stray content in the source note; the plugin forces a vault update so the source note refreshes immediately.

## Building / Releasing
- Build for production: npm run build
- Include `main.js`, `manifest.json`, and `styles.css` in a release.
- Update `manifest.json` version and `versions.json` as appropriate.

## Contributing
- Submit PRs or issues for bugs/features.
- Follow Obsidian plugin guidelines when releasing publicly.

## Notes
- The project is TypeScript-based and uses React for the modal UI.
- If you change entry files to .tsx, update the build config (esbuild/tsconfig) accordingly.
