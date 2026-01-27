import Phaser from 'phaser';

interface ExperienceData {
    company: string;
    location: string;
    title: string;
    period: string;
    description: string;
    highlights: string[];
    technologies: string[];
}

interface GameData {
    id: number;
    title: string;
    description: string;
    status: string;
    tags: string[];
    image: string;
    link: string;
    engine: string;
}

export default class InfoPanel {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Rectangle;
    private content: Phaser.GameObjects.Container;
    private closeCallback?: () => void;
    private buttons: Array<{ container: Phaser.GameObjects.Container; action: () => void }> = [];
    private focusedButtonIndex = 0;
    private keyboardListener?: (event: KeyboardEvent) => void;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
        // Define panel size at zoom level 1 (will be scaled by camera zoom)
        const panelWidth = 700;
        const panelHeight = 500;

        // Create main container - will be positioned and scaled based on camera
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(15000); // Above HUD
        this.container.setVisible(false);

        // Background overlay (full screen)
        const gameWidth = this.scene.scale.width;
        const gameHeight = this.scene.scale.height;
        const overlay = this.scene.add.rectangle(0, 0, gameWidth * 10, gameHeight * 10, 0x000000, 0.7);
        overlay.setOrigin(0.5);
        overlay.setInteractive(); // Block clicks from passing through
        this.container.add(overlay);

        // Panel background
        this.background = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.6);
        this.background.setStrokeStyle(3, 0x6e84e7);
        this.container.add(this.background);

        // Content container (will hold scrollable content)
        this.content = this.scene.add.container(0, 0);
        this.container.add(this.content);

        // Setup keyboard navigation
        this.setupKeyboardNavigation();
    }

    private setupKeyboardNavigation() {
        this.keyboardListener = (event: KeyboardEvent) => {
            if (!this.container.visible) return;

            if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
                this.moveFocus(1);
                event.preventDefault();
            } else if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
                this.moveFocus(-1);
                event.preventDefault();
            } else if (event.key === 'e' || event.key === 'E' || event.key === 'Enter') {
                this.activateButton();
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', this.keyboardListener);
    }

    private moveFocus(direction: number) {
        if (this.buttons.length === 0) return;

        // Remove highlight from current button
        this.updateButtonHighlight(this.focusedButtonIndex, false);

        // Move focus
        this.focusedButtonIndex = (this.focusedButtonIndex + direction + this.buttons.length) % this.buttons.length;

        // Add highlight to new button
        this.updateButtonHighlight(this.focusedButtonIndex, true);
    }

    private activateButton() {
        if (this.buttons.length > 0 && this.buttons[this.focusedButtonIndex]) {
            this.buttons[this.focusedButtonIndex].action();
        }
    }

    private updateButtonHighlight(index: number, highlighted: boolean) {
        if (!this.buttons[index]) return;

        const buttonContainer = this.buttons[index].container;
        const bg = buttonContainer.getAt(0) as Phaser.GameObjects.Rectangle;
        const label = buttonContainer.getAt(1) as Phaser.GameObjects.Text;
        
        // Determine if this is a Close button
        const isCloseButton = label.text === 'Close';
        
        if (highlighted) {
            if (isCloseButton) {
                bg.setFillStyle(0x374151);
                bg.setStrokeStyle(3, 0xffffff);
            } else {
                bg.setFillStyle(0x2563eb);
                bg.setStrokeStyle(3, 0xffffff);
            }
        } else {
            if (isCloseButton) {
                bg.setFillStyle(0x4a5568);
                bg.setStrokeStyle(2, 0x374151);
            } else {
                bg.setFillStyle(0x3b82f6);
                bg.setStrokeStyle(2, 0x2563eb);
            }
        }
    }

    async showGame(gameIndex: number) {
        try {
            const response = await fetch('https://augustopolonio.vercel.app/data/games.json');
            const games: GameData[] = await response.json();
            //const game = games.find((g) => g.id.toString() === gameId);
            const game = games[gameIndex];

            if (!game) {
                this.showError('Game not found');
                return;
            }

            this.renderGameContent(game);
            this.show();
        } catch (error) {
            console.error('Error fetching game data:', error);
            this.showError('Failed to load game data');
        }
    }

    async showExperience(experienceId: string) {
        try {
            const response = await fetch('https://augustopolonio.vercel.app/data/experiences.json');
            const experiences: ExperienceData[] = await response.json();
            const index = parseInt(experienceId, 10);
            const experience = experiences[index];

            if (!experience) {
                this.showError('Experience not found');
                return;
            }

            this.renderExperienceContent(experience);
            this.show();
        } catch (error) {
            console.error('Error fetching experience data:', error);
            this.showError('Failed to load experience data');
        }
    }

    private renderGameContent(game: GameData) {
        this.content.removeAll(true);

        const panelWidth = this.background.width;
        const panelHeight = this.background.height;
        let yOffset = -panelHeight / 2 + 25;

        // Status and Engine badges at top
        const statusColor = game.status === 'released' ? '#4ade80' : '#fbbf24';
        const statusText = game.status === 'released' ? 'Released' : 'In Development';
        
        const badgeContainer = this.scene.add.container(0, yOffset);
        const statusBadge = this.createBadge(statusText, statusColor, -60);
        const engineBadge = this.createBadge(game.engine.toUpperCase(), '#3b82f6', 60);
        badgeContainer.add([statusBadge, engineBadge]);
        this.content.add(badgeContainer);
        yOffset += 40;

        // Title above image
        const title = this.scene.add.text(0, yOffset, game.title, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: panelWidth - 60 },
        });
        title.setOrigin(0.5, 0);
        this.content.add(title);
        yOffset += title.height + 100; // Increased margin

        // Game image - load dynamically
        const imageKey = `game_image_${game.id}`;
        const imageUrl = `https://augustopolonio.vercel.app${game.image}`;
        
        // Check if already loaded
        if (!this.scene.textures.exists(imageKey)) {
            this.scene.load.image(imageKey, imageUrl);
            this.scene.load.once('complete', () => {
                this.addGameImage(imageKey, yOffset, panelWidth, panelHeight, game);
            });
            this.scene.load.start();
        } else {
            this.addGameImage(imageKey, yOffset, panelWidth, panelHeight, game);
        }
    }

    private addGameImage(imageKey: string, startYOffset: number, panelWidth: number, panelHeight: number, game: GameData) {
        // Remove loading placeholder if exists
        const existingImage = this.content.getAll().find((obj: any) => obj.name === 'game_image_container');
        if (existingImage) {
            existingImage.destroy();
        }

        let yOffset = startYOffset;
        const imageContainer = this.scene.add.container(0, yOffset);
        imageContainer.name = 'game_image_container';

        if (this.scene.textures.exists(imageKey)) {
            const gameImage = this.scene.add.image(0, 0, imageKey);
            // Scale to fit max 300x170
            const maxWidth = 300;
            const maxHeight = 170;
            const scale = Math.min(maxWidth / gameImage.width, maxHeight / gameImage.height, 1);
            gameImage.setScale(scale);
            imageContainer.add(gameImage);
        } else {
            // Fallback if image fails to load
            const imageBox = this.scene.add.rectangle(0, 0, 300, 170, 0x2a2a2a);
            imageBox.setStrokeStyle(2, 0x4a4a4a);
            const imageText = this.scene.add.text(0, 0, '🎮', {
                fontSize: '48px',
            });
            imageText.setOrigin(0.5);
            imageContainer.add([imageBox, imageText]);
        }

        this.content.add(imageContainer);
        yOffset += 100;

        // Description
        const description = this.scene.add.text(0, yOffset, game.description, {
            fontSize: '14px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: panelWidth - 100 },
            lineSpacing: 5,
        });
        description.setOrigin(0.5, 0);
        this.content.add(description);
        yOffset += description.height + 20;

        // Tags
        if (game.tags.length > 0) {
            const tagsTitle = this.scene.add.text(0, yOffset, 'Tags:', {
                fontSize: '16px',
                color: '#888888',
                fontStyle: 'bold',
            });
            tagsTitle.setOrigin(0.5, 0);
            this.content.add(tagsTitle);
            yOffset += tagsTitle.height + 10;

            const tagsText = this.scene.add.text(0, yOffset, game.tags.join(' • '), {
                fontSize: '14px',
                color: '#aaaaaa',
                align: 'center',
                wordWrap: { width: panelWidth - 100 },
            });
            tagsText.setOrigin(0.5, 0);
            this.content.add(tagsText);
            yOffset += tagsText.height + 60; // Increased margin
        }

        // Buttons container
        const buttonsContainer = this.scene.add.container(0, yOffset);
        this.buttons = [];

        // Play Game button (if link available)
        if (game.link && !game.link.includes('/unreleased-projects')) {
            const playBtn = this.createButton('Play Game', () => {
                window.open(game.link, '_blank');
            });
            playBtn.setPosition(-110, 0);
            buttonsContainer.add(playBtn);
        } else {
            // If no link, center the close button
            const closeBtn = this.createButton('Close', () => this.close());
            closeBtn.setPosition(0, 0);
            buttonsContainer.add(closeBtn);
            this.content.add(buttonsContainer);
            this.focusedButtonIndex = 0;
            this.updateButtonHighlight(0, true);
            return;
        }

        // Close button
        const closeBtn = this.createButton('Close', () => this.close());
        closeBtn.setPosition(110, 0);
        buttonsContainer.add(closeBtn);

        this.content.add(buttonsContainer);
        
        // Set initial focus
        this.focusedButtonIndex = 0;
        this.updateButtonHighlight(0, true);
    }

    private renderExperienceContent(experience: ExperienceData) {
        this.content.removeAll(true);

        const panelWidth = this.background.width;
        const panelHeight = this.background.height;
        let yOffset = -panelHeight / 2 + 60;

        // Company & Title
        const company = this.scene.add.text(0, yOffset, experience.company, {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
        });
        company.setOrigin(0.5, 0);
        this.content.add(company);
        yOffset += company.height + 10;

        // Job Title
        const jobTitle = this.scene.add.text(0, yOffset, experience.title, {
            fontSize: '18px',
            color: '#60a5fa',
            align: 'center',
            wordWrap: { width: panelWidth - 100 },
        });
        jobTitle.setOrigin(0.5, 0);
        this.content.add(jobTitle);
        yOffset += jobTitle.height + 10;

        // Period & Location
        const periodLocation = this.scene.add.text(
            0,
            yOffset,
            `${experience.period} • ${experience.location}`,
            {
                fontSize: '16px',
                color: '#888888',
                align: 'center',
            }
        );
        periodLocation.setOrigin(0.5, 0);
        this.content.add(periodLocation);
        yOffset += periodLocation.height + 25;

        // Description
        const description = this.scene.add.text(0, yOffset, experience.description, {
            fontSize: '14px',
            color: '#cccccc',
            align: 'center',
            wordWrap: { width: panelWidth - 100 },
            lineSpacing: 5,
        });
        description.setOrigin(0.5, 0);
        this.content.add(description);
        yOffset += description.height + 25;

        // Highlights
        if (experience.highlights.length > 0) {
            const highlightsTitle = this.scene.add.text(0, yOffset, 'Key Highlights:', {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
            });
            highlightsTitle.setOrigin(0.5, 0);
            this.content.add(highlightsTitle);
            yOffset += highlightsTitle.height + 15;

            experience.highlights.forEach((highlight) => {
                const bulletPoint = this.scene.add.text(
                    -(panelWidth / 2 - 80),
                    yOffset,
                    `• ${highlight}`,
                    {
                        fontSize: '12px',
                        color: '#aaaaaa',
                        wordWrap: { width: panelWidth - 140 },
                        lineSpacing: 3,
                    }
                );
                bulletPoint.setOrigin(0, 0);
                this.content.add(bulletPoint);
                yOffset += bulletPoint.height + 10;
            });

            yOffset += 10;
        }

        // Technologies
        if (experience.technologies.length > 0) {
            const techTitle = this.scene.add.text(0, yOffset, 'Technologies:', {
                fontSize: '16px',
                color: '#ffffff',
                fontStyle: 'bold',
            });
            techTitle.setOrigin(0.5, 0);
            this.content.add(techTitle);
            yOffset += techTitle.height + 15;

            // Create technology badges
            const techContainer = this.scene.add.container(0, yOffset);
            let xPos = -(panelWidth / 2 - 80);
            let yPos = 0;
            const maxWidth = panelWidth - 160;
            let currentRowWidth = 0;

            experience.technologies.forEach((tech, index) => {
                const badge = this.createTechBadge(tech);
                const badgeWidth = (tech.length * 8) + 20; // Approximate width

                if (currentRowWidth + badgeWidth > maxWidth && index > 0) {
                    xPos = -(panelWidth / 2 - 80);
                    yPos += 35;
                    currentRowWidth = 0;
                }

                badge.setPosition(xPos + badgeWidth / 2, yPos);
                techContainer.add(badge);
                
                xPos += badgeWidth + 10;
                currentRowWidth += badgeWidth + 10;
            });

            this.content.add(techContainer);
        }

        // Close button
        this.buttons = [];
        const closeBtn = this.createButton('Close', () => this.close());
        closeBtn.setPosition(0, yOffset + 40);
        this.content.add(closeBtn);
        
        // Set initial focus
        this.focusedButtonIndex = 0;
        this.updateButtonHighlight(0, true);
    }

    private createBadge(text: string, color: string, xOffset: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(xOffset, 0);
        const bg = this.scene.add.rectangle(0, 0, text.length * 12 + 20, 28, parseInt(color.replace('#', '0x')));
        bg.setStrokeStyle(2, parseInt(color.replace('#', '0x')));
        const label = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            color: '#000000',
            fontStyle: 'bold',
        });
        label.setOrigin(0.5);
        container.add([bg, label]);
        return container;
    }

    private createTechBadge(text: string): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        const bg = this.scene.add.rectangle(0, 0, text.length * 8 + 20, 28, 0x2d3748);
        bg.setStrokeStyle(1, 0x4a5568);
        const label = this.scene.add.text(0, 0, text, {
            fontSize: '14px',
            color: '#e2e8f0',
        });
        label.setOrigin(0.5);
        container.add([bg, label]);
        return container;
    }

    private createButton(text: string, action: () => void): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        
        const buttonWidth = 200;
        const buttonHeight = 40;
        
        // Use gray color for Close button, blue for others
        const isCloseButton = text === 'Close';
        const bgColor = isCloseButton ? 0x4a5568 : 0x3b82f6;
        const borderColor = isCloseButton ? 0x374151 : 0x2563eb;
        
        const bg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, bgColor);
        bg.setStrokeStyle(2, borderColor);
        
        const label = this.scene.add.text(0, 0, text, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold',
        });
        label.setOrigin(0.5);
        container.add([bg, label]);

        // Track button for navigation
        this.buttons.push({ container, action });

        return container;
    }

    private showError(message: string) {
        this.content.removeAll(true);
        const errorText = this.scene.add.text(0, 0, message, {
            fontSize: '24px',
            color: '#ff6b6b',
            align: 'center',
        });
        errorText.setOrigin(0.5);
        this.content.add(errorText);
        this.show();
    }

    show() {
        const gameWidth = this.scene.scale.width;
        const gameHeight = this.scene.scale.height;
        const camera = this.scene.cameras.main;
        const zoom = camera ? camera.zoom : 1;
        
        // Scale and position to account for camera zoom
        this.container.setScale(1 / zoom);
        this.container.setPosition(gameWidth / 2, gameHeight / 2);
        
        this.container.setVisible(true);
        this.scene.input.keyboard?.enabled && this.scene.input.keyboard.resetKeys();
        
        // Block player movement (access through BaseScene)
        const baseScene = this.scene as any;
        if (baseScene.setMovementLocked) {
            baseScene.setMovementLocked(true);
        }
    }

    close() {
        this.container.setVisible(false);
        
        // Unlock player movement
        const baseScene = this.scene as any;
        if (baseScene.setMovementLocked) {
            baseScene.setMovementLocked(false);
        }
        
        if (this.closeCallback) {
            this.closeCallback();
            this.closeCallback = undefined;
        }
    }

    setCloseCallback(callback: () => void) {
        this.closeCallback = callback;
    }

    destroy() {
        if (this.keyboardListener) {
            window.removeEventListener('keydown', this.keyboardListener);
        }
        this.container.destroy();
    }
}
