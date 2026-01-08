import Phaser from 'phaser';

export default class ExampleScene extends Phaser.Scene {
    private controls!: Phaser.Cameras.Controls.FixedKeyControl;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor() {
        super('ExampleScene');
    }

    preload() {
        // 1. Fix the path to the image (remove 'tilemaps/')
        // Based on your screenshot, 'tiles' is directly inside 'assets'
        // this.load.image('tiles', 'assets/tiles/cybernoid.png');
        this.load.image('Island_24x24', 'assets/P_P_FREE_RPG_TILESET/Island_24x24.png');
        this.load.image('Dungeon_24x24', 'assets/P_P_FREE_RPG_TILESET/Dungeon_24x24.png');
        this.load.image('example', 'assets/P_P_FREE_RPG_TILESET/example.png');
        this.load.image('decor', 'assets/P_P_FREE_RPG_TILESET/decor.png');

        // 2. Fix the path to the map (change 'tilemaps' to 'tilemap')
        // this.load.tilemapTiledJSON('map', 'assets/tilemap/maps/cybernoid.json');
        this.load.tilemapTiledJSON('map', 'assets/tiled/maps/dungeon.json');
    }

    create() {
        // 1. Create the map from the loaded JSON key
        const map = this.make.tilemap({ key: 'map' });

         // Add all tilesets - link tileset name (from JSON) to image key (from preload)
        const tileset1 = map.addTilesetImage('Island_24x24', 'Island_24x24');
        const tileset2 = map.addTilesetImage('example', 'example');
        const tileset3 = map.addTilesetImage('decor', 'decor');
        const tileset4 = map.addTilesetImage('Dungeon_24x24', 'Dungeon_24x24');
        
        //console.log('Tilesets loaded:', tileset1, tileset2, tileset3, tileset4);
        
        // Filter out null values - createLayer doesn't accept nulls
        const tilesets = [tileset1, tileset2, tileset3, tileset4].filter(
            (t): t is Phaser.Tilemaps.Tileset => t !== null
        );

        // Create all tile layers by name
        map.createLayer('BaseMap', tilesets, 0, 0);
        map.createLayer('Objects', tilesets, 0, 0);
        
        // ... rest of your code (cameras, controls) ...
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        const controlConfig: Phaser.Types.Cameras.Controls.FixedKeyControlConfig = {
            camera: this.cameras.main,
            left: this.cursors.left,
            right: this.cursors.right,
            up: this.cursors.up,
            down: this.cursors.down,
            speed: 0.3
        };

        this.controls = new Phaser.Cameras.Controls.FixedKeyControl(controlConfig);
    }

    update(time: number, delta: number) {
        // Only update controls if they exist
        if (this.controls) {
            this.controls.update(delta);
        }
    }
}