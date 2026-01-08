// src/objects/Timeline.ts
import Phaser from 'phaser';
import EnemyIntent from './EnemyIntent';

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
        
        const label = scene.add.text(-totalWidth / 2, -this.slotSize - 15, 'タイムライン (敵の行動)', {
            fontSize: '18px', color: '#00ffff', fontStyle: 'bold',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        });
        this.add(label);
    }

    // アーマー指定ができるように引数を拡張
    public addIntent(scene: Phaser.Scene, index: number, type: IntentType, value: number, isArmored: boolean = false) {
        if (index < 0 || index >= this.slotCount) return;
        
        // 既に敵がいる場所に湧く場合、古い敵は上書き（消滅）
        if (this.intents[index]) this.intents[index]?.destroy();

        const intent = new EnemyIntent(scene, type as any, value, isArmored);
        this.add(intent);
        
        const targetSlot = this.slots[index];
        intent.x = targetSlot.x;
        intent.y = targetSlot.y;

        this.intents[index] = intent;
    }

    // 「攻撃」カードによる除去
    public removeIntent(scene: Phaser.Scene, index: number) {
        if (index < 0 || index >= this.slotCount) return;

        const intent = this.intents[index];
        if (intent) {
            // ★重要：アーマー持ちは通常攻撃で死なない！
            if (intent.isArmored) {
                // ガキン！という演出（弾かれる）
                scene.tweens.add({
                    targets: intent,
                    x: intent.x + (Math.random() * 10 - 5), // 震える
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
                // メッセージを飛ばす
                this.emit('armor_hit');
                return; 
            }

            this.killIntent(scene, index);
        }
    }

    // 内部処理用：問答無用で殺す（壁激突や同士討ち用）
    private killIntent(scene: Phaser.Scene, index: number) {
        const intent = this.intents[index];
        if (!intent) return;

        this.intents[index] = null;
        this.emit('enemy_defeated'); // 撃破カウントへ通知

        // 爆発エフェクト
        const emitter = scene.add.particles(0, 0, 'spark', {
            x: this.x + intent.x,
            y: this.y + intent.y,
            speed: { min: 50, max: 200 },
            scale: { start: 1.2, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            quantity: 15,
            emitting: false
        });
        emitter.explode();

        scene.tweens.add({
            targets: intent,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: 200,
            onComplete: () => intent.destroy()
        });
    }

    public tryMoveIntent(scene: Phaser.Scene, index: number, direction: number) {
        const targetIndex = index + direction;
        
        // --- 1. 壁激突（右端を超えた） ---
        if (targetIndex >= this.slotCount) {
             this.killIntent(scene, index);
             return;
        }

        // 左端より先へはいけない
        if (targetIndex < 0) return;

        const currentIntent = this.intents[index];
        if (!currentIntent) return;

        // --- 2. 激突・同士討ち判定 ---
        const targetIntent = this.intents[targetIndex];
        
        if (targetIntent !== null) {
            // 移動先に既に敵がいる場合、両方破壊する！
            this.killIntent(scene, index);       // 移動しようとした敵
            this.killIntent(scene, targetIndex); // ぶつけられた敵
            
            // 激突の衝撃エフェクト（画面揺らし等）をシーンに要求してもいいかも
            scene.cameras.main.shake(100, 0.005);
            return;
        }

        // --- 3. 通常移動 ---
        this.intents[targetIndex] = currentIntent;
        this.intents[index] = null;

        const targetSlot = this.slots[targetIndex];
        scene.tweens.add({
            targets: currentIntent,
            x: targetSlot.x,
            y: targetSlot.y,
            duration: 200,
            ease: 'Power2'
        });
    }

    public advanceTimeline(scene: Phaser.Scene) {
        const frontIntent = this.intents[0];
        if (frontIntent) {
            this.emit('enemy_action', frontIntent.intentType, frontIntent.value);
            scene.tweens.add({
                targets: frontIntent,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                onComplete: () => frontIntent.destroy()
            });
        }

        for (let i = 1; i < this.slotCount; i++) {
            const intent = this.intents[i];
            this.intents[i - 1] = intent; 
            this.intents[i] = null;

            if (intent) {
                const targetSlot = this.slots[i - 1];
                scene.tweens.add({
                    targets: intent,
                    x: targetSlot.x,
                    y: targetSlot.y,
                    duration: 300,
                    ease: 'Power2'
                });
            }
        }
    }
}