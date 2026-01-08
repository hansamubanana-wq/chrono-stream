// src/objects/Timeline.ts
import Phaser from 'phaser';
import EnemyIntent, { type EnemySpecies } from './EnemyIntent';

type IntentType = 'ATTACK' | 'DEFEND';

export default class Timeline extends Phaser.GameObjects.Container {
    private slots: Phaser.GameObjects.Graphics[] = [];
    private intents: (EnemyIntent | null)[] = [];
    
    // ★変更：スロット数を5から4に減らす（難易度アップ）
    private slotCount: number = 4;
    private slotSize: number = 80;
    private gap: number = 15;

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

        const baseLine = scene.add.graphics();
        baseLine.lineStyle(4, 0x00ffff, 0.5);
        baseLine.lineBetween(-totalWidth/2 - 20, 0, totalWidth/2 + 60, 0);
        this.add(baseLine);

        for (let i = 0; i < this.slotCount; i++) {
            const slotGraphics = scene.add.graphics();
            slotGraphics.lineStyle(3, 0x00ffff, 1);
            slotGraphics.fillStyle(0x000a22, 0.9);
            slotGraphics.fillRoundedRect(-this.slotSize/2, -this.slotSize/2, this.slotSize, this.slotSize, 10);
            slotGraphics.strokeRoundedRect(-this.slotSize/2, -this.slotSize/2, this.slotSize, this.slotSize, 10);
            slotGraphics.x = currentX; slotGraphics.y = 0;

            const hitZone = scene.add.zone(currentX, 0, this.slotSize, this.slotSize);
            hitZone.setInteractive({ useHandCursor: true });
            hitZone.on('pointerdown', () => { if (this.onClickSlot) this.onClickSlot(i); });

            this.slots.push(slotGraphics);
            this.add([slotGraphics, hitZone]);

            const text = scene.add.text(currentX, -this.slotSize / 2 - 25, `SLOT ${i}`, {
                fontSize: '14px', color: '#00ffff', fontFamily: '"Orbitron", sans-serif'
            }).setOrigin(0.5);
            this.add(text);
            currentX += this.slotSize + this.gap;
        }
        
        const label = scene.add.text(-totalWidth / 2, -this.slotSize - 20, 'INCOMING THREATS >>', {
            fontSize: '20px', color: '#00ffff', fontStyle: 'bold',
            fontFamily: '"Orbitron", sans-serif'
        }).setStroke('#0055ff', 4);
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

    public stunIntent(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;
        const intent = this.intents[index];
        if (intent) {
            if (intent.species === 'KING') {
                this.playBounceAnimation(scene, intent);
                this.emit('armor_hit', 'KING'); 
                return;
            }
            intent.setStun(true);
            scene.tweens.add({
                targets: intent, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true, repeat: 1
            });
        }
    }

    public thunderIntent(scene: Phaser.Scene, index: number) {
        const targets = [index - 1, index, index + 1];
        const centerSlot = this.slots[Math.max(0, Math.min(index, this.slotCount - 1))];
        const flash = scene.add.circle(centerSlot.x, centerSlot.y, 150, 0xffff00, 0.5);
        scene.tweens.add({ targets: flash, alpha: 0, scale: 0, duration: 300, onComplete: () => flash.destroy() });
        scene.cameras.main.shake(100, 0.01);

        targets.forEach(i => {
            if (i >= 0 && i < this.slotCount) {
                const intent = this.intents[i];
                if (intent) {
                    if (intent.species === 'KING') {
                        this.playBounceAnimation(scene, intent); 
                    } else {
                        this.killIntent(scene, i);
                    }
                }
            }
        });
    }

    public removeIntent(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;
        const intent = this.intents[index];
        if (intent) {
            if (intent.species === 'ARMOR' || intent.species === 'KING') {
                this.playBounceAnimation(scene, intent);
                this.emit('armor_hit', intent.species);
                return; 
            }
            this.killIntent(scene, index);
        }
    }

    private playBounceAnimation(scene: Phaser.Scene, intent: Phaser.GameObjects.Container) {
        scene.tweens.add({
            targets: intent, x: intent.x + (Math.random() * 10 - 5), duration: 50, yoyo: true, repeat: 3
        });
    }

    private killIntent(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;
        const intent = this.intents[index];
        if (!intent) return;

        this.intents[index] = null;
        this.emit('enemy_defeated');

        const isBomb = (intent.species === 'BOMB');
        const isKing = (intent.species === 'KING');
        let color = 0xffcc00;
        let scale = 1.2;
        let quantity = 20;

        if (isBomb) { color = 0xff4400; scale = 2.5; quantity = 40; }
        if (isKing) { color = 0xff00ff; scale = 4.0; quantity = 60; }

        const emitter = scene.add.particles(0, 0, 'spark', {
            x: this.x + intent.x,
            y: this.y + intent.y,
            speed: { min: 100, max: 400 },
            scale: { start: scale, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            tint: color,
            quantity: quantity,
            emitting: false
        });
        emitter.explode();

        if (isBomb) {
            this.emit('bomb_exploded'); 
            scene.time.delayedCall(100, () => {
                this.tryKillNeighbor(scene, index - 1);
                this.tryKillNeighbor(scene, index + 1);
            });
        }

        scene.tweens.add({
            targets: intent, scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
            onComplete: () => intent.destroy()
        });
    }

    private tryKillNeighbor(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;
        const intent = this.intents[index];
        if (!intent) return;
        if (intent.species === 'KING') {
            this.playBounceAnimation(scene, intent);
            this.emit('armor_hit', 'KING');
            return;
        }
        this.killIntent(scene, index);
    }

    public tryMoveIntent(scene: Phaser.Scene, index: number, direction: number) {
        const targetIndex = index + direction;
        const currentIntent = this.intents[index];
        if (!currentIntent) return;

        if (targetIndex >= this.slotCount) {
             this.killIntent(scene, index);
             return;
        }
        if (targetIndex < 0) return;
        
        const targetIntent = this.intents[targetIndex];
        
        if (targetIntent !== null) {
            if (currentIntent.species === 'KING') {
                this.killIntent(scene, targetIndex);
                this.playBounceAnimation(scene, currentIntent);
                return;
            }
            if (targetIntent.species === 'KING') {
                this.killIntent(scene, index);
                this.playBounceAnimation(scene, targetIntent);
                return;
            }
            this.killIntent(scene, index);
            this.killIntent(scene, targetIndex);
            scene.cameras.main.shake(150, 0.01);
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
            if (frontIntent.isStunned) {
                frontIntent.setStun(false);
            } else {
                this.emit('enemy_action', frontIntent.intentType, frontIntent.value);
                scene.tweens.add({
                    targets: frontIntent, alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 300,
                    onComplete: () => frontIntent.destroy()
                });
                this.intents[0] = null;
            }
        }

        const oldIntents = [...this.intents];
        for(let i=1; i<this.slotCount; i++) this.intents[i] = null;

        for (let i = 1; i < this.slotCount; i++) {
            const intent = oldIntents[i];
            if (!intent) continue;

            let moveStep = 1;
            if (intent.species === 'SPEED') moveStep = 2; 

            if (intent.isStunned) {
                moveStep = 0;
                intent.setStun(false);
            }

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