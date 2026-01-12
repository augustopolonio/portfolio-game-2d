import Phaser from 'phaser';

export default class DialogueBox {
    private scene: Phaser.Scene;
    private container!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Rectangle;
    private text!: Phaser.GameObjects.Text;
    private isVisible = false;
    private pages: string[] = [];
    private currentPage = 0;
    private isTyping = false;
    private fullText = '';
    private charIndex = 0;
    private typewriterEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.create();
    }

    private create() {
        const width = 600;
        const height = 100;
        
        this.background = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.6);
        this.background.setStrokeStyle(3, 0x6e84e7);
        
        this.text = this.scene.add.text(0, 0, '', {
            fontFamily: '"Press Start 2P"',
            fontSize: '14px',
            color: '#ffffff',
            align: 'left',
            fixedWidth: width - 20,
            fixedHeight: height - 20,
            lineSpacing: 12,
            wordWrap: { width: width - 20 }
        });
        this.text.setOrigin(0.5);
        
        this.container = this.scene.add.container(0, 0);
        this.container.add([this.background, this.text]);
        this.container.setScrollFactor(0);
        this.container.setDepth(1000);
        this.container.setVisible(false);
    }

    private paginateText(message: string): string[] {
        const maxChars = 100;
        const words = message.split(' ');
        const pages: string[] = [];
        let currentPage = '';
        
        for (const word of words) {
            const testPage = currentPage + (currentPage ? ' ' : '') + word;
            if (testPage.length > maxChars) {
                if (currentPage) pages.push(currentPage);
                currentPage = word;
            } else {
                currentPage = testPage;
            }
        }
        if (currentPage) pages.push(currentPage);
        
        return pages;
    }

    private startTypewriter() {
        this.isTyping = true;
        this.charIndex = 0;
        this.text.setText('');
        
        this.typewriterEvent = this.scene.time.addEvent({
            delay: 20,
            callback: () => {
                if (this.charIndex < this.fullText.length) {
                    this.text.setText(this.fullText.substring(0, this.charIndex + 1));
                    this.charIndex++;
                } else {
                    this.isTyping = false;
                    this.typewriterEvent?.destroy();
                }
            },
            loop: true
        });
    }

    private skipTypewriter() {
        if (this.isTyping) {
            this.typewriterEvent?.destroy();
            this.text.setText(this.fullText);
            this.isTyping = false;
        }
    }

    show(message: string) {
        const gameWidth = this.scene.game.scale.width;
        const gameHeight = this.scene.game.scale.height;
        const zoom = this.scene.cameras.main.zoom;
        
        this.container.setScale(1 / zoom);
        this.container.setPosition(gameWidth / 2, gameHeight - 560 / zoom);
        
        this.pages = this.paginateText(message);
        this.currentPage = 0;
        this.fullText = this.pages[0];
        this.startTypewriter();
        
        this.container.setVisible(true);
        this.isVisible = true;
    }

    advance(): boolean {
        if (this.isTyping) {
            this.skipTypewriter();
            return true;
        }
        
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.fullText = this.pages[this.currentPage];
            this.startTypewriter();
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
