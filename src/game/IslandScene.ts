import BaseScene from './BaseScene';
import { TiledMapLoader, type MapConfig } from './TiledMapLoader';
import { PLAYER_CONFIG } from './GameConfig';
import OutlineEffect from './OutlineEffect';

export default class IslandScene extends BaseScene {
    private mapConfig: MapConfig = {
        tilesetFolder: 'P_P_FREE_RPG_TILESET',
        tilesets: [
            { name: 'Island_24x24', path: 'Island_24x24.png' },
            { name: 'Dungeon_24x24', path: 'Dungeon_24x24.png' },
            { name: 'example', path: 'example.png' },
            { name: 'decor', path: 'decor.png' },
            // Add sheets to use loose tiles
            { name: 'decor_sheet', path: 'decor.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
            { name: 'Dungeon_24x24_sheet', path: 'Dungeon_24x24.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
            { name: 'example_sheet', path: 'example.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
        ],
        mapKey: 'island_map',
        mapPath: 'assets/tiled/maps/island.json',
    };

    constructor() {
        super('IslandScene');
    }

    preload() {
        TiledMapLoader.loadPlayer(this, PLAYER_CONFIG);
        TiledMapLoader.loadMap(this, this.mapConfig);
    }

    create() {
        this.scene.launch('HUDScene');
        OutlineEffect.addToScene(this);
        const { map, tilesets } = TiledMapLoader.createMap(this, this.mapConfig);

        // 1. Below Layer (Ground)
        map.createLayer('Below/BaseMap', tilesets, 0, 0);

        // 2. Below Layer (Decorations that are always below)
        const tiledObjectsLayer = map.getLayer('Below/TiledObjects');
        if (tiledObjectsLayer) {
            map.createLayer('Below/TiledObjects', tilesets, 0, 0);
        }

        // 3. Same Layer (Base objects like trunks - rendered flat before objects)
        const objectsBaseLayer = map.getLayer('Same/ObjectsBase');
        if (objectsBaseLayer) {
            map.createLayer('Same/ObjectsBase', tilesets, 0, 0);
        }

        // 4. Player & Active Objects (Y-Sorted)
        this.setupPlayer(map);
        this.setupObjects(map); // Loads 'Same/Objects'

        // 5. Above Layer (Tree tops - always on top)
        const objectsTopLayer = map.getLayer('Above/ObjectsTop');
        if (objectsTopLayer) {
            const topLayer = map.createLayer('Above/ObjectsTop', tilesets, 0, 0);
            topLayer?.setDepth(map.heightInPixels + 1000); // Ensure it's above everything
        }
        
        this.objectSprites.get('projects_open_chest')?.setVisible(false);
        this.setupColliders(map); // 'System/Colliders'
        this.setupInteractables(map); // 'System/Interactables'
        this.setupInput();
        this.setupCamera(map);

        // Show welcome message on first game load
        if (!this.registry.get('hasWelcomeShown')) {
            // Freeze gameplay + play intro wave until the welcome dialog closes.
            this.setMovementLocked(true);
            if (this.anims.exists('hello_wave')) {
                this.player.play('hello_wave', true);
            }

            this.time.delayedCall(500, () => {
                const isDesktop = this.game.device.os.desktop;
                const instructions = isDesktop 
                    ? "Use the arrow keys to move (← ↑ → ↓) and press [E] to interact." 
                    : "Use the on-screen buttons to move and interact.";

                this.showDialogue({
                    text: `Hello, traveler! My name is Augusto.|||Welcome to my village — here you can explore my creations and experiences.|||${instructions}`,
                    onClose: () => {
                        this.setMovementLocked(false);
                        const facing = this.registry.get('playerDirection') || 'down';
                        this.player.play(`idle_${facing}`, true);
                    },
                });
            });
            this.registry.set('hasWelcomeShown', true);
        }
    }
    
    protected handleInteraction(obj: any) {
        let onCloseCallback: (() => void) | undefined;

        if (obj.type === 'door') {
            const locked = obj.properties?.find((p: any) => p.name === 'locked')?.value;
            
            if (locked) {
                const keyColor = obj.properties?.find((p: any) => p.name === 'key_color')?.value;
                const inventory = this.registry.get('inventory') || [];
                // Assuming inventory stores items as 'blue_key'
                const requiredKey = `${keyColor}_key`;
                
                if (!inventory.includes(requiredKey)) {
                    this.showDialogue(`Locked! You need the ${keyColor} key.`);
                    return;
                }
            }

            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;
            
            if (goToMap === 'dungeon') {
                this.transitionToScene('DungeonScene', { spawnLocation: goToDoor });
            } else if (goToMap === 'projects_castle') {
                this.transitionToScene('ProjectsCastleScene', { spawnLocation: goToDoor });
            }
        } else if (obj.name === 'projects_closed_chest') {
            const closedChest = this.objectSprites.get('projects_closed_chest');
            const openChest = this.objectSprites.get('projects_open_chest');
            
            if (closedChest?.visible) {
                closedChest.setVisible(false);
                openChest?.setVisible(true);

                // Added key animation
                if (openChest) {
                    // Blue key frame ID is 42
                    const keySprite = this.add.sprite(openChest.x + openChest.width / 2, openChest.y - openChest.height / 2, 'decor_sheet', 42);
                    keySprite.setOrigin(0.5, 0.5);
                    keySprite.setDepth(openChest.depth + 1);

                    this.tweens.add({
                        targets: keySprite,
                        y: keySprite.y - 20,
                        duration: 1000,
                        ease: 'Power2'
                    });
                    
                    onCloseCallback = () => {
                        // Target position calculation considering camera zoom and scroll
                        // The HUD icon is at (Width - 40, 40) in screen coordinates
                        const camera = this.cameras.main;
                        const zoom = camera.zoom;
                        
                        // Map screen coordinate to world coordinate
                        // Use worldView.right/top for safer bounds calculation
                        const targetX = camera.worldView.right - (50 / zoom);
                        const targetY = camera.worldView.top + (50 / zoom);
                        
                        this.tweens.add({
                            targets: keySprite,
                            x: targetX,
                            y: targetY,
                            scaleX: 0.5,
                            scaleY: 0.5,
                            duration: 800,
                            ease: 'Back.In',
                            onComplete: () => {
                                keySprite.destroy();
                                // Update inventory
                                const currentInventory = this.registry.get('inventory') || [];
                                if (!currentInventory.includes('blue_key')) {
                                    this.registry.set('inventory', [...currentInventory, 'blue_key']);
                                }
                            }
                        });
                    };
                }
            } else {
                return;
            }
        }
        
        const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
        if (text) {
            const keyWord = obj.properties?.find((p: any) => p.name === 'key_word')?.value;
            const keyWordColor = obj.properties?.find((p: any) => p.name === 'key_word_color')?.value;
            this.showDialogue({ text, keyWord, keyWordColor, onClose: onCloseCallback });
        }
    }
    
    protected onInteractableEnter(obj: any) {
        var offsetYPx = 1;
        if (obj.name === 'projects_closed_chest') {
            offsetYPx = 0;
        }
        const sprite = this.objectSprites.get(obj.name)
        if (sprite) {
            OutlineEffect.apply(sprite, 0xffffff, 0.002, 0, offsetYPx);
        }
    }
    
    protected onInteractableExit(obj: any) {
        const sprite = this.objectSprites.get(obj.name);
        if (sprite) {
            OutlineEffect.remove(sprite);
        }
    }
}
