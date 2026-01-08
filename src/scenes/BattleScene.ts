// src/scenes/BattleScene.ts
import Phaser from 'phaser';
import Card from '../objects/Card';
import Timeline from '../objects/Timeline';

export default class BattleScene extends Phaser.Scene {
    private timeline!: Timeline;
    private selectedCard: Card | null = null;
    private guideText!: Phaser.GameObjects.Text;

    // ★追加：HP管理用
    private playerHp: number = 100;
    private hpText!: Phaser.GameObjects.Text;

    constructor() {
        super('BattleScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#222222');

        // --- UI設定 ---
        this.guideText = this.add.text(640, 550, 'Select a Card...', {
            fontSize: '24px', color: '#ffff00', fontStyle: 'bold'
        }).setOrigin(0.5);

        // HP表示
        this.hpText = this.add.text(50, 50, `HP: ${this.playerHp}`, {
            fontSize: '40px', color: '#ff0000', fontStyle: 'bold'
        });

        // ターン終了ボタン
        const endTurnBtn = this.add.text(1150, 650, 'END TURN', {
            fontSize: '24px',
            color: '#ffffff',
            backgroundColor: '#d14',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // --- 1. タイムライン ---
        this.timeline = new Timeline(this, 640, 150);

        // ★重要：敵が動いて攻撃してきたときの処理を受け取る
        this.timeline.on('enemy_action', (type: string, value: number) => {
            if (type === 'ATTACK') {
                this.playerHp -= value;
                this.cameras.main.shake(200, 0.01); // ダメージ演出（画面揺れ）
            }
            this.hpText.setText(`HP: ${this.playerHp}`);
            console.log(`Enemy Action: ${type} -> ${value} Damage!`);
        });

        // --- 2. 敵配置（テスト用） ---
        this.timeline.addIntent(this, 0, 'ATTACK', 10); // すぐ目の前にいる敵
        this.timeline.addIntent(this, 1, 'ATTACK', 20);
        this.timeline.addIntent(this, 3, 'DEFEND', 5);

        // ターン終了ボタンが押されたら
        endTurnBtn.on('pointerdown', () => {
            console.log('--- Turn End ---');
            this.selectedCard = null;
            this.guideText.setText('Enemy Turn...');
            
            // タイムラインを進める
            this.timeline.advanceTimeline(this);
            
            // 少し待ってからテキストを戻す
            this.time.delayedCall(1000, () => {
                this.guideText.setText('Your Turn');
                
                // ★おまけ：敵が減ったら補充してみる（無限湧きテスト）
                const randomVal = Phaser.Math.Between(5, 15);
                this.timeline.addIntent(this, 4, 'ATTACK', randomVal);
            });
        });

        // --- 3. カードイベント ---
        this.events.on('card_clicked', (card: Card) => {
            this.selectedCard = card;
            this.guideText.setText(`Selected: ${card.cardName} >> Click a Target Slot!`);
        });

        // --- 4. タイムライン操作 ---
        this.timeline.onClickSlot = (index) => {
            if (!this.selectedCard) return;

            const name = this.selectedCard.cardName;
            if (name === 'Push') this.timeline.tryMoveIntent(this, index, 1);
            else if (name === 'Pull') this.timeline.tryMoveIntent(this, index, -1);
            else if (name === 'Attack') {
                // 攻撃カードならその敵を消してみるテスト
                // this.timeline.addIntent(this, index, 'ATTACK', 0); // (実装省略: まだ消す機能がないので上書きなど)
            }

            this.selectedCard.playUseAnimation();
            this.selectedCard = null;
            this.guideText.setText('Select a Card...');
        };

        // --- 5. 手札 ---
        const startX = 400;
        const y = 650;
        const gap = 150;
        new Card(this, startX, y, 'Push', 0xff0000);
        new Card(this, startX + gap, y, 'Pull', 0x0000ff);
        new Card(this, startX + gap * 2, y, 'Attack', 0x00ff00); 
    }
}