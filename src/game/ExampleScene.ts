import Phaser from 'phaser';

export default class ExampleScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private eKey!: Phaser.Input.Keyboard.Key;
    private currentInteractable: any = null;
    private closedChest!: Phaser.GameObjects.Image;
    private openChest!: Phaser.GameObjects.Image;

    constructor() {
        super('ExampleScene');
    }

    preload() {
        this.load.image('Island_24x24', 'assets/P_P_FREE_RPG_TILESET/Island_24x24.png');
        this.load.image('Dungeon_24x24', 'assets/P_P_FREE_RPG_TILESET/Dungeon_24x24.png');
        this.load.image('example', 'assets/P_P_FREE_RPG_TILESET/example.png');
        this.load.spritesheet('decor_sheet', 'assets/P_P_FREE_RPG_TILESET/decor.png', { frameWidth: 24, frameHeight: 24 });
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
        
        // Access TiledObjects layer inside Objects group
        const tiledObjectsLayer = map.getLayer('Objects/TiledObjects');
        if (tiledObjectsLayer) {
            map.createLayer('Objects/TiledObjects', tilesets, 0, 0);
        }
        
        // Load objects from Objects layer
        const objectsLayer = map.getObjectLayer('Objects/Objects');
        
        objectsLayer?.objects.forEach((obj: any) => {
            if (obj.name === 'closed_chest') {
                // GID 179: firstgid is 178, so frame index is 179 - 178 = 1
                this.closedChest = this.add.sprite(obj.x, obj.y, 'decor_sheet', 1);
                this.closedChest.setOrigin(0, 1);
            } else if (obj.name === 'open_chest') {
                // GID 182: firstgid is 178, so frame index is 182 - 178 = 4
                this.openChest = this.add.sprite(obj.x, obj.y, 'decor_sheet', 4);
                this.openChest.setOrigin(0, 1);
                this.openChest.setVisible(false);
            }
        });
        
        // Create player sprite
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('player', 16, 16);
        graphics.destroy();
        
        // Get spawn position
        const spawnsLayer = map.getObjectLayer('Spawns');
        const playerSpawn = spawnsLayer?.objects.find((obj: any) => obj.type === 'start_position' && obj.name === 'player');
        const spawnX = playerSpawn?.x || map.widthInPixels / 2;
        const spawnY = playerSpawn?.y || map.heightInPixels / 2;
        
        this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        
        // Setup colliders
        const collidersLayer = map.getObjectLayer('Colliders');
        collidersLayer?.objects.forEach((obj: any) => {
            const collider = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
            this.physics.add.existing(collider, true);
            this.physics.add.collider(this.player, collider);
        });
        
        // Setup interactables
        const interactablesLayer = map.getObjectLayer('Interactables');
        interactablesLayer?.objects.forEach((obj: any) => {
            const zone = this.add.zone(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
            this.physics.add.existing(zone);
            
            this.physics.add.overlap(this.player, zone, () => {
                if (!this.currentInteractable) {
                    console.log(`Entered interactable: ${obj.name || obj.type || 'unnamed'}`);
                }
                this.currentInteractable = obj;
            });
        });
        
        // Setup keys
        this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
        this.eKey = this.input.keyboard!.addKey('E');
        
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
        
        // Handle interactions
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.currentInteractable) {
            this.handleInteraction(this.currentInteractable);
        }
        
        this.currentInteractable = null;
    }
    
    private handleInteraction(obj: any) {
        if (obj.type === 'door') {
            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;
            console.log(`Door interaction: Map=${goToMap}, Door=${goToDoor}`);
        } else if (obj.class === 'info') {
            const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
            console.log(`Info: ${text}`);
        } else if (obj.name === 'chest') {
            if (this.closedChest.visible) {
                this.closedChest.setVisible(false);
                this.openChest.setVisible(true);
                console.log('Chest opened!');
            } else {
                console.log('Chest already open');
            }
        }
    }
}