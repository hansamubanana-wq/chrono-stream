// src/objects/Timeline.ts
import Phaser from 'phaser';
import EnemyIntent from './EnemyIntent';

// 型定義（エラー回避のためここに記述）
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
            slotGraphics.lineStyle(2, 0xffffff, 1);
            slotGraphics.fillStyle(0x000000, 0.5);
            slotGraphics.strokeRect(-this.slotSize / 2, -this.slotSize / 2, this.slotSize, this.slotSize);
            slotGraphics.fillRect(-this.slotSize / 2, -this.slotSize / 2, this.slotSize, this.slotSize);
            
            slotGraphics.x = currentX;
            slotGraphics.y = 0;

            const hitZone = scene.add.zone(currentX, 0, this.slotSize, this.slotSize);
            hitZone.setInteractive({ useHandCursor: true });
            
            hitZone.on('pointerdown', () => {
                if (this.onClickSlot) {
                    this.onClickSlot(i);
                }
            });

            this.slots.push(slotGraphics);
            this.add([slotGraphics, hitZone]);

            const text = scene.add.text(currentX, -this.slotSize / 2 - 20, `T${i}`, {
                fontSize: '16px', color: '#aaaaaa'
            }).setOrigin(0.5);
            this.add(text);

            currentX += this.slotSize + this.gap;
        }
        
        const label = scene.add.text(-totalWidth / 2, -this.slotSize - 10, 'TIMELINE >>', {
            fontSize: '20px', color: '#00ffff', fontStyle: 'bold'
        });
        this.add(label);
    }

    public addIntent(scene: Phaser.Scene, index: number, type: IntentType, value: number) {
        if (index < 0 || index >= this.slotCount) return;
        if (this.intents[index]) this.intents[index]?.destroy();

        const intent = new EnemyIntent(scene, type as any, value);
        this.add(intent);
        
        const targetSlot = this.slots[index];
        intent.x = targetSlot.x;
        intent.y = targetSlot.y;

        this.intents[index] = intent;
    }

    public tryMoveIntent(scene: Phaser.Scene, index: number, direction: number) {
        const targetIndex = index + direction;

        if (targetIndex < 0 || targetIndex >= this.slotCount) return;

        const intent = this.intents[index];
        if (!intent) return;

        if (this.intents[targetIndex] !== null) return;

        this.intents[targetIndex] = intent;
        this.intents[index] = null;

        const targetSlot = this.slots[targetIndex];
        scene.tweens.add({
            targets: intent,
            x: targetSlot.x,
            y: targetSlot.y,
            duration: 200,
            ease: 'Power2'
        });
    }

    // --- ★新機能：ターン終了時に敵を進める ---
    public advanceTimeline(scene: Phaser.Scene) {
        // 1. 先頭(T0)に敵がいるか確認
        const frontIntent = this.intents[0];
        if (frontIntent) {
            // イベントを発信して、シーン側に「攻撃された！」と伝える
            this.emit('enemy_action', frontIntent.intentType, frontIntent.value);
            
            // アニメーションして消す
            scene.tweens.add({
                targets: frontIntent,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                onComplete: () => frontIntent.destroy()
            });
        }

        // 2. 全員を1つずつ左にずらす (T1->T0, T2->T1...)
        for (let i = 1; i < this.slotCount; i++) {
            const intent = this.intents[i];
            
            // 前のマス(i-1)を上書き
            this.intents[i - 1] = intent; 
            this.intents[i] = null; // 元の場所は空に

            if (intent) {
                // アニメーションで移動
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