import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFolder, TFile, PluginSettingTab, Setting } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import FileNameReact, { ItemKind } from './react/FileNameModal';

// --- Settings Interface ---
interface CommitAndEmbedSettings {
    theoremCounter: number;
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

// --- Main Plugin Class ---
export default class CommitAndEmbedPlugin extends Plugin {
    settings: CommitAndEmbedSettings;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new CommitEmbedSettingTab(this.app, this));

        this.addCommand({
            id: 'new-theorem',
            name: 'New Theorem/Definition/Lemma',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                const selectedText = editor.getSelection();
                if (!selectedText) {
                    new Notice('Error: No text selected.');
                    return;
                }

                new FileNameModal(this.app, async (result) => {
                    
                    const userTitle = result.name.trim() || 'Untitled'; 
                    const kind = result.kind;
                    const calloutLabel = kind; // "Theorem", "Definition", etc.

                    const newTheoremNumber = this.settings.theoremCounter + 1;
                    this.settings.theoremCounter = newTheoremNumber;
                    await this.saveSettings();

                    const theoremFolder = this.settings.targetFolder || 'Theorems';
                    
                    const safeTitle = userTitle.replace(/[/\\]+/g, '-').trim();
                    // Filename remains clear and searchable
                    const newFileName = `${kind} ${newTheoremNumber} - ${safeTitle}`; 
                    const newFilePath = `${theoremFolder}/${newFileName}.md`;

                    try {
                        const folder = this.app.vault.getAbstractFileByPath(theoremFolder);
                        if (!(folder instanceof TFolder)) {
                            await this.app.vault.createFolder(theoremFolder);
                        }
                    } catch (e) {
                        console.error("Error creating folder:", e);
                        new Notice(`Error creating folder "${theoremFolder}".`);
                        return;
                    }

                    const blockId = `thm-${Date.now()}`;
                    const kindLower = kind.toLowerCase();
                    const calloutTag = kindLower;

                    // --- THIS IS THE FIX ---
                    // Conditionally add parentheses only if a title was given
                    const fullTitle = (userTitle === 'Untitled')
                        ? `${calloutLabel} ${newTheoremNumber}` // e.g., "Theorem 7"
                        : `${calloutLabel} ${newTheoremNumber} (${userTitle})`; // e.g., "Theorem 7 (Yoneda Lemma)"

                    // --- END OF FIX ---

                    const newFileContent = `---
tags: [${calloutTag}, category-theory]
details: "Add private notes or context here."
---

> [!${calloutTag}] ${fullTitle} ^${blockId}
> ${selectedText}
`;

                    const appendSection = kind === 'Definition'
                        ? `
## Details

(Write details, related examples, or additional context here...)
`: `
## Proof & Details

(Write proof, related examples, or additional context here...)
`;
                    try {
                        // (Your `vault.create` and `vault.append` logic)
                        let created: TFile | null = null;
                        try {
                            created = await this.app.vault.create(newFilePath, newFileContent);
                        } catch (createErr) {
                            throw createErr;
                        }

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

                        const embedLink = `![[${newFilePath}#^${blockId}]]`;

                        editor.replaceSelection(embedLink);

                        // (Your `vault.modify` refresh logic)
                        try {
                            const activeFile = view.file;
                            if (activeFile instanceof TFile) {
                                const current = editor.getValue();
                                await this.app.vault.modify(activeFile, current);
                                this.app.metadataCache.trigger('changed', activeFile);
                                await view.leaf.openFile(activeFile);
                            }
                        } catch (refreshErr) {
                            console.warn('Refresh failed:', refreshErr);
                        }
                        
                        // The success notice will also use the new clean format
                        new Notice(`"${fullTitle}" created successfully.`);

                    } catch (err) {
                        console.error("Error creating file:", err);
                        new Notice(`Error: File "${newFileName}" might already exist.`);
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

        new Setting(containerEl)
            .setName('Counter')
            .setDesc('This is the current item number. You can reset it by changing the value.')
            .addText(text => text
                .setPlaceholder('0')
                .setValue(this.plugin.settings.theoremCounter.toString())
                .onChange(async (value) => {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue)) {
                        this.plugin.settings.theoremCounter = numValue;
                        await this.plugin.saveSettings();
                    }
                }));
    }
}
