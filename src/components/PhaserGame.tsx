import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import DungeonScene from '../game/DungeonScene';
import IslandScene from '../game/IslandScene';
import MobileControls from './MobileControls';

const PhaserGame = () => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const [mobileInput, setMobileInput] = useState({ x: 0, y: 0, interact: false });

    const handleInteract = () => {
        setMobileInput(prev => ({ ...prev, interact: true }));
        setTimeout(() => setMobileInput(prev => ({ ...prev, interact: false })), 100);
    };

    useEffect(() => {
        if (!gameContainer.current || gameInstance.current) return;

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
        gameInstance.current = new Phaser.Game(config);
        gameInstance.current.registry.set('mobileInput', mobileInput);

        // 4. Cleanup function (runs when component unmounts)
        return () => {
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
                gameInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (gameInstance.current) {
            gameInstance.current.registry.set('mobileInput', mobileInput);
        }
    }, [mobileInput]);

    return (
        <>
            <div 
                ref={gameContainer} 
                style={{ width: '800px', height: '600px', margin: '0 auto' }}
            />
            <MobileControls 
                onMove={(direction) => setMobileInput(prev => ({ ...prev, x: direction.x, y: direction.y }))}
                onInteract={handleInteract}
            />
        </>
    );
};

export default PhaserGame;