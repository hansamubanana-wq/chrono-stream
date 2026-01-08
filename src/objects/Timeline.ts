// src/objects/Timeline.ts
import Phaser from 'phaser';
// ★この行の { EnemySpecies } がエラーの元でした。STEP 1を直せばここも直ります。
import EnemyIntent, { EnemySpecies } from './EnemyIntent';

type IntentType = 'ATTACK' | 'DEFEND';

export default class Timeline extends Phaser.GameObjects.Container {
    private slots: Phaser.GameObjects.Graphics[] = [];
    private intents: (EnemyIntent | null)[] = [];
    
    private slotCount: number = 5;
    private slotSize: number = 80;
    private gap: number = 10;

    public onClickSlot: ((index: number) => void) | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        for(let i=0; i<this.slotCount; i++) {
            this.intents.push(null);
        }

        this.createSlots(scene);
        scene.add.existing(this);
    }

    private createSlots(scene: Phaser.Scene) {
        const totalWidth = (this.slotSize * this.slotCount) + (this.gap * (this.slotCount - 1));
        let currentX = -totalWidth / 2 + this.slotSize / 2;

        for (let i = 0; i < this.slotCount; i++) {
            const slotGraphics = scene.add.graphics();
            slotGraphics.lineStyle(2, 0x00ffff, 1);
            slotGraphics.fillStyle(0x001133, 0.8);
            slotGraphics.strokeRect(-this.slotSize / 2, -this.slotSize / 2, this.slotSize, this.slotSize);
            slotGraphics.fillRect(-this.slotSize / 2, -this.slotSize / 2, this.slotSize, this.slotSize);
            
            slotGraphics.x = currentX;
            slotGraphics.y = 0;

            const hitZone = scene.add.zone(currentX, 0, this.slotSize, this.slotSize);
            hitZone.setInteractive({ useHandCursor: true });
            
            hitZone.on('pointerdown', () => {
                if (this.onClickSlot) this.onClickSlot(i);
            });

            this.slots.push(slotGraphics);
            this.add([slotGraphics, hitZone]);

            const text = scene.add.text(currentX, -this.slotSize / 2 - 20, `T${i}`, {
                fontSize: '16px', color: '#00ffff', fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
            }).setOrigin(0.5);
            this.add(text);

            currentX += this.slotSize + this.gap;
        }
        
        const label = scene.add.text(-totalWidth / 2, -this.slotSize - 15, 'タイムライン', {
            fontSize: '18px', color: '#00ffff', fontStyle: 'bold',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        });
        this.add(label);
    }

    public addIntent(scene: Phaser.Scene, index: number, type: IntentType, value: number, species: EnemySpecies = 'NORMAL') {
        if (index < 0 || index >= this.slotCount) return;
        if (this.intents[index]) this.intents[index]?.destroy();

        const intent = new EnemyIntent(scene, type as any, value, species);
        this.add(intent);
        
        const targetSlot = this.slots[index];
        intent.x = targetSlot.x;
        intent.y = targetSlot.y;

        this.intents[index] = intent;
    }

    public removeIntent(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;

        const intent = this.intents[index];
        if (intent) {
            if (intent.species === 'ARMOR') {
                scene.tweens.add({
                    targets: intent, x: intent.x + (Math.random() * 10 - 5), duration: 50, yoyo: true, repeat: 3
                });
                this.emit('armor_hit');
                return; 
            }
            this.killIntent(scene, index);
        }
    }

    private killIntent(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;
        const intent = this.intents[index];
        if (!intent) return;

        this.intents[index] = null;
        this.emit('enemy_defeated');

        const isBomb = (intent.species === 'BOMB');
        const color = isBomb ? 0xff4400 : 0xffcc00; 
        const scale = isBomb ? 2.0 : 1.2;

        const emitter = scene.add.particles(0, 0, 'spark', {
            x: this.x + intent.x,
            y: this.y + intent.y,
            speed: { min: 50, max: 200 },
            scale: { start: scale, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: color,
            quantity: 15,
            emitting: false
        });
        emitter.explode();

        if (isBomb) {
            this.emit('bomb_exploded'); 
            scene.time.delayedCall(100, () => {
                this.killIntent(scene, index - 1); // 左
                this.killIntent(scene, index + 1); // 右
            });
        }

        scene.tweens.add({
            targets: intent, scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
            onComplete: () => intent.destroy()
        });
    }

    public tryMoveIntent(scene: Phaser.Scene, index: number, direction: number) {
        const targetIndex = index + direction;
        
        if (targetIndex >= this.slotCount) {
             this.killIntent(scene, index);
             return;
        }
        if (targetIndex < 0) return;

        const currentIntent = this.intents[index];
        if (!currentIntent) return;

        const targetIntent = this.intents[targetIndex];
        
        if (targetIntent !== null) {
            this.killIntent(scene, index);
            this.killIntent(scene, targetIndex);
            scene.cameras.main.shake(100, 0.005);
            return;
        }

        this.intents[targetIndex] = currentIntent;
        this.intents[index] = null;
        const targetSlot = this.slots[targetIndex];
        scene.tweens.add({
            targets: currentIntent, x: targetSlot.x, y: targetSlot.y, duration: 200, ease: 'Power2'
        });
    }

    public advanceTimeline(scene: Phaser.Scene) {
        const frontIntent = this.intents[0];
        if (frontIntent) {
            this.emit('enemy_action', frontIntent.intentType, frontIntent.value);
            scene.tweens.add({
                targets: frontIntent, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300,
                onComplete: () => frontIntent.destroy()
            });
            this.intents[0] = null;
        }

        const oldIntents = [...this.intents];
        this.intents = new Array(this.slotCount).fill(null);

        for (let i = 1; i < this.slotCount; i++) {
            const intent = oldIntents[i];
            if (!intent) continue;

            let moveStep = 1;
            if (intent.species === 'SPEED') moveStep = 2; 

            let targetIndex = Math.max(0, i - moveStep);

            while(this.intents[targetIndex] !== null && targetIndex < i) {
                targetIndex++;
            }

            this.intents[targetIndex] = intent;
            
            const targetSlot = this.slots[targetIndex];
            scene.tweens.add({
                targets: intent, x: targetSlot.x, y: targetSlot.y, duration: 300, ease: 'Power2'
            });
        }
    }
}