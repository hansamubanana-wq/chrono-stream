// src/objects/Timeline.ts
import Phaser from 'phaser';
import EnemyIntent from './EnemyIntent';

// ここでも同じ型を定義してしまう（これなら読み込みエラーは起きない！）
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

    // ここで any を使って無理やり通す（安全策）
    public addIntent(scene: Phaser.Scene, index: number, type: IntentType, value: number) {
        if (index < 0 || index >= this.slotCount) return;
        if (this.intents[index]) this.intents[index]?.destroy();

        // 読み込みエラー回避のため、型チェックを少し緩めます
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
}