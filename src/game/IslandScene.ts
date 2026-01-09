import Phaser from 'phaser';

export default class IslandScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    private eKey!: Phaser.Input.Keyboard.Key;
    private currentInteractable: any = null;

    constructor() {
        super('IslandScene');
    }

    init(data: { spawnLocation?: string }) {
        this.registry.set('spawnLocation', data.spawnLocation || 'player');
    }

    preload() {
        this.load.image('Island_24x24', 'assets/P_P_FREE_RPG_TILESET/Island_24x24.png');
        this.load.image('Dungeon_24x24', 'assets/P_P_FREE_RPG_TILESET/Dungeon_24x24.png');
        this.load.image('example', 'assets/P_P_FREE_RPG_TILESET/example.png');
        this.load.image('decor', 'assets/P_P_FREE_RPG_TILESET/decor.png');
        this.load.tilemapTiledJSON('island_map', 'assets/tiled/maps/island.json');
    }

    create() {
        const map = this.make.tilemap({ key: 'island_map' });

        const tileset1 = map.addTilesetImage('Island_24x24', 'Island_24x24');
        const tileset2 = map.addTilesetImage('example', 'example');
        const tileset3 = map.addTilesetImage('decor', 'decor');
        const tileset4 = map.addTilesetImage('Dungeon_24x24', 'Dungeon_24x24');
        
        const tilesets = [tileset1, tileset2, tileset3, tileset4].filter(
            (t): t is Phaser.Tilemaps.Tileset => t !== null
        );

        map.createLayer('BaseMap', tilesets, 0, 0);
        
        const tiledObjectsLayer = map.getLayer('Objects/TiledObjects');
        if (tiledObjectsLayer) {
            map.createLayer('Objects/TiledObjects', tilesets, 0, 0);
        }
        
        const graphics = this.add.graphics();
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillRect(0, 0, 16, 16);
        graphics.generateTexture('player', 16, 16);
        graphics.destroy();
        
        const spawnsLayer = map.getObjectLayer('Spawns');
        const spawnLocation = this.registry.get('spawnLocation') || 'player';
        const playerSpawn = spawnsLayer?.objects.find((obj: any) => 
            (obj.type === 'start_position' && obj.name === spawnLocation) ||
            (obj.name === spawnLocation)
        );
        const spawnX = playerSpawn?.x || map.widthInPixels / 2;
        const spawnY = playerSpawn?.y || map.heightInPixels / 2;
        
        this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
        this.player.setCollideWorldBounds(true);
        
        const collidersLayer = map.getObjectLayer('Colliders');
        collidersLayer?.objects.forEach((obj: any) => {
            const collider = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
            this.physics.add.existing(collider, true);
            this.physics.add.collider(this.player, collider);
        });
        
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
        
        this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
        this.eKey = this.input.keyboard!.addKey('E');
        
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
        
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.currentInteractable) {
            this.handleInteraction(this.currentInteractable);
        }
        
        this.currentInteractable = null;
    }
    
    private handleInteraction(obj: any) {
        if (obj.type === 'door') {
            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;
            
            if (goToMap === 'dungeon') {
                this.scene.start('DungeonScene', { spawnLocation: goToDoor });
            }
        } else if (obj.class === 'info') {
            const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
            console.log(`Info: ${text}`);
        }
    }
}
