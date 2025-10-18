import { App, Editor, MarkdownView, Modal, Notice, Plugin, TFolder, TFile, PluginSettingTab, Setting } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import FileNameReact from './react/FileNameModal';

// --- Settings Interface ---
// Defines the shape of our settings data
interface CommitAndEmbedSettings {
    theoremCounter: number;
}

// --- Default Settings ---
// The default values when the plugin first loads
const DEFAULT_SETTINGS: CommitAndEmbedSettings = {
    theoremCounter: 0
}

// --- FileNameModal Class (React-backed) ---
// This modal mounts the React component into the modal content.
class FileNameModal extends Modal {
    result: string;
    onSubmit: (result: string) => void;
    private container: HTMLDivElement;
    private root: Root | null = null;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.container = document.createElement('div');
    }

    onOpen() {
        const { contentEl } = this;
        // Let the React component render its own header; append container and mount
        contentEl.appendChild(this.container);

        this.root = createRoot(this.container);
        this.root.render(
            React.createElement(FileNameReact, {
                onSubmit: (name: string) => {
                    this.result = name;
                    this.close();
                    this.onSubmit(this.result);
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
// This is the core of your plugin
export default class CommitAndEmbedPlugin extends Plugin {
    settings: CommitAndEmbedSettings;

    async onload() {
        // Load settings from disk when the plugin loads
        await this.loadSettings();

        // Add a settings tab to the plugin settings
        this.addSettingTab(new CommitEmbedSettingTab(this.app, this));

        // Add your main command
        this.addCommand({
            id: 'commit-and-embed-selection',
            name: 'Commit and Embed Selection',
            editorCallback: async (editor: Editor, view: MarkdownView) => {
                
                // 1. Get the user's selected text
                const selectedText = editor.getSelection();
                if (!selectedText) {
                    new Notice('Error: No text selected.');
                    return;
                }

                // 2. Open the modal to ask for a file name
                new FileNameModal(this.app, async (fileName) => {
                    // This code runs after the user presses Enter in the modal
                    if (!fileName) {
                        new Notice('Cancelled.');
                        return;
                    }

                    // 3. Increment and save the theorem counter
                    const newTheoremNumber = this.settings.theoremCounter + 1;
                    this.settings.theoremCounter = newTheoremNumber;
                    await this.saveSettings();

                    // 4. Define paths and check if the "Theorems" folder exists
                    const theoremFolder = 'Theorems';
                    // sanitize fileName (remove trailing/leading whitespace and strip slashes)
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

                    // 6. Define the content for the new file

					//Lets try to avoid directly putting Proof & Details in the block
					const newFileContent = `---
tags: [theorem, category-theory]
details: "Add private notes or context here."
---

> [!theorem] Theorem ${newTheoremNumber}: ${safeName} ^${blockId}
> ${selectedText}
`;

                    const proofSection = `

## Proof & Details

(Write proof, related examples, or additional context here...)
`;

                    try {
                        // 7. Create the new file (without Proof & Details)
                        let created: TFile | null = null;
                        try {
                            created = await this.app.vault.create(newFilePath, newFileContent);
                        } catch (createErr) {
                            // propagate to outer catch to handle duplicate/existing file error
                            throw createErr;
                        }

                        // 7a. Append the proof section after creation so the original editor never receives it
                        try {
                            if (created instanceof TFile) {
                                await this.app.vault.append(created, proofSection);
                            } else {
                                const maybeFile = this.app.vault.getAbstractFileByPath(newFilePath);
                                if (maybeFile instanceof TFile) {
                                    await this.app.vault.append(maybeFile, proofSection);
                                    created = maybeFile;
                                } else {
                                    console.warn('Could not locate created file to append proof section.');
                                }
                            }
                        } catch (appendErr) {
                            console.warn('Appending proof section failed:', appendErr);
                        }

                        if (created instanceof TFile) {
                            // read file to ensure vault/cache have the latest content
                            await this.app.vault.read(created);
                            // notify metadata cache that the file changed so embeds/transclusions refresh
                            this.app.metadataCache.trigger('changed', created);
                        }
                        
                        // 8. Define the embed link to point ONLY to the block ID
                        const embedLink = `![[${newFilePath}#^${blockId}]]`; 
                        
                        // 9. Replace the user's selection with the embed link
                        editor.replaceSelection(embedLink);

						new Notice(`Theorem "${safeName}" created successfully.`);

                    } catch (err) {
                        console.error("Error creating file:", err);
                        new Notice(`Error: File "${safeName}" might already exist.`);
                    }
                }).open();
            }
        });
    }

    onunload() {
        // Clean up anything if needed when the plugin is disabled
    }

    // Method to load settings
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    // Method to save settings
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
