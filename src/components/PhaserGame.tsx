import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import DungeonScene from '../game/DungeonScene';
import IslandScene from '../game/IslandScene';

const PhaserGame = () => {
    // 1. Create a reference to the DOM element that will hold the game
    const gameContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!gameContainer.current) return;

        // 2. Game Configuration
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.WEBGL,
            width: 800,
            height: 500,
            backgroundColor: '#2d2d2d',
            parent: gameContainer.current, // Attach game to our React Ref
            pixelArt: true,
            scene: [DungeonScene, IslandScene],
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
        };

        // 3. Initialize the game
        const game = new Phaser.Game(config);

        // 4. Cleanup function (runs when component unmounts)
        return () => {
            game.destroy(true);
        };
    }, []); // Empty dependency array means this runs once on mount

    return (
        <div 
            ref={gameContainer} 
            style={{ width: '800px', height: '600px', margin: '0 auto' }}
        />
    );
};

export default PhaserGame;