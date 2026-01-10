import Phaser from 'phaser';

export interface TilesetConfig {
    name: string;
    path: string;
    spritesheet?: { frameWidth: number; frameHeight: number };
}

export interface MapConfig {
    tilesetFolder: string;
    tilesets: TilesetConfig[];
    mapKey: string;
    mapPath: string;
}

export class TiledMapLoader {
    static loadMap(scene: Phaser.Scene, config: MapConfig) {
        // Load all tilesets
        config.tilesets.forEach(tileset => {
            const fullPath = `assets/${config.tilesetFolder}/${tileset.path}`;
            if (tileset.spritesheet) {
                scene.load.spritesheet(tileset.name, fullPath, tileset.spritesheet);
            } else {
                scene.load.image(tileset.name, fullPath);
            }
        });

        // Load tilemap
        scene.load.tilemapTiledJSON(config.mapKey, config.mapPath);
    }

    static createMap(scene: Phaser.Scene, config: MapConfig): { map: Phaser.Tilemaps.Tilemap; tilesets: Phaser.Tilemaps.Tileset[] } {
        const map = scene.make.tilemap({ key: config.mapKey });

        const tilesets = config.tilesets
            .map(tileset => map.addTilesetImage(tileset.name, tileset.name))
            .filter((t): t is Phaser.Tilemaps.Tileset => t !== null);

        return { map, tilesets };
    }
}
