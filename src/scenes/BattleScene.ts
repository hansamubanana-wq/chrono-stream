// src/scenes/BattleScene.ts
import Phaser from 'phaser';
import Card from '../objects/Card';
import Timeline from '../objects/Timeline';

export default class BattleScene extends Phaser.Scene {
    private timeline!: Timeline;
    private selectedCard: Card | null = null;
    private guideText!: Phaser.GameObjects.Text;

    private playerHp: number = 100;
    private hpText!: Phaser.GameObjects.Text;
    
    // ゲームオーバー状態かどうかのフラグ
    private isGameOver: boolean = false;

    constructor() {
        super('BattleScene');
    }

    create() {
        this.isGameOver = false; // 初期化
        this.playerHp = 100;     // HPリセット
        this.cameras.main.setBackgroundColor('#222222');

        // --- UI設定 ---
        this.guideText = this.add.text(640, 550, 'Select a Card...', {
            fontSize: '24px', color: '#ffff00', fontStyle: 'bold'
        }).setOrigin(0.5);

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

        // ★敵の攻撃を受け取る処理
        this.timeline.on('enemy_action', (type: string, value: number) => {
            if (this.isGameOver) return; // ゲームオーバーなら何もしない

            if (type === 'ATTACK') {
                this.playerHp -= value;
                this.cameras.main.shake(200, 0.01);
            }
            this.hpText.setText(`HP: ${this.playerHp}`);
            
            // ★HPチェック（ここが追加点）
            if (this.playerHp <= 0) {
                this.gameOver();
            }
        });

        // --- 2. 敵配置 ---
        this.timeline.addIntent(this, 0, 'ATTACK', 10);
        this.timeline.addIntent(this, 1, 'ATTACK', 20);
        this.timeline.addIntent(this, 3, 'DEFEND', 5);

        // --- 3. ターン終了ボタン ---
        endTurnBtn.on('pointerdown', () => {
            if (this.isGameOver) return; // ゲームオーバーなら押せない

            this.selectedCard = null;
            this.guideText.setText('Enemy Turn...');
            
            this.timeline.advanceTimeline(this);
            
            this.time.delayedCall(1000, () => {
                if (this.isGameOver) return; // 生きていればターン継続
                
                this.guideText.setText('Your Turn');
                // 敵の補充（無限湧き）
                const randomVal = Phaser.Math.Between(10, 30);
                this.timeline.addIntent(this, 4, 'ATTACK', randomVal);
            });
        });

        // --- 4. カードイベント ---
        this.events.on('card_clicked', (card: Card) => {
            if (this.isGameOver) return;
            this.selectedCard = card;
            this.guideText.setText(`Selected: ${card.cardName} >> Click a Target Slot!`);
        });

        // --- 5. タイムライン操作 ---
        this.timeline.onClickSlot = (index) => {
            if (this.isGameOver || !this.selectedCard) return;

            const name = this.selectedCard.cardName;
            if (name === 'Push') this.timeline.tryMoveIntent(this, index, 1);
            else if (name === 'Pull') this.timeline.tryMoveIntent(this, index, -1);
            // Attackなどはまだ未実装

            this.selectedCard.playUseAnimation();
            this.selectedCard = null;
            this.guideText.setText('Select a Card...');
        };

        // --- 6. 手札 ---
        const startX = 400;
        const y = 650;
        const gap = 150;
        new Card(this, startX, y, 'Push', 0xff0000);
        new Card(this, startX + gap, y, 'Pull', 0x0000ff);
        new Card(this, startX + gap * 2, y, 'Attack', 0x00ff00); 
    }

    // ★新機能：ゲームオーバー演出
    private gameOver() {
        this.isGameOver = true;
        this.hpText.setText('HP: 0');
        
        // 画面を少し赤くする
        this.cameras.main.flash(500, 255, 0, 0);

        // ドーンと文字表示
        this.add.text(640, 300, 'GAME OVER', {
            fontSize: '80px', color: '#ff0000', fontStyle: 'bold'
        }).setOrigin(0.5).setStroke('#ffffff', 5);

        // リトライボタン
        const retryBtn = this.add.text(640, 450, 'TRY AGAIN', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#000000',
            padding: { left: 20, right: 20, top: 10, bottom: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            // シーンを再起動（最初からになる）
            this.scene.restart();
        });
    }
}