import Phaser from 'phaser';
import BaseScene from './BaseScene';
import { TiledMapLoader, type MapConfig } from './TiledMapLoader';
import { PLAYER_CONFIG } from './GameConfig';

export default class DungeonScene extends BaseScene {
    private closedChest!: Phaser.GameObjects.Image;
    private openChest!: Phaser.GameObjects.Image;
    
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
        const { map, tilesets } = TiledMapLoader.createMap(this, this.mapConfig);

        map.createLayer('BaseMap', tilesets, 0, 0);
        
        const tiledObjectsLayer = map.getLayer('Objects/TiledObjects');
        if (tiledObjectsLayer) {
            map.createLayer('Objects/TiledObjects', tilesets, 0, 0);
        }
        
        const objectsLayer = map.getObjectLayer('Objects/Objects');
        objectsLayer?.objects.forEach((obj: any) => {
            if (obj.name === 'closed_chest') {
                this.closedChest = this.add.sprite(obj.x, obj.y, 'decor_sheet', 1);
                this.closedChest.setOrigin(0, 1);
            } else if (obj.name === 'open_chest') {
                this.openChest = this.add.sprite(obj.x, obj.y, 'decor_sheet', 4);
                this.openChest.setOrigin(0, 1);
                this.openChest.setVisible(false);
            }
        });
        
        this.setupPlayer(map);
        this.setupColliders(map);
        this.setupInteractables(map);
        this.setupInput();
        this.setupCamera(map);
    }
    
    protected handleInteraction(obj: any) {
        if (obj.type === 'door') {
            const goToMap = obj.properties?.find((p: any) => p.name === 'go_to_map')?.value;
            const goToDoor = obj.properties?.find((p: any) => p.name === 'go_to_door')?.value;
            
            if (goToMap === 'island') {
                this.transitionToScene('IslandScene', { spawnLocation: goToDoor });
            }
        } else if (obj.name === 'chest') {
            if (this.closedChest.visible) {
                this.closedChest.setVisible(false);
                this.openChest.setVisible(true);
                this.showDialogue('Chest opened! Please read this important message: Thank you for playing this game. Have a great day! This chest is now empty.');
            } else {
                this.showDialogue('Chest already open');
            }
        }
        
        const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
        if (text) {
            this.showDialogue(text);
        }
    }
}
