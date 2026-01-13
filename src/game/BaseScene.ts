import Phaser from 'phaser';
import DialogueBox from './DialogueBox';

export const GAME_CONFIG = {
    PLAYER_SPEED: 90,
    CAMERA_ZOOM: 3,
    TRANSITION_DURATION: 500,
    DEBUG_PHYSICS: false,
};

export default abstract class BaseScene extends Phaser.Scene {
    protected player!: Phaser.Physics.Arcade.Sprite;
    protected wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
    protected eKey!: Phaser.Input.Keyboard.Key;
    protected currentInteractable: any = null;
    protected dialogueBox!: DialogueBox;
    private lastInteractState = false;
    private lastDirection = 'down';
    private interactableZones: Map<Phaser.GameObjects.Zone, any> = new Map();
    private activeInteractables = new Set<any>();
    protected objectSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

    init(data: { spawnLocation?: string; playerDirection?: string }) {
        this.registry.set('spawnLocation', data.spawnLocation || 'player');
        this.registry.set('playerDirection', data.playerDirection || 'down');
    }

    protected setupPlayer(map: Phaser.Tilemaps.Tilemap) {
        const spawnsLayer = map.getObjectLayer('Spawns');
        const spawnLocation = this.registry.get('spawnLocation') || 'player';
        const playerSpawn = spawnsLayer?.objects.find((obj: any) => 
            (obj.type === 'start_position' && obj.name === spawnLocation) ||
            (obj.name === spawnLocation)
        );
        const spawnX = playerSpawn?.x || map.widthInPixels / 2;
        const spawnY = playerSpawn?.y || map.heightInPixels / 2;
        
        this.player = this.physics.add.sprite(spawnX, spawnY, 'player_idle', 0);
        this.player.setScale(1.5); // Makes player 1.5x bigger (or 0.5 for smaller)

        this.player.setCollideWorldBounds(true);
        
        // Set physics body size to match actual character size (16x16)
        this.player.body!.setSize(16, 16);
        this.player.body!.setOffset(25, 25);
        
        // Create animations only if they don't exist
        if (!this.anims.exists('idle_down')) {
            this.anims.create({
                key: 'idle_down',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'idle_left',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'idle_right',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 8, end: 11 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'idle_up',
                frames: this.anims.generateFrameNumbers('player_idle', { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
            
            this.anims.create({
                key: 'walk_down',
                frames: this.anims.generateFrameNumbers('player_walk', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'walk_left',
                frames: this.anims.generateFrameNumbers('player_walk', { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'walk_right',
                frames: this.anims.generateFrameNumbers('player_walk', { start: 8, end: 11 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'walk_up',
                frames: this.anims.generateFrameNumbers('player_walk', { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        const savedDirection = this.registry.get('playerDirection') || 'down';
        this.lastDirection = savedDirection;
        this.player.play(`idle_${savedDirection}`);
    }

    protected setupCamera(map: Phaser.Tilemaps.Tilemap) {
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.setZoom(GAME_CONFIG.CAMERA_ZOOM);
        this.cameras.main.startFollow(this.player);
        this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        this.cameras.main.fadeIn(GAME_CONFIG.TRANSITION_DURATION);
        
        // Enable debug rendering
        if (GAME_CONFIG.DEBUG_PHYSICS) {
            this.physics.world.createDebugGraphic();
        }
    }

    protected setupColliders(map: Phaser.Tilemaps.Tilemap) {
        const collidersLayer = map.getObjectLayer('Colliders');
        collidersLayer?.objects.forEach((obj) => {
            const collider = this.add.rectangle(obj.x! + obj.width! / 2, obj.y! + obj.height! / 2, obj.width, obj.height);
            this.physics.add.existing(collider, true);
            this.physics.add.collider(this.player, collider);
        });
    }

    protected setupInteractables(map: Phaser.Tilemaps.Tilemap) {
        const interactablesLayer = map.getObjectLayer('Interactables');
        interactablesLayer?.objects.forEach((obj) => {
            const zone = this.add.zone(obj.x! + obj.width! / 2, obj.y! + obj.height! / 2, obj.width, obj.height);
            this.physics.add.existing(zone);
            (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
            (zone.body as Phaser.Physics.Arcade.Body).moves = false;
            
            this.interactableZones.set(zone, obj);
            this.physics.add.overlap(this.player, zone);
        });
    }
    
    protected setupObjects(map: Phaser.Tilemaps.Tilemap) {
        const objectsLayer = map.getObjectLayer('Objects/Objects');
        objectsLayer?.objects.forEach((obj) => {
            if (obj.gid) {
                let tilesetName = '';
                let frameIndex = 0;
                
                for (const tileset of map.tilesets) {
                    const firstGid = tileset.firstgid;
                    const lastGid = firstGid + tileset.total - 1;
                    
                    if (obj.gid >= firstGid && obj.gid <= lastGid) {
                        tilesetName = tileset.name;
                        frameIndex = obj.gid - firstGid;
                        break;
                    }
                }
                
                // Use _sheet suffix for spritesheet version if tileset has both
                const textureKey = this.textures.exists(tilesetName + '_sheet') 
                    ? tilesetName + '_sheet' 
                    : tilesetName;
                
                const sprite = this.add.sprite(obj.x, obj.y, textureKey, frameIndex);
                sprite.setOrigin(0, 1);
                
                // Store sprite by name for easy access
                if (obj.name) {
                    this.objectSprites.set(obj.name, sprite);
                }
            }
        });
    }

    protected setupInput() {
        this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as any;
        this.eKey = this.input.keyboard!.addKey('E');
        this.dialogueBox = new DialogueBox(this);
    }

    update() {
        const mobileInput = this.registry.get('mobileInput') || { x: 0, y: 0, interact: false };
        
        // If dialogue is showing, only handle closing it
        if (this.dialogueBox.isShowing()) {
            if (Phaser.Input.Keyboard.JustDown(this.eKey) || (mobileInput.interact && !this.lastInteractState)) {
                if (!this.dialogueBox.advance()) {
                    this.dialogueBox.hide();
                }
            }
            this.lastInteractState = mobileInput.interact;
            return;
        }
        
        let velocityX = 0;
        let velocityY = 0;
        let isMoving = false;
        
        if (this.wasd.A.isDown || mobileInput.x < -0.3) {
            velocityX = -GAME_CONFIG.PLAYER_SPEED;
            this.lastDirection = 'left';
            isMoving = true;
        } else if (this.wasd.D.isDown || mobileInput.x > 0.3) {
            velocityX = GAME_CONFIG.PLAYER_SPEED;
            this.lastDirection = 'right';
            isMoving = true;
        }
        
        if (this.wasd.W.isDown || mobileInput.y < -0.3) {
            velocityY = -GAME_CONFIG.PLAYER_SPEED;
            this.lastDirection = 'up';
            isMoving = true;
        } else if (this.wasd.S.isDown || mobileInput.y > 0.3) {
            velocityY = GAME_CONFIG.PLAYER_SPEED;
            this.lastDirection = 'down';
            isMoving = true;
        }
        
        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= Math.SQRT1_2;
            velocityY *= Math.SQRT1_2;
        }
        
        this.player.setVelocity(velocityX, velocityY);
        
        // Update animation
        if (isMoving) {
            this.player.play(`walk_${this.lastDirection}`, true);
        } else {
            this.player.play(`idle_${this.lastDirection}`, true);
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.eKey) || (mobileInput.interact && !this.lastInteractState)) {
            if (this.currentInteractable) {
                this.handleInteraction(this.currentInteractable);
            }
        }
        
        this.lastInteractState = mobileInput.interact;
        
        // Track which zones are currently overlapping
        const currentlyTouching = new Set<any>();
        
        this.interactableZones.forEach((obj, zone) => {
            const overlapping = this.physics.overlap(this.player, zone);
            
            if (overlapping) {
                currentlyTouching.add(obj);
                this.currentInteractable = obj;
                
                // Enter if not previously active
                if (!this.activeInteractables.has(obj)) {
                    console.log('Enter:', obj.name);
                    this.activeInteractables.add(obj);
                    this.onInteractableEnter(obj);
                }
            }
        });
        
        // Check for exits
        this.activeInteractables.forEach(obj => {
            if (!currentlyTouching.has(obj)) {
                console.log('Exit:', obj.name);
                this.activeInteractables.delete(obj);
                this.onInteractableExit(obj);
            }
        });
    }

    protected showDialogue(message: string) {
        this.dialogueBox.show(message);
        this.player.setVelocity(0, 0);
    }

    protected transitionToScene(sceneName: string, data?: any) {
        this.cameras.main.fadeOut(GAME_CONFIG.TRANSITION_DURATION);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(sceneName, { ...data, playerDirection: this.lastDirection });
        });
    }

    protected abstract handleInteraction(obj: any): void;
    
    protected onInteractableEnter(obj: any) {
        // Override in child scenes
    }
    
    protected onInteractableExit(obj: any) {
        // Override in child scenes
    }
}
