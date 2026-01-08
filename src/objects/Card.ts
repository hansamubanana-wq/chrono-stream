// src/objects/Card.ts
import Phaser from 'phaser';

export default class Card extends Phaser.GameObjects.Container {
    public cardName: string;
    public cost: number; // ★コスト追加

    constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: number, cost: number) {
        super(scene, x, y);

        this.cardName = text;
        this.cost = cost;

        const width = 120;
        const height = 180;

        // 影
        const shadow = scene.add.graphics();
        shadow.fillStyle(0x000000, 0.5);
        shadow.fillRoundedRect(-width / 2 + 5, -height / 2 + 5, width, height, 10);
        
        // 背景
        const bg = scene.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        
        // 枠線
        const border = scene.add.graphics();
        border.lineStyle(4, color, 1);
        border.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

        // カード名
        const nameText = scene.add.text(0, 10, text, {
            fontSize: '18px', color: '#000000', fontStyle: 'bold',
            fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5);

        // ★コスト表示（右上の丸）
        const costBg = scene.add.circle(width/2 - 20, -height/2 + 20, 15, 0x000000);
        const costText = scene.add.text(width/2 - 20, -height/2 + 20, cost.toString(), {
            fontSize: '20px', color: '#00ffff', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5);

        this.add([shadow, bg, border, nameText, costBg, costText]);
        scene.add.existing(this);

        this.setSize(width, height);
        this.setInteractive({ useHandCursor: true });

        // ホバー時の動き
        this.on('pointerover', () => {
            this.y -= 20;
            scene.children.bringToTop(this);
        });

        this.on('pointerout', () => {
            this.y += 20;
        });

        this.on('pointerdown', () => {
            scene.events.emit('card_clicked', this);
        });
    }

    playUseAnimation() {
        this.disableInteractive();
        this.scene.tweens.add({
            targets: this, y: this.y - 100, alpha: 0, scaleX: 1.2, scaleY: 1.2, duration: 300,
            onComplete: () => { this.destroy(); }
        });
    }
}