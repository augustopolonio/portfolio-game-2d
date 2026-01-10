import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import DungeonScene from '../game/DungeonScene';
import IslandScene from '../game/IslandScene';
import MobileControls from './MobileControls';
import './PhaserGame.css';

const PhaserGame = () => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const [mobileInput, setMobileInput] = useState({ x: 0, y: 0, interact: false });
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    const handleInteract = () => {
        setMobileInput(prev => ({ ...prev, interact: true }));
        setTimeout(() => setMobileInput(prev => ({ ...prev, interact: false })), 100);
    };

    useEffect(() => {
        if (!gameContainer.current || gameInstance.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.WEBGL,
            width: 800,
            height: 500,
            backgroundColor: '#2d2d2d',
            parent: gameContainer.current,
            pixelArt: true,
            scene: [DungeonScene, IslandScene],
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scale: {
                 mode: Phaser.Scale.FIT,
                // autoCenter: Phaser.Scale.CENTER_BOTH,
                // width: 800,
                // height: 500,
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
        const handleResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
            if (gameInstance.current) {
                gameInstance.current.scale.refresh();
            }
        };
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        if (gameInstance.current) {
            gameInstance.current.registry.set('mobileInput', mobileInput);
        }
    }, [mobileInput]);

    return (
        <div className={`phaser-game-wrapper ${isLandscape ? 'landscape' : 'portrait'}`}>
            <div ref={gameContainer} className="phaser-game-container" />
            <MobileControls 
                onMove={(direction) => setMobileInput(prev => ({ ...prev, x: direction.x, y: direction.y }))}
                onInteract={handleInteract}
            />
        </div>
    );
};

export default PhaserGame;