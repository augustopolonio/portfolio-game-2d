import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import BBCodeTextPlugin from 'phaser3-rex-plugins/plugins/bbcodetext-plugin.js';
import IslandScene from '../game/IslandScene';
import HUDScene from '../game/HUDScene';
import ProjectsCastleScene from '../game/ProjectsCastleScene';
import ExperienceCastleScene from '../game/ExperienceCastleScene';
import MobileControls from './MobileControls';
import './PhaserGame.css';

const PhaserGame = () => {
    const gameContainer = useRef<HTMLDivElement>(null);
    const gameInstance = useRef<Phaser.Game | null>(null);
    const [mobileInput, setMobileInput] = useState({ x: 0, y: 0, interact: false });
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
            backgroundColor: '#000000',
            parent: gameContainer.current,
            pixelArt: true,
            roundPixels: true,
            loader: {
                baseURL: import.meta.env.BASE_URL,
            },
            plugins: {
                global: [{
                    key: 'rexBBCodeTextPlugin',
                    plugin: BBCodeTextPlugin,
                    start: true
                }]
            },
            scene: [IslandScene, ExperienceCastleScene, ProjectsCastleScene, HUDScene],
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: 800,
                height: 500,
            },
        };

        // 3. Initialize the game
        gameInstance.current = new Phaser.Game(config);
        gameInstance.current.registry.set('mobileInput', mobileInput);

        // Keep Phaser's internal size in sync with the actual container size.
        // On mobile (especially landscape), address bar / browser UI changes can desync the canvas.
        const parentEl = gameContainer.current;
        const game = gameInstance.current;
        const applySize = () => {
            if (!parentEl || !game) return;
            const w = parentEl.clientWidth;
            const h = parentEl.clientHeight;
            if (w > 0 && h > 0) {
                game.scale.resize(w, h);
            }
        };
        applySize();

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => applySize())
            : null;
        resizeObserver?.observe(parentEl);

        // 4. Cleanup function (runs when component unmounts)
        return () => {
            resizeObserver?.disconnect();
            if (gameInstance.current) {
                gameInstance.current.destroy(true);
                gameInstance.current = null;
            }
        };
    }, []);

    useEffect(() => {
        // Mobile browser UI (URL bar / nav bar) can change the visible viewport.
        // Use VisualViewport when available to get the *real* visible height.
        const updateAppHeight = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${height}px`);
        };

        updateAppHeight();
        window.addEventListener('resize', updateAppHeight);
        window.addEventListener('orientationchange', updateAppHeight);
        window.visualViewport?.addEventListener('resize', updateAppHeight);
        window.visualViewport?.addEventListener('scroll', updateAppHeight);

        return () => {
            window.removeEventListener('resize', updateAppHeight);
            window.removeEventListener('orientationchange', updateAppHeight);
            window.visualViewport?.removeEventListener('resize', updateAppHeight);
            window.visualViewport?.removeEventListener('scroll', updateAppHeight);
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
        <div className={`phaser-game-wrapper ${isLandscape ? 'landscape' : 'portrait'} ${isMobile ? 'has-mobile-controls' : ''}`}>
            <div ref={gameContainer} className="phaser-game-container" />
            <MobileControls 
                onMove={(direction) => setMobileInput(prev => ({ ...prev, x: direction.x, y: direction.y }))}
                onInteract={handleInteract}
            />
             {/* Force font load */}
             <div style={{ fontFamily: '"Press Start 2P"', position: 'absolute', opacity: 0, pointerEvents: 'none' }}>.</div>
        </div>
    );
};

export default PhaserGame;