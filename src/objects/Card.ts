// src/objects/Card.ts
import Phaser from 'phaser';

export default class Card extends Phaser.GameObjects.Container {
    private cardName: string; // カードの種類を覚えておく変数

    constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: number) {
        super(scene, x, y);

        this.cardName = text; // 名前を保存（例："Push"）

        const width = 120;
        const height = 180;

        // --- 描画処理 ---
        const bg = scene.add.graphics();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        
        const border = scene.add.graphics();
        border.lineStyle(4, color, 1);
        border.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);

        const nameText = scene.add.text(0, 0, text, {
            fontSize: '18px',
            color: '#000000',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add([bg, border, nameText]);
        scene.add.existing(this);

        // --- インタラクション設定 ---
        this.setSize(width, height);
        this.setInteractive({ useHandCursor: true });

        // ホバー時の動き
        this.on('pointerover', () => {
            scene.tweens.add({
                targets: this,
                scaleX: 1.1,
                scaleY: 1.1,
                y: y - 20,
                duration: 100,
                ease: 'Power1'
            });
            scene.children.bringToTop(this);
        });

        // ホバー解除時の動き
        this.on('pointerout', () => {
            scene.tweens.add({
                targets: this,
                scaleX: 1.0,
                scaleY: 1.0,
                y: y,
                duration: 100,
                ease: 'Power1'
            });
        });

        // クリック時の動き
        this.on('pointerdown', () => {
            this.playUseAnimation(scene);
        });
    }

    // カード使用アニメーション
    playUseAnimation(scene: Phaser.Scene) {
        this.disableInteractive(); // 連打防止

        scene.tweens.add({
            targets: this,
            y: this.y - 100,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            onComplete: () => {
                // ★ここが重要：使い終わったらシーンに通知を送る！
                // "use_card" というイベント名で、このカードの名前を送ります
                scene.events.emit('use_card', this.cardName);
                
                // テスト用にカードを復活させる
                this.resetCard(); 
            }
        });
    }

    resetCard() {
        this.y += 100;
        this.alpha = 1;
        this.scaleX = 1;
        this.scaleY = 1;
        this.setInteractive();
    }
}