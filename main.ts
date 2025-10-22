import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFolder, TFile, PluginSettingTab, Setting } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import FileNameReact, { ItemKind } from './react/FileNameModal';

// --- Settings Interface ---
// Defines the shape of our settings data
interface CommitAndEmbedSettings {
    theoremCounter: number;
    // configurable target folder for created items
    targetFolder: string;
}

// --- Default Settings ---
const DEFAULT_SETTINGS: CommitAndEmbedSettings = {
    theoremCounter: 0,
    targetFolder: 'Examples'
}

// --- FileNameModal Class (React-backed) ---
class FileNameModal extends Modal {
    resultName: string;
    resultKind: ItemKind;
    onSubmit: (result: { name: string; kind: ItemKind }) => void;
    private container: HTMLDivElement;
    private root: Root | null = null;

    constructor(app: App, onSubmit: (result: { name: string; kind: ItemKind }) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.container = document.createElement('div');
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.appendChild(this.container);

        this.root = createRoot(this.container);
        this.root.render(
            React.createElement(FileNameReact, {
                onSubmit: (res: { name: string; kind: ItemKind }) => {
                    this.resultName = res.name;
                    this.resultKind = res.kind;
                    this.close();
                    this.onSubmit(res);
                },
                onClose: () => {
                    this.close();
                }
            })
        );
    }

    onClose() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
        this.container.remove();
        const { contentEl } = this;
        contentEl.empty();
    }
}

export default class CommitAndEmbedPlugin extends Plugin {
    settings: CommitAndEmbedSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new CommitEmbedSettingTab(this.app, this));

        this.addCommand({
            id: 'new-theorem',
            name: 'New Theorem',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                // 1. Get the user's selected text
                const selectedText = editor.getSelection();
                if (!selectedText) {
                    new Notice('Error: No text selected.');
                    return;
                }

                // 2. Open the modal to ask for a file name + kind
                new FileNameModal(this.app, async (result) => {
                    const fileName = result.name;
                    const kind = result.kind;

                    if (!fileName) {
                        new Notice('Cancelled.');
                        return;
                    }

                    // 3. Increment and save the theorem counter (use same counter for all items)
                    const newTheoremNumber = this.settings.theoremCounter + 1;
                    this.settings.theoremCounter = newTheoremNumber;
                    await this.saveSettings();

                    // 4. Define paths and check if the configured folder exists
                    const theoremFolder = this.settings.targetFolder || 'Theorems';
                    const safeName = fileName.replace(/[/\\]+/g, '-').trim();
                    const newFilePath = `${theoremFolder}/${safeName}.md`;

                    try {
                        const folder = this.app.vault.getAbstractFileByPath(theoremFolder);
                        if (!(folder instanceof TFolder)) {
                            await this.app.vault.createFolder(theoremFolder);
                        }
                    } catch (e) {
                        console.error("Error creating folder:", e);
                        new Notice('Error creating "Theorems" folder.');
                        return;
                    }

                    // 5. Create the unique block ID
                    const blockId = `thm-${Date.now()}`;

                    // 6. Define the content for the new file (DO NOT include proof/details here)
                    const kindLower = kind.toLowerCase();
                    const calloutTag = kindLower; // e.g. "theorem", "lemma", "definition"
                    // Callout label keeps the kind capitalized
                    const calloutLabel = kind;

                    const newFileContent = `---
tags: [${calloutTag}, category-theory]
details: "Add private notes or context here."
---

> [!${calloutTag}] ${calloutLabel} ${newTheoremNumber}: ${safeName} ^${blockId}
> ${selectedText}
`;

                    // Decide what to append later: Definitions get "Details" instead of "Proof & Details"
                    const appendSection = kind === 'Definition'
                        ? `
## Details

(Write details, related examples, or additional context here...)
`: `
## Proof & Details

(Write proof, related examples, or additional context here...)
`;
                    try {
                        // 7a. Create the new file (without the appended section)
                        let created: TFile | null = null;
                        try {
                            created = await this.app.vault.create(newFilePath, newFileContent);
                        } catch (createErr) {
                            throw createErr;
                        }

                        // 7b. Append the appropriate section after creation
                        try {
                            if (created instanceof TFile) {
                                await this.app.vault.append(created, appendSection);
                            } else {
                                const maybeFile = this.app.vault.getAbstractFileByPath(newFilePath);
                                if (maybeFile instanceof TFile) {
                                    await this.app.vault.append(maybeFile, appendSection);
                                    created = maybeFile;
                                } else {
                                    console.warn('Could not locate created file to append section.');
                                }
                            }
                        } catch (appendErr) {
                            console.warn('Appending section failed:', appendErr);
                        }

                        if (created instanceof TFile) {
                            await this.app.vault.read(created);
                            this.app.metadataCache.trigger('changed', created);
                        }

                        // 8. Define the embed link to point ONLY to the block ID
                        const embedLink = `![[${newFilePath}#^${blockId}]]`;

                        // 9. Replace the user's selection with the embed link
                        editor.replaceSelection(embedLink);

                        // 10. Notify and refresh active file to ensure no trailing content remains visible
                        try {
                            const activeFile = view.file;
                            if (activeFile instanceof TFile) {
                                // modify the active file's contents in the vault to ensure Obsidian re-parses
                                const current = editor.getValue();
                                await this.app.vault.modify(activeFile, current);
                                this.app.metadataCache.trigger('changed', activeFile);
                                await view.leaf.openFile(activeFile);
                            }
                        } catch (refreshErr) {
                            console.warn('Refresh failed:', refreshErr);
                        }

                        new Notice(`${kind} "${safeName}" created successfully.`);

                    } catch (err) {
                        console.error("Error creating file:", err);
                        new Notice(`Error: File "${safeName}" might already exist.`);
                    }
                }).open();
            }
        });
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

// --- Settings Tab Class ---
// This creates the menu in Settings > Commit and Embed
class CommitEmbedSettingTab extends PluginSettingTab {
    plugin: CommitAndEmbedPlugin;

    constructor(app: App, plugin: CommitAndEmbedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Commit and Embed Settings' });

        // Folder name setting (configurable target folder)
        new Setting(containerEl)
            .setName('Target folder')
            .setDesc('Folder where created items will be saved. Will be created if it does not exist.')
            .addText(text => text
                .setPlaceholder('Theorems')
                .setValue(this.plugin.settings.targetFolder)
                .onChange(async (value) => {
                    const folderName = value.trim() || 'Theorems';
                    this.plugin.settings.targetFolder = folderName;
                    await this.plugin.saveSettings();
                }));

        // Add the setting to view/reset the counter
        new Setting(containerEl)
            .setName('Theorem Counter')
            .setDesc('This is the current theorem number. You can reset it by changing the value.')
            .addText(text => text
                .setPlaceholder('0')
                .setValue(this.plugin.settings.theoremCounter.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value, 10); // Convert text to a number
                    if (!isNaN(numValue)) {
                        this.plugin.settings.theoremCounter = numValue;
                        await this.plugin.saveSettings();
                    }
                }));
    }
}
