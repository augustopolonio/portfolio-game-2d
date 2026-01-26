import Phaser from 'phaser';

export default class HUDScene extends Phaser.Scene {
    private blueKeyIcon!: Phaser.GameObjects.Sprite;
    private greenKeyIcon!: Phaser.GameObjects.Sprite;
    private readonly iconScale = 2;
    private readonly iconAngleDeg = -35;

    constructor() {
        super({ key: 'HUDScene', active: false });
    }

    create() {
        const updateLayout = () => {
            // Screen-space slots (used by pickup tweens in other scenes)
            // Slot 0: top-right
            // Slot 1: same row, to the left
            const slotBlue = { x: this.scale.width - 40, y: 40 };
            const slotGreen = { x: this.scale.width - 85, y: 40 };

            this.registry.set('hudKeySlots', {
                blue: slotBlue,
                green: slotGreen,
            });

            this.blueKeyIcon?.setPosition(slotBlue.x, slotBlue.y);
            this.greenKeyIcon?.setPosition(slotGreen.x, slotGreen.y);
        };

        // Blue key (projects)
        this.blueKeyIcon = this.add.sprite(0, 0, 'decor_sheet', 42);
        this.blueKeyIcon.setOrigin(0.5);
        this.blueKeyIcon.setScale(this.iconScale);
        this.blueKeyIcon.setAngle(this.iconAngleDeg);
        this.blueKeyIcon.setScrollFactor(0);
        this.blueKeyIcon.setVisible(false);

        // Green key (experience)
        this.greenKeyIcon = this.add.sprite(0, 0, 'decor_sheet', 82);
        this.greenKeyIcon.setOrigin(0.5);
        this.greenKeyIcon.setScale(this.iconScale);
        this.greenKeyIcon.setAngle(this.iconAngleDeg);
        this.greenKeyIcon.setScrollFactor(0);
        this.greenKeyIcon.setVisible(false);

        updateLayout();
        this.scale.on('resize', updateLayout);
    }
    
    update() {
        // Polling the registry is a simple and robust way to handle UI updates 
        // without worrying about event listener lifecycles
        const inventory = this.registry.get('inventory') || [];

        const hasBlue = inventory.includes('blue_key');
        const hasGreen = inventory.includes('green_key');

        this.blueKeyIcon.setVisible(hasBlue);
        this.greenKeyIcon.setVisible(hasGreen);
    }
}
