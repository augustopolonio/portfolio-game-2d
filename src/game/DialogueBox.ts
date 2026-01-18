import Phaser from 'phaser';

export interface DialogueOptions {
    text: string;
    keyWord?: string;
    keyWordColor?: string; // hex color string like '#ff0000'
}

export default class DialogueBox {
    private scene: Phaser.Scene;
    private container!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Rectangle;
    private text!: any; // BBCodeText instance
    private isVisible = false;
    private pages: string[] = [];
    private currentPage = 0;
    private isTyping = false;
    private fullText = '';
    private charIndex = 0;
    private typewriterEvent?: Phaser.Time.TimerEvent;
    private visibleIndexToFormattedIndex: number[] = [];
    
    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.create();
    }

    private create() {
        const width = 600;
        const height = 100;
        
        this.background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.6);
        this.background.setStrokeStyle(3, 0x6e84e7);
        
        // Use the global plugin factory
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const add = this.scene.add as any;
        
        if (!add.rexBBCodeText) {
             console.error('RexBBCodeText plugin is not loaded into the factory!');
             // Fallback to standard Text if plugin fails, to at least show something
             this.text = this.scene.add.text(0, 0, '', {
                  fontFamily: '"Press Start 2P"',
                  fontSize: '14px',
                  color: '#ffffff',
                  wordWrap: { width: width - 20 }
             });
        } else {
             this.text = add.rexBBCodeText(0, 0, '', {
                fontFamily: '"Press Start 2P"',
                fontSize: '14px',
                color: '#ffffff',
                align: 'left',
                fixedWidth: width - 20,
                fixedHeight: height - 20,
                lineSpacing: 12,
                wrap: {
                    mode: 'word',
                    width: width - 20
                },
            });
        }
        
        this.text.setOrigin(0.5);
        
        this.container = this.scene.add.container(0, 0);
        this.container.add([this.background, this.text]);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);
        this.container.setVisible(false);
    }

    private paginateText(message: string): string[] {
        const maxChars = 100;
        const pages: string[] = [];
        
        let currentIndex = 0;
        const len = message.length;
        
        while (currentIndex < len) {
            let visibleCount = 0;
            let tempIndex = currentIndex;
            let splitIndex = -1;
            let lastSpaceIndex = -1;

            while (tempIndex < len) {
                const char = message[tempIndex];
                
                if (char === '[') {
                    // Check if it's a tag start
                    const closingBracket = message.indexOf(']', tempIndex);
                    if (closingBracket !== -1) {
                         tempIndex = closingBracket + 1;
                         continue;
                    }
                }
                
                visibleCount++;
                if (char === ' ') {
                    lastSpaceIndex = tempIndex;
                }

                if (visibleCount >= maxChars) {
                    splitIndex = tempIndex + 1;
                    break;
                }
                tempIndex++;
            }
            
            if (splitIndex === -1) {
                splitIndex = len;
            } else {
                if (lastSpaceIndex > currentIndex && lastSpaceIndex < splitIndex) {
                    splitIndex = lastSpaceIndex + 1;
                }
            }
            
            pages.push(message.slice(currentIndex, splitIndex));
            currentIndex = splitIndex;
        }

        return pages;
    }

    private startTypewriter() {
        this.isTyping = true;
        this.charIndex = 0;
        this.text.setText('');

        this.visibleIndexToFormattedIndex = [];
        for (let i = 0; i < this.fullText.length; i++) {
            const ch = this.fullText[i];
            
            if (ch === '[') {
                const closing = this.fullText.indexOf(']', i);
                if (closing !== -1) {
                    const tagContent = this.fullText.slice(i + 1, closing);
                    if (tagContent.indexOf('=') !== -1 || tagContent.startsWith('/')) {
                        i = closing; 
                        continue;
                    }
                }
            }

            this.visibleIndexToFormattedIndex.push(i);
        }
        
        this.typewriterEvent = this.scene.time.addEvent({
            delay: 20,
            callback: () => {
                if (this.charIndex < this.visibleIndexToFormattedIndex.length) {
                    const endIdx = this.visibleIndexToFormattedIndex[this.charIndex];
                    this.text.setText(this.fullText.substring(0, endIdx + 1));
                    this.charIndex++;
                } else {
                    this.finishTyping();
                }
            },
            loop: true
        });
    }

    private finishTyping() {
        this.isTyping = false;
        this.typewriterEvent?.destroy(); // Ensure timer is stopped
        this.text.setText(this.fullText);
    }

    private skipTypewriter() {
        if (this.isTyping) {
            this.finishTyping();
        }
    }

    show(messageOrOptions: string | DialogueOptions) {
        console.log('DialogueBox.show called with:', messageOrOptions);
        const { text, keyWord, keyWordColor } = typeof messageOrOptions === 'string'
            ? { text: messageOrOptions, keyWord: undefined, keyWordColor: undefined }
            : messageOrOptions;

        const gameWidth = this.scene.game.scale.width;
        const gameHeight = this.scene.game.scale.height;
        // Use a default zoom if camera not ready or simple calculation
        const camera = this.scene.cameras.main;
        const zoom = camera ? camera.zoom : 1;
        
        this.container.setScale(1 / zoom);
        // Position at bottom center, respecting zoom
        this.container.setPosition(gameWidth / 2, gameHeight - 560 / zoom);
        
        // Prepare text with replacements
        let processedText = text;
        if (keyWord) {
            let colorToUse = keyWordColor;
            
            // Fix Tiled #AARRGGBB format to #RRGGBB
            if (colorToUse && colorToUse.startsWith('#') && colorToUse.length === 9) {
                // Tiled exports as #AARRGGBB, we want #RRGGBB
                // Remove the Alpha channel (first 2 hex digits after #)
                colorToUse = '#' + colorToUse.substring(3);
            }

            const replacement = colorToUse 
                ? `[color=${colorToUse}]${keyWord}[/color]`
                : keyWord;
            // Replace all occurrences
            processedText = processedText.split('{0}').join(replacement);
        }
        
        console.log('Processed text:', processedText);

        this.pages = this.paginateText(processedText);
        console.log('Pages:', this.pages);
        this.currentPage = 0;
        
        this.showCurrentPage();
        
        this.container.setVisible(true);
        this.isVisible = true;
    }

    private showCurrentPage() {
        this.fullText = this.pages[this.currentPage];
        this.startTypewriter();
    }

    advance(): boolean {
        if (this.isTyping) {
            this.skipTypewriter();
            return true;
        }
        
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.showCurrentPage();
            return true;
        }
        
        return false;
    }

    hide() {
        this.typewriterEvent?.destroy();
        this.container.setVisible(false);
        this.isVisible = false;
        this.isTyping = false;
    }

    isShowing() {
        return this.isVisible;
    }

    destroy() {
        this.typewriterEvent?.destroy();
        this.container.destroy();
    }
}
