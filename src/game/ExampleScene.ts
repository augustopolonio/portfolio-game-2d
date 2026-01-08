import Phaser from 'phaser';

export default class ExampleScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

    constructor() {
        super('ExampleScene');
    }

    preload() {
        this.load.image('Island_24x24', 'assets/P_P_FREE_RPG_TILESET/Island_24x24.png');
        this.load.image('Dungeon_24x24', 'assets/P_P_FREE_RPG_TILESET/Dungeon_24x24.png');
        this.load.image('example', 'assets/P_P_FREE_RPG_TILESET/example.png');
        this.load.image('decor', 'assets/P_P_FREE_RPG_TILESET/decor.png');
        this.load.tilemapTiledJSON('map', 'assets/tiled/maps/dungeon.json');
    }

    create() {
        const map = this.make.tilemap({ key: 'map' });

        const tileset1 = map.addTilesetImage('Island_24x24', 'Island_24x24');
        const tileset2 = map.addTilesetImage('example', 'example');
        const tileset3 = map.addTilesetImage('decor', 'decor');
        const tileset4 = map.addTilesetImage('Dungeon_24x24', 'Dungeon_24x24');
        
        const tilesets = [tileset1, tileset2, tileset3, tileset4].filter(
            (t): t is Phaser.Tilemaps.Tileset => t !== null
        );

        map.createLayer('BaseMap', tilesets, 0, 0);
        map.createLayer('Objects', tilesets, 0, 0);
        
        // Create player as a simple rectangle
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('player', 16, 16);
        graphics.destroy();
        
        this.player = this.physics.add.sprite(map.widthInPixels / 2, map.heightInPixels / 2, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Setup WASD keys
        this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
        
        // Camera setup
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.startFollow(this.player);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }

    update() {
        const speed = 160;
        
        this.player.setVelocity(0);
        
        if (this.wasd.A.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.wasd.D.isDown) {
            this.player.setVelocityX(speed);
        }
        
        if (this.wasd.W.isDown) {
            this.player.setVelocityY(-speed);
        } else if (this.wasd.S.isDown) {
            this.player.setVelocityY(speed);
        }
    }
}