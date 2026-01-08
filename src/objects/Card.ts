// src/objects/Card.ts
import Phaser from 'phaser';

export default class Card extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: number) {
        super(scene, x, y);

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

        // --- ここから追加：インタラクション設定 ---

        // 1. クリック判定領域のサイズを設定（これがないと反応しません）
        this.setSize(width, height);

        // 2. 入力を有効化（カーソルが指マークになります）
        this.setInteractive({ useHandCursor: true });

        // 3. イベントリスナー（動きの設定）
        
        // マウスが乗ったとき (Hover)
        this.on('pointerover', () => {
            // 少し拡大するアニメーション
            scene.tweens.add({
                targets: this,      // 動かす対象（自分自身）
                scaleX: 1.1,        // 横に1.1倍
                scaleY: 1.1,        // 縦に1.1倍
                y: y - 20,          // 少し上に浮かせる
                duration: 100,      // 0.1秒かけて変化
                ease: 'Power1'      // 動きの加減速（滑らかに）
            });
            // 重なり順を一番手前にする（隣のカードに隠れないように）
            scene.children.bringToTop(this);
        });

        // マウスが外れたとき (Out)
        this.on('pointerout', () => {
            // 元のサイズと位置に戻す
            scene.tweens.add({
                targets: this,
                scaleX: 1.0,
                scaleY: 1.0,
                y: y,               // 元の高さに戻す
                duration: 100,
                ease: 'Power1'
            });
        });

        // クリックされたとき (Click / Tap)
        this.on('pointerdown', () => {
            this.playUseAnimation(scene);
        });
    }

    // カードを使用したときのアニメーションメソッド
    playUseAnimation(scene: Phaser.Scene) {
        // インタラクションを一時無効化（連打防止）
        this.disableInteractive();

        scene.tweens.add({
            targets: this,
            y: this.y - 100, // 大きく上に移動
            alpha: 0,        // 透明にする（消える）
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,   // 0.3秒
            onComplete: () => {
                // アニメーション完了後の処理
                console.log('Card Used!');
                // ここで本来は「敵にダメージ」などの処理が入ります
                
                // 一旦テスト用に復活させる（実際のゲームでは destroy() で消します）
                this.resetCard(scene); 
            }
        });
    }

    // テスト用：カードを元の位置に戻す
    resetCard(scene: Phaser.Scene) {
        this.y += 100; // 位置を戻す（playUseAnimationでの移動分）
        this.alpha = 1;
        this.scaleX = 1;
        this.scaleY = 1;
        this.setInteractive(); // 再びクリック可能に
    }
}