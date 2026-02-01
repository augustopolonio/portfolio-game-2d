import Phaser from 'phaser';
import { Analytics } from '../utils/analytics';

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
    private updateListener?: (time: number, delta: number) => void;
    private lastMobileAxisX = 0;
    private lastMobileInteractState = false;
    private nextFocusMoveAt = 0;
    private pendingUnlock = false;
    private scrollY = 0;
    private maxScrollY = 0;
    private panelWidth = 700;
    private panelHeight = 500;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        
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
        this.background = this.scene.add.rectangle(0, 0, this.panelWidth, this.panelHeight, 0x000000, 0.6);
        this.background.setStrokeStyle(3, 0x6e84e7);
        this.container.add(this.background);

        // Content container (will hold scrollable content)
        this.content = this.scene.add.container(0, -this.panelHeight / 2 + 20);
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
            } else if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
                this.scroll(-30);
                event.preventDefault();
            } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
                this.scroll(30);
                event.preventDefault();
            } else if (event.key === 'Enter') {
                this.activateButton();
                event.preventDefault();
            }
        };

        window.addEventListener('keydown', this.keyboardListener);
    }

    private ensureUpdateListener() {
        if (this.updateListener) return;

        this.updateListener = (_time: number, delta: number) => {
            const mobileInput = (this.scene.registry.get('mobileInput') as any) || { x: 0, y: 0, interact: false };
            const axisX = typeof mobileInput.x === 'number' ? mobileInput.x : 0;
            const axisY = typeof mobileInput.y === 'number' ? mobileInput.y : 0;
            const interact = !!mobileInput.interact;

            // If we just closed the panel via the mobile interact button,
            // keep movement locked until the interact is released.
            if (this.pendingUnlock) {
                if (!interact) {
                    this.pendingUnlock = false;
                    const baseScene = this.scene as any;
                    if (baseScene.setMovementLocked) {
                        baseScene.setMovementLocked(false);
                    }

                    // If panel is hidden, we can stop polling.
                    if (!this.container.visible) {
                        this.removeUpdateListener();
                    }
                }

                this.lastMobileAxisX = axisX;
                this.lastMobileInteractState = interact;
                return;
            }

            if (!this.container.visible) return;

            // Joystick X: discrete focus navigation
            const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            const xDeadZone = 0.65;
            if (now >= this.nextFocusMoveAt) {
                if (axisX > xDeadZone && this.lastMobileAxisX <= xDeadZone) {
                    this.moveFocus(1);
                    this.nextFocusMoveAt = now + 180;
                } else if (axisX < -xDeadZone && this.lastMobileAxisX >= -xDeadZone) {
                    this.moveFocus(-1);
                    this.nextFocusMoveAt = now + 180;
                }
            }
            this.lastMobileAxisX = axisX;

            // Joystick Y: continuous scroll (positive => down)
            const yDeadZone = 0.35;
            if (Math.abs(axisY) > yDeadZone) {
                const scrollSpeed = 0.35; // px/ms at full tilt
                this.scroll(axisY * scrollSpeed * delta);
            }

            // Mobile "A" button: activate focused button
            if (interact && !this.lastMobileInteractState) {
                this.activateButton();
            }
            this.lastMobileInteractState = interact;
        };

        this.scene.events.on('update', this.updateListener);
    }

    private removeUpdateListener() {
        if (!this.updateListener) return;
        this.scene.events.off('update', this.updateListener);
        this.updateListener = undefined;
    }

    private scroll(amount: number) {
        this.scrollY += amount;
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
        this.updateContentPosition();
    }

    private updateContentPosition() {
        // Content starts at top of panel with some padding
        const baseY = -this.panelHeight / 2 + 20;
        this.content.setY(baseY - this.scrollY);
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

    private setFocus(index: number) {
        if (this.buttons.length === 0) return;
        if (index < 0 || index >= this.buttons.length) return;
        if (index === this.focusedButtonIndex) return;

        this.updateButtonHighlight(this.focusedButtonIndex, false);
        this.focusedButtonIndex = index;
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

        let yOffset = 0;

        // Status and Engine badges at top
        const statusColor = game.status === 'released' ? '#4ade80' : '#fbbf24';
        const statusText = game.status === 'released' ? 'Released' : 'In Development';
        
        const badgeContainer = this.scene.add.container(0, yOffset);
        const statusBadge = this.createBadge(statusText, statusColor, -60);
        const engineBadge = this.createBadge(game.engine.toUpperCase(), '#3b82f6', 60);
        badgeContainer.add([statusBadge, engineBadge]);
        this.content.add(badgeContainer);
        yOffset += 35;

        // Title above image
        const title = this.scene.add.text(0, yOffset, game.title, {
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: this.panelWidth - 60 },
        });
        title.setOrigin(0.5, 0);
        this.content.add(title);
        yOffset += title.height + 50; // Increased margin

        // Game image - load dynamically
        const imageKey = `game_image_${game.id}`;
        const imageUrl = `https://augustopolonio.vercel.app${game.image}`;
        
        // Check if already loaded
        if (!this.scene.textures.exists(imageKey)) {
            this.scene.load.image(imageKey, imageUrl);
            this.scene.load.once('complete', () => {
                this.addGameImage(imageKey, yOffset, game);
            });
            this.scene.load.start();
        } else {
            this.addGameImage(imageKey, yOffset, game);
        }
    }

    private addGameImage(imageKey: string, startYOffset: number, game: GameData) {
        // Remove loading placeholder if exists
        const existingImage = this.content.getAll().find((obj: any) => obj.name === 'game_image_container');
        if (existingImage) {
            existingImage.destroy();
        }

        let yOffset = startYOffset + 50;
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
            wordWrap: { width: this.panelWidth - 100 },
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
                wordWrap: { width: this.panelWidth - 100 },
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
                Analytics.trackExternalLinkClick(game.link, game.title);
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

        let yOffset = 0;

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
            wordWrap: { width: this.panelWidth - 100 },
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
            wordWrap: { width: this.panelWidth - 100 },
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
                    -(this.panelWidth / 2 - 80),
                    yOffset,
                    `• ${highlight}`,
                    {
                        fontSize: '12px',
                        color: '#aaaaaa',
                        wordWrap: { width: this.panelWidth - 140 },
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
            yOffset += techTitle.height + 35;

            // Create technology badges
            const techContainer = this.scene.add.container(0, yOffset);
            let xPos = -(this.panelWidth / 2 - 80);
            let yPos = 0;
            const maxWidth = this.panelWidth - 160;
            let currentRowWidth = 0;

            experience.technologies.forEach((tech, index) => {
                const badge = this.createTechBadge(tech);
                const badgeWidth = (tech.length * 8) + 20; // Approximate width

                if (currentRowWidth + badgeWidth > maxWidth && index > 0) {
                    xPos = -(this.panelWidth / 2 - 80);
                    yPos += 35;
                    currentRowWidth = 0;
                }

                badge.setPosition(xPos + badgeWidth / 2, yPos);
                techContainer.add(badge);
                
                xPos += badgeWidth + 10;
                currentRowWidth += badgeWidth + 10;
            });

            this.content.add(techContainer);
            
            // Calculate total height of tech badges container
            let maxYPos = 0;
            techContainer.iterate((child: any) => {
                if (child.y !== undefined) {
                    maxYPos = Math.max(maxYPos, child.y);
                }
            });
            yOffset += maxYPos + 35 + 20; // tech badge height + spacing
        }

        // Close button - positioned after all content
        this.buttons = [];
        const closeBtn = this.createButton('Close', () => this.close());
        closeBtn.setPosition(0, yOffset);
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
        const buttonIndex = this.buttons.length;
        this.buttons.push({ container, action });

        const activate = () => {
            if (!this.container.visible) return;
            this.setFocus(buttonIndex);
            action();
        };

        // Pointer/touch support (mouse + mobile)
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerover', () => this.setFocus(buttonIndex));
        bg.on('pointerdown', activate);

        // Make the text clickable too (helps on small screens)
        label.setInteractive({ useHandCursor: true });
        label.on('pointerover', () => this.setFocus(buttonIndex));
        label.on('pointerdown', activate);

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
        
        // Calculate max scroll based on content height
        const contentBounds = this.getContentBounds();
        this.maxScrollY = Math.max(0, contentBounds.height - (this.panelHeight - 80));
        this.scrollY = 0;
        this.updateContentPosition();
        
        this.container.setVisible(true);
        this.scene.input.keyboard?.enabled && this.scene.input.keyboard.resetKeys();

        // Enable polling of mobileInput (virtual joystick + A button)
        const mobileInput = (this.scene.registry.get('mobileInput') as any) || { x: 0, y: 0, interact: false };
        this.lastMobileAxisX = typeof mobileInput.x === 'number' ? mobileInput.x : 0;
        // Important: if the panel was opened via the same interact button (A/E),
        // don't immediately treat that already-held press as a click.
        this.lastMobileInteractState = !!mobileInput.interact;
        this.nextFocusMoveAt = 0;
        this.pendingUnlock = false;
        this.ensureUpdateListener();
        
        // Block player movement (access through BaseScene)
        const baseScene = this.scene as any;
        if (baseScene.setMovementLocked) {
            baseScene.setMovementLocked(true);
        }
    }

    private getContentBounds(): { height: number } {
        let minY = 0;
        let maxY = 0;
        
        this.content.iterate((child: any) => {
            if (child.y !== undefined) {
                const childTop = child.y - (child.height || 0) * (child.originY || 0);
                const childBottom = child.y + (child.height || 0) * (1 - (child.originY || 0));
                minY = Math.min(minY, childTop);
                maxY = Math.max(maxY, childBottom);
            }
        });
        
        return { height: maxY - minY };
    }

    close() {
        this.container.setVisible(false);

        // If close was triggered by the mobile interact button, the interact flag may still be true
        // for a short time. Keep movement locked until the button is released.
        const mobileInput = (this.scene.registry.get('mobileInput') as any) || { x: 0, y: 0, interact: false };
        const isInteractStillPressed = !!mobileInput.interact;
        const baseScene = this.scene as any;
        if (baseScene.setMovementLocked) {
            if (isInteractStillPressed) {
                this.pendingUnlock = true;
                this.ensureUpdateListener();
            } else {
                baseScene.setMovementLocked(false);
                // Stop polling when hidden
                this.removeUpdateListener();
            }
        } else {
            // Stop polling when hidden
            this.removeUpdateListener();
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
        this.removeUpdateListener();
        this.container.destroy();
    }
}
