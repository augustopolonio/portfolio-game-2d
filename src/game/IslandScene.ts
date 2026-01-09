import Phaser from 'phaser';
import BaseScene from './BaseScene';

export default class IslandScene extends BaseScene {
    constructor() {
        super('IslandScene');
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
            
            if (goToMap === 'dungeon') {
                this.transitionToScene('DungeonScene', { spawnLocation: goToDoor });
            }
        } else if (obj.class === 'info') {
            const text = obj.properties?.find((p: any) => p.name === 'text')?.value;
            console.log(`Info: ${text}`);
        }
    }
}
