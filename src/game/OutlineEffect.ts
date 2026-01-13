import Phaser from 'phaser';

class OutlinePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
    constructor(game: Phaser.Game) {
        super({
            game: game,
            name: 'Outline',
            fragShader: `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec3 uOutlineColor;
uniform float uThickness;
varying vec2 outTexCoord;
varying vec4 outTint;

void main(void) {
    vec4 color = texture2D(uMainSampler, outTexCoord);
    
    if (color.a > 0.5) {
        gl_FragColor = color * outTint;
    } else {
        float outline = 0.0;
        for (float x = -1.0; x <= 1.0; x++) {
            for (float y = -1.0; y <= 1.0; y++) {
                vec4 sample = texture2D(uMainSampler, outTexCoord + vec2(x, y) * uThickness);
                if (sample.a > 0.5) {
                    outline = 1.0;
                }
            }
        }
        gl_FragColor = vec4(uOutlineColor * outline, outline);
    }
}`
        });
    }
}

export default class OutlineEffect {
    static addToScene(scene: Phaser.Scene) {
        const renderer = scene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        if (!renderer.pipelines.get('Outline')) {
            renderer.pipelines.add('Outline', new OutlinePipeline(scene.game));
        }
    }

    static apply(
        sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image,
        color: number = 0xffffff,
        thickness: number = 0.006
    ) {
        sprite.setPipeline('Outline');
        
        const r = ((color >> 16) & 255) / 255;
        const g = ((color >> 8) & 255) / 255;
        const b = (color & 255) / 255;
        
        const pipeline = sprite.pipeline as any;
        if (pipeline && pipeline.set3f && pipeline.set1f) {
            pipeline.set3f('uOutlineColor', r, g, b);
            pipeline.set1f('uThickness', thickness);
        }
    }

    static remove(sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image) {
        sprite.resetPipeline();
    }
}
