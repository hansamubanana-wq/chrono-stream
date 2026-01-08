// src/scenes/BattleScene.ts
import Phaser from 'phaser';
import Card from '../objects/Card';
import Timeline from '../objects/Timeline';

export default class BattleScene extends Phaser.Scene {
    private timeline!: Timeline;
    private selectedCard: Card | null = null;
    private guideText!: Phaser.GameObjects.Text;
    private hpText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private endTurnBtn!: Phaser.GameObjects.Text;

    private playerHp: number = 100;
    private isGameOver: boolean = false;
    private isGameStarted: boolean = false;

    private defeatedCount: number = 0;
    private targetDefeatCount: number = 10;

    private hand: Card[] = [];

    constructor() {
        super('BattleScene');
    }

    create() {
        this.isGameOver = false;
        this.isGameStarted = false;
        this.playerHp = 100;
        this.defeatedCount = 0;
        this.hand = [];

        this.cameras.main.setBackgroundColor('#111111');
        this.createBackground();
        this.createTexture();

        this.showTitleScreen();
    }

    private showTitleScreen() {
        const titleContainer = this.add.container(0, 0);
        const bg = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.9).setInteractive();
        
        const titleText = this.add.text(640, 100, 'CHRONO STREAM', {
            fontSize: '60px', color: '#00ffff', fontStyle: 'bold',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5).setStroke('#ffffff', 2).setShadow(0, 0, '#00ffff', 10);

        const rules = [
            '【新システム：激突（クラッシュ）】',
            '敵を動かして別の敵にぶつけると…両方消滅する！',
            '「引き寄せ」を使って奥の敵を手前にぶつけろ！',
            '',
            '【要注意：アーマーの敵（銀色）】',
            '攻撃カードが効かない！',
            '「壁ドン」か「激突」でしか倒せないぞ。',
            '',
            '【ミッション】',
            '敵を10体撃破せよ'
        ];

        const ruleText = this.add.text(640, 380, rules, {
            fontSize: '22px', color: '#ffffff', align: 'center', lineHeight: 36,
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5);

        const startText = this.add.text(640, 620, '- Click to Start -', {
            fontSize: '32px', color: '#ffff00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText, alpha: 0, duration: 800, yoyo: true, repeat: -1
        });

        titleContainer.add([bg, titleText, ruleText, startText]);

        bg.once('pointerdown', () => {
            this.tweens.add({
                targets: titleContainer,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    titleContainer.destroy();
                    this.startGame();
                }
            });
        });
    }

    private startGame() {
        this.isGameStarted = true;

        this.guideText = this.add.text(640, 550, 'カードを選んでください', {
            fontSize: '24px', color: '#ffff00', fontStyle: 'bold',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5);

        this.hpText = this.add.text(50, 50, `HP: ${this.playerHp}`, {
            fontSize: '40px', color: '#ff4444', fontStyle: 'bold',
            fontFamily: 'Arial'
        });

        this.scoreText = this.add.text(640, 50, `撃破: 0 / ${this.targetDefeatCount}`, {
            fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5);

        this.endTurnBtn = this.add.text(1150, 650, 'ターン終了', {
            fontSize: '24px', color: '#ffffff', backgroundColor: '#cc0044',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.timeline = new Timeline(this, 640, 150);
        this.setupTimelineEvents();

        // 初期配置：アーマーを混ぜる
        this.timeline.addIntent(this, 0, 'ATTACK', 10);
        this.timeline.addIntent(this, 2, 'ATTACK', 99, true); // アーマー敵
        this.timeline.addIntent(this, 3, 'ATTACK', 10);

        this.events.on('card_clicked', (card: Card) => {
            if (this.isGameOver) return;
            this.selectedCard = card;
            this.guideText.setText(`選択中: 「${card.cardName}」 >> 対象を選んでください`);
        });

        this.timeline.onClickSlot = (index) => {
            if (this.isGameOver || !this.selectedCard) return;
            const name = this.selectedCard.cardName;

            if (name === '突き飛ばし') {
                this.timeline.tryMoveIntent(this, index, 1);
            } else if (name === '引き寄せ') {
                this.timeline.tryMoveIntent(this, index, -1);
            } else if (name === '攻撃') {
                this.timeline.removeIntent(this, index);
            }

            this.selectedCard.playUseAnimation();
            this.hand = this.hand.filter(c => c !== this.selectedCard);
            this.selectedCard = null;
            this.guideText.setText('カードを選んでください');
        };

        this.endTurnBtn.on('pointerdown', () => {
            if (this.isGameOver) return;
            this.selectedCard = null;
            this.guideText.setText('敵のターン...');
            this.clearHand();
            this.timeline.advanceTimeline(this);
            
            this.time.delayedCall(1000, () => {
                if (this.isGameOver) return;
                this.guideText.setText('あなたのターン');
                
                // 敵の補充（アーマー敵が出る確率を入れる）
                if (this.defeatedCount < this.targetDefeatCount) {
                     const randomVal = Phaser.Math.Between(10, 30);
                     const isArmor = Phaser.Math.Between(0, 100) < 30; // 30%でアーマー
                     this.timeline.addIntent(this, 4, 'ATTACK', randomVal, isArmor);
                }
                
                this.dealCards();
            });
        });

        this.dealCards();
    }

    private setupTimelineEvents() {
        this.timeline.on('enemy_action', (type: string, value: number) => {
            if (this.isGameOver) return;
            if (type === 'ATTACK') {
                this.playerHp -= value;
                this.cameras.main.shake(200, 0.01);
            }
            this.hpText.setText(`HP: ${this.playerHp}`);
            if (this.playerHp <= 0) this.gameOver();
        });

        this.timeline.on('enemy_defeated', () => {
            if (this.isGameOver) return;
            
            this.defeatedCount++;
            this.scoreText.setText(`撃破: ${this.defeatedCount} / ${this.targetDefeatCount}`);
            this.tweens.add({
                targets: this.scoreText, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true
            });

            if (this.defeatedCount >= this.targetDefeatCount) {
                this.gameClear();
            }
        });

        // アーマーに攻撃した時のメッセージ
        this.timeline.on('armor_hit', () => {
            const warning = this.add.text(640, 300, '無効！アーマーだ！', {
                fontSize: '40px', color: '#aaaaaa', fontStyle: 'bold',
                fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
            }).setOrigin(0.5).setStroke('#000000', 4);
            
            this.tweens.add({
                targets: warning, y: 250, alpha: 0, duration: 1000,
                onComplete: () => warning.destroy()
            });
        });
    }

    private createBackground() {
        this.add.grid(640, 360, 1280, 720, 50, 50, 0x000000, 0, 0x004444, 0.2);
    }

    private createTexture() {
        if (this.textures.exists('spark')) return;
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffcc00, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('spark', 8, 8);
    }

    private dealCards() {
        const startX = 400;
        const y = 650;
        const gap = 150;
        
        const cardTypes = [
            { name: '突き飛ばし', color: 0xff0000 },
            { name: '引き寄せ', color: 0x0000ff },
            { name: '攻撃', color: 0x00ff00 }
        ];

        for(let i=0; i<3; i++) {
            const type = Phaser.Math.RND.pick(cardTypes);
            const card = new Card(this, startX + (i * gap), y, type.name, type.color);
            this.hand.push(card);
        }
    }

    private clearHand() {
        this.hand.forEach(card => card.destroy());
        this.hand = [];
    }

    private gameOver() {
        this.isGameOver = true;
        this.hpText.setText('HP: 0');
        this.cameras.main.flash(500, 255, 0, 0);
        this.add.text(640, 300, 'GAME OVER', {
            fontSize: '80px', color: '#ff0000', fontStyle: 'bold',
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5).setStroke('#ffffff', 5);

        this.createRetryButton('もう一度遊ぶ');
    }

    private gameClear() {
        this.isGameOver = true;
        this.cameras.main.flash(500, 255, 255, 255);
        this.add.text(640, 300, 'MISSION COMPLETE!', {
            fontSize: '80px', color: '#ffff00', fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setStroke('#ff8800', 5);

        this.createRetryButton('次のミッションへ');
    }

    private createRetryButton(text: string) {
        const retryBtn = this.add.text(640, 450, text, {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#000000',
            padding: { left: 20, right: 20, top: 10, bottom: 10 },
            fontFamily: '"Hiragino Kaku Gothic ProN", "Meiryo", sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        retryBtn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}