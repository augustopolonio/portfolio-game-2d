import BaseScene from './BaseScene';
import { TiledMapLoader, type MapConfig } from './TiledMapLoader';
import { PLAYER_CONFIG } from './GameConfig';
import OutlineEffect from './OutlineEffect';

export default class ProjectsCastleScene extends BaseScene {
    private mapConfig: MapConfig = {
        tilesetFolder: 'P_P_FREE_RPG_TILESET',
        tilesets: [
            { name: 'Island_24x24', path: 'Island_24x24.png' },
            { name: 'Dungeon_24x24', path: 'Dungeon_24x24.png' },
            { name: 'decor', path: 'decor.png' },
            // Sheets to use loose tiles (objects/key sprites)
            { name: 'decor_sheet', path: 'decor.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
            { name: 'Dungeon_24x24_sheet', path: 'Dungeon_24x24.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
            { name: 'Island_24x24_sheet', path: 'Island_24x24.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
        ],
        mapKey: 'projects_castle_map',
        mapPath: 'assets/tiled/maps/projects_castle.json',
    };

    constructor() {
        super('ProjectsCastleScene');
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
            topLayer?.setDepth(map.heightInPixels + 1000);
        }

        // Our loader doesn't respect Tiled's initial visibility flag, so hide open chest explicitly.
        this.objectSprites.get('experience_open_chest')?.setVisible(false);

        this.setupColliders(map); // 'System/Colliders'
        this.setupInteractables(map); // 'System/Interactables'
        this.setupInput();
        this.setupCamera(map);
    }

    protected handleInteraction(obj: any) {
        let onCloseCallback: (() => void) | undefined;

        if (obj.type === 'door') {
            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;

            if (goToMap === 'island') {
                this.transitionToScene('IslandScene', { spawnLocation: goToDoor });
            } else if (goToMap === 'experience_castle') {
                this.transitionToScene('ExperienceCastleScene', { spawnLocation: goToDoor });
            }
        } else if (obj.name === 'experience_closed_chest') {
            const closedChest = this.objectSprites.get('experience_closed_chest');
            const openChest = this.objectSprites.get('experience_open_chest');

            if (!closedChest?.visible) {
                return;
            }

            closedChest.setVisible(false);
            openChest?.setVisible(true);

            // Key animation (reuse the same key sprite frame as HUD for now)
            if (openChest) {
                const keySprite = this.add.sprite(
                    openChest.x + openChest.width / 2,
                    openChest.y - openChest.height / 2,
                    'decor_sheet',
                    82
                );
                keySprite.setOrigin(0.5, 0.5);
                keySprite.setDepth(openChest.depth + 1);

                this.tweens.add({
                    targets: keySprite,
                    y: keySprite.y - 20,
                    duration: 1000,
                    ease: 'Power2',
                });

                onCloseCallback = () => {
                    const { x: targetX, y: targetY } = this.getHudKeySlotWorldPosition('green');

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
                            const currentInventory = this.registry.get('inventory') || [];
                            if (!currentInventory.includes('green_key')) {
                                this.registry.set('inventory', [...currentInventory, 'green_key']);
                            }
                        },
                    });
                };
            }
        }

        // Check for objects with 'id' property (projects/experiences)
        const id = obj.properties?.find((p: any) => p.name === 'id')?.value;
        if (id) {
            // For now, show the object name. Later, fetch JSON data using the id.
            this.showDialogue(`Interacting with: ${obj.name}\n(ID: ${id})`);
            return;
        }

        const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
        if (text) {
            const keyWord = obj.properties?.find((p: any) => p.name === 'key_word')?.value;
            const keyWordColor = obj.properties?.find((p: any) => p.name === 'key_word_color')?.value;
            this.showDialogue({ text, keyWord, keyWordColor, onClose: onCloseCallback });
        }
    }

    protected onInteractableEnter(obj: any) {
        let offsetYPx = 1;
        if (obj.name === 'experience_closed_chest') {
            offsetYPx = 0;
        }

        const sprite = this.objectSprites.get(obj.name);
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

