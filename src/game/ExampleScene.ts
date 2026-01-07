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
        this.load.image('tiles', 'assets/tiles/cybernoid.png');

        // 2. Fix the path to the map (change 'tilemaps' to 'tilemap')
        this.load.tilemapTiledJSON('map', 'assets/tilemap/maps/cybernoid.json');
    }

    create() {
        // 1. Create the map from the loaded JSON key
        const map = this.make.tilemap({ key: 'map' });

        // 2. SAFETY CHECK: Get the tileset name directly from the JSON data
        // Tiled JSONs have a "name" property for the tileset. We must use that exact string.
        const tilesetName = map.tilesets[0].name; 
        
        // Link the tileset name (from JSON) to the loaded image key ('tiles')
        const tiles = map.addTilesetImage(tilesetName, 'tiles');

        if (!tiles) {
            console.error('Tileset could not be loaded. Check spelling or JSON data.');
            return;
        }

        // 3. SAFETY CHECK: Get the layer name directly from the JSON data
        // Instead of using index 0, we use the actual name of the first layer
        const layerName = map.layers[0].name;
        
        const layer = map.createLayer(layerName, tiles, 0, 0);

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
            speed: 0.5
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