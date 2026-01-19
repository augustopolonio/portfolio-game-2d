import Phaser from 'phaser';

export default class HUDScene extends Phaser.Scene {
    private keyIcon!: Phaser.GameObjects.Sprite;

    constructor() {
        super({ key: 'HUDScene', active: false });
    }

    create() {
        // Create the key icon
        // Position it at top-right with some padding
        this.keyIcon = this.add.sprite(this.scale.width - 40, 40, 'decor_sheet', 42);
        this.keyIcon.setOrigin(0.5);
        this.keyIcon.setScale(2); // UI scale
        this.keyIcon.setScrollFactor(0); // Ensure it stays in place
        
        // Start hidden
        this.keyIcon.setVisible(false); 
    }
    
    update() {
        // Polling the registry is a simple and robust way to handle UI updates 
        // without worrying about event listener lifecycles
        const inventory = this.registry.get('inventory') || [];

        if (inventory.includes('blue_key')) {
             if (!this.keyIcon.visible) {
                 this.keyIcon.setVisible(true);
             }
        } else {
             if (this.keyIcon.visible) {
                 this.keyIcon.setVisible(false);
             }
        }
    }
}
