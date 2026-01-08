// src/objects/Card.ts
import Phaser from 'phaser';

export default class Card extends Phaser.GameObjects.Container {
    public cardName: string; // 外部から名前を見れるようにpublicにする

    constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: number) {
        super(scene, x, y);

        this.cardName = text;

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
            this.y -= 20; // シンプルに座標操作だけにする（Tweenが重複するとバグりやすいため）
            scene.children.bringToTop(this);
        });

        // ホバー解除
        this.on('pointerout', () => {
            this.y += 20;
        });

        // ★変更点：クリックされたら「即発動」せず、「選択されたよ」と報告するだけ
        this.on('pointerdown', () => {
            // 'card_clicked' というイベントで、自分自身(this)を送る
            scene.events.emit('card_clicked', this);
        });
    }

    // ★新機能：外部から「使われたよ」と命令されたら動く
    playUseAnimation() {
        this.disableInteractive(); // もう押せないようにする

        // シーン(this.scene)を使ってアニメーション
        this.scene.tweens.add({
            targets: this,
            y: this.y - 100,
            alpha: 0,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            onComplete: () => {
                // アニメーション完了後、テスト用に復活させる
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