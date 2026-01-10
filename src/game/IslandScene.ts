import BaseScene from './BaseScene';
import { TiledMapLoader, type MapConfig } from './TiledMapLoader';

export default class IslandScene extends BaseScene {
    private mapConfig: MapConfig = {
        tilesetFolder: 'P_P_FREE_RPG_TILESET',
        tilesets: [
            { name: 'Island_24x24', path: 'Island_24x24.png' },
            { name: 'Dungeon_24x24', path: 'Dungeon_24x24.png' },
            { name: 'example', path: 'example.png' },
            { name: 'decor', path: 'decor.png' },
        ],
        mapKey: 'island_map',
        mapPath: 'assets/tiled/maps/island.json',
    };

    constructor() {
        super('IslandScene');
    }

    preload() {
        TiledMapLoader.loadMap(this, this.mapConfig);
    }

    create() {
        const { map, tilesets } = TiledMapLoader.createMap(this, this.mapConfig);

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
