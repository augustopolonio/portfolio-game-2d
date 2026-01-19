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
        
        this.objectSprites.get('open_chest')?.setVisible(false);
        this.setupColliders(map); // 'System/Colliders'
        this.setupInteractables(map); // 'System/Interactables'
        this.setupInput();
        this.setupCamera(map);
    }
    
    protected handleInteraction(obj: any) {
        if (obj.type === 'door') {
            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;
            
            if (goToMap === 'dungeon') {
                this.transitionToScene('DungeonScene', { spawnLocation: goToDoor });
            }
        } else if (obj.name === 'chest') {
            const closedChest = this.objectSprites.get('closed_chest');
            const openChest = this.objectSprites.get('open_chest');
            
            if (closedChest?.visible) {
                closedChest.setVisible(false);
                openChest?.setVisible(true);
            } else {
                return;
            }
        }
        
        const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
        if (text) {
            const keyWord = obj.properties?.find((p: any) => p.name === 'key_word')?.value;
            const keyWordColor = obj.properties?.find((p: any) => p.name === 'key_word_color')?.value;
            this.showDialogue({ text, keyWord, keyWordColor });
        }
    }
    
    protected onInteractableEnter(obj: any) {
        if (obj.name === 'dungeon_info') {
            const sprite = this.objectSprites.get('dungeon_info');
            if (sprite) {
                OutlineEffect.apply(sprite);
            }
        }
    }
    
    protected onInteractableExit(obj: any) {
        if (obj.name === 'dungeon_info') {
            const sprite = this.objectSprites.get('dungeon_info');
            if (sprite) {
                OutlineEffect.remove(sprite);
            }
        }
    }
}
