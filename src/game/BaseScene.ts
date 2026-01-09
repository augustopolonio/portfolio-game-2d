import Phaser from 'phaser';

export const GAME_CONFIG = {
    PLAYER_SPEED: 100,
    CAMERA_ZOOM: 2,
};

export default abstract class BaseScene extends Phaser.Scene {
    protected player!: Phaser.Physics.Arcade.Sprite;
    protected wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    protected eKey!: Phaser.Input.Keyboard.Key;
    protected currentInteractable: any = null;

    init(data: { spawnLocation?: string }) {
        this.registry.set('spawnLocation', data.spawnLocation || 'player');
    }

    protected setupPlayer(map: Phaser.Tilemaps.Tilemap) {
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
    }

    protected setupCamera(map: Phaser.Tilemaps.Tilemap) {
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(GAME_CONFIG.CAMERA_ZOOM);
        this.cameras.main.startFollow(this.player);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    }

    protected setupColliders(map: Phaser.Tilemaps.Tilemap) {
        const collidersLayer = map.getObjectLayer('Colliders');
        collidersLayer?.objects.forEach((obj: any) => {
            const collider = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
            this.physics.add.existing(collider, true);
            this.physics.add.collider(this.player, collider);
        });
    }

    protected setupInteractables(map: Phaser.Tilemaps.Tilemap) {
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
    }

    protected setupInput() {
        this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
        this.eKey = this.input.keyboard!.addKey('E');
    }

    update() {
        this.player.setVelocity(0);
        
        if (this.wasd.A.isDown) {
            this.player.setVelocityX(-GAME_CONFIG.PLAYER_SPEED);
        } else if (this.wasd.D.isDown) {
            this.player.setVelocityX(GAME_CONFIG.PLAYER_SPEED);
        }
        
        if (this.wasd.W.isDown) {
            this.player.setVelocityY(-GAME_CONFIG.PLAYER_SPEED);
        } else if (this.wasd.S.isDown) {
            this.player.setVelocityY(GAME_CONFIG.PLAYER_SPEED);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.currentInteractable) {
            this.handleInteraction(this.currentInteractable);
        }
        
        this.currentInteractable = null;
    }

    protected abstract handleInteraction(obj: any): void;
}
