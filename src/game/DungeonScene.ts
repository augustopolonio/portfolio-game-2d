import BaseScene from './BaseScene';
import { TiledMapLoader, type MapConfig } from './TiledMapLoader';
import { PLAYER_CONFIG } from './GameConfig';
import OutlineEffect from './OutlineEffect';

export default class DungeonScene extends BaseScene {
    private mapConfig: MapConfig = {
        tilesetFolder: 'P_P_FREE_RPG_TILESET',
        tilesets: [
            { name: 'Island_24x24', path: 'Island_24x24.png' },
            { name: 'Dungeon_24x24', path: 'Dungeon_24x24.png' },
            { name: 'example', path: 'example.png' },
            { name: 'decor', path: 'decor.png' },
            { name: 'decor_sheet', path: 'decor.png', spritesheet: { frameWidth: 24, frameHeight: 24 } },
        ],
        mapKey: 'dungeon_map',
        mapPath: 'assets/tiled/maps/dungeon.json',
    };

    constructor() {
        super('DungeonScene');
    }

    preload() {
        TiledMapLoader.loadPlayer(this, PLAYER_CONFIG);
        TiledMapLoader.loadMap(this, this.mapConfig);
    }

    create() {
        OutlineEffect.addToScene(this);
        const { map, tilesets } = TiledMapLoader.createMap(this, this.mapConfig);

        map.createLayer('BaseMap', tilesets, 0, 0);
        
        const tiledObjectsLayer = map.getLayer('Objects/TiledObjects');
        if (tiledObjectsLayer) {
            map.createLayer('Objects/TiledObjects', tilesets, 0, 0);
        }
        
        this.setupObjects(map);
        this.objectSprites.get('open_chest')?.setVisible(false);
        
        this.setupPlayer(map);
        this.setupColliders(map);
        this.setupInteractables(map);
        this.setupInput();
        this.setupCamera(map);

        // Test for BBCode Text
        this.input.keyboard?.on('keydown-T', () => {
             this.showDialogue({
                text: "This is a test message. The {0} is colored!",
                keyWord: "magic word",
                keyWordColor: "#00ff00"
             });
        });
    }
    
    protected handleInteraction(obj: any) {
        if (obj.type === 'door') {
            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;
            
            if (goToMap === 'island') {
                this.transitionToScene('IslandScene', { spawnLocation: goToDoor });
            }
        } else if (obj.name === 'chest') {
            const closedChest = this.objectSprites.get('closed_chest');
            const openChest = this.objectSprites.get('open_chest');
            
            if (closedChest?.visible) {
                closedChest.setVisible(false);
                openChest?.setVisible(true);
                this.showDialogue('Chest opened! Please read this important message: Thank you for playing this game. Have a great day! This chest is now empty.');
            } else {
                this.showDialogue('Chest already open');
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
        if (obj.name === 'chest') {
            const sprite = this.objectSprites.get('closed_chest');
            if (sprite) {
                OutlineEffect.apply(sprite);
            }
        }
    }
    
    protected onInteractableExit(obj: any) {
        if (obj.name === 'chest') {
            const sprite = this.objectSprites.get('closed_chest');
            if (sprite) {
                OutlineEffect.remove(sprite);
            }
        }
    }
}
