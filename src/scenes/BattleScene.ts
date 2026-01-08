// src/scenes/BattleScene.ts
import Phaser from 'phaser';
import Card from '../objects/Card';
import Timeline from '../objects/Timeline';
import { type EnemySpecies } from '../objects/EnemyIntent';

export default class BattleScene extends Phaser.Scene {
    private timeline!: Timeline;
    private selectedCard: Card | null = null;
    private guideText!: Phaser.GameObjects.Text;
    private hpText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private endTurnBtn!: Phaser.GameObjects.Text;
    private turnCountText!: Phaser.GameObjects.Text;
    
    private energyText!: Phaser.GameObjects.Text;
    private maxEnergy: number = 3;
    private currentEnergy: number = 3;

    private playerHp: number = 100;
    private isGameOver: boolean = false;
    private turnCount: number = 1;
    private defeatedCount: number = 0;
    private targetDefeatCount: number = 20;
    private hand: Card[] = [];

    private bgGrid!: Phaser.GameObjects.TileSprite;

    constructor() {
        super('BattleScene');
    }

    create() {
        this.isGameOver = false;
        this.playerHp = 100;
        this.defeatedCount = 0;
        this.turnCount = 1;
        this.hand = [];
        this.currentEnergy = this.maxEnergy;

        this.cameras.main.setBackgroundColor('#000510');
        this.createDynamicBackground();
        this.createTexture();
        this.showTitleScreen();
    }

    update() {
        if (this.bgGrid) this.bgGrid.tilePositionY -= 1;
    }

    private createDynamicBackground() {
        const gridSize = 64;
        const g = this.make.graphics({ x: 0, y: 0 });
        g.lineStyle(1, 0x00ffff, 0.2);
        g.strokeRect(0, 0, gridSize, gridSize);
        g.generateTexture('gridTexture', gridSize, gridSize);
        g.destroy();
        this.bgGrid = this.add.tileSprite(640, 360, 1280, 720, 'gridTexture');
        this.bgGrid.setAlpha(0.5);
    }

    private showTitleScreen() {
        const titleContainer = this.add.container(0, 0);
        const bg = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.85).setInteractive();
        
        const titleText = this.add.text(640, 100, 'CHRONO STREAM', {
            fontSize: '72px', color: '#00ffff', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5).setStroke('#ffffff', 3).setShadow(0, 0, '#00ffff', 20);

        const rules = [
            '【DANGER: 敵接近速度上昇】',
            '防衛ラインが突破されました。',
            '敵は至近距離に出現します。',
            '',
            'タイムライン短縮: 5マス -> 4マス',
            '即死圏内まであとわずかです。',
            '',
            'エネルギー管理と状態異常を駆使し、',
            '生き延びてください。'
        ];

        const ruleText = this.add.text(640, 400, rules, {
            fontSize: '20px', color: '#aaddff', align: 'center', lineSpacing: 16,
            fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5);

        const startText = this.add.text(640, 650, '[ INITIALIZE SYSTEM ]', {
            fontSize: '28px', color: '#ffff00', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5);

        this.tweens.add({ targets: startText, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
        titleContainer.add([bg, titleText, ruleText, startText]);

        bg.once('pointerdown', () => {
            this.tweens.add({
                targets: titleContainer, alpha: 0, duration: 500,
                onComplete: () => { titleContainer.destroy(); this.startGame(); }
            });
        });
    }

    private startGame() {
        this.guideText = this.add.text(640, 500, 'SELECT CARD', {
            fontSize: '20px', color: '#ffff00', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5);

        this.hpText = this.add.text(50, 40, `CORE: ${this.playerHp}%`, {
            fontSize: '28px', color: '#ff4444', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        });

        this.energyText = this.add.text(50, 90, '', {
            fontSize: '32px', color: '#00ffff', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0, 0).setStroke('#0000ff', 4);
        this.updateEnergyDisplay();

        this.scoreText = this.add.text(640, 40, `PURGED: 0 / ${this.targetDefeatCount}`, {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5);

        this.turnCountText = this.add.text(1230, 40, `CYCLE: ${this.turnCount}`, {
            fontSize: '24px', color: '#aaaaaa', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(1, 0);

        this.endTurnBtn = this.add.text(1150, 650, 'EXECUTE CYCLE', {
            fontSize: '20px', color: '#ffffff', backgroundColor: '#cc0044', padding: { left: 20, right: 20, top: 15, bottom: 15 },
            fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setStroke('#ff99aa', 2);

        this.timeline = new Timeline(this, 640, 200);
        this.setupTimelineEvents();
        this.spawnEnemies(2);
        this.dealCards();

        this.events.on('card_clicked', (card: Card) => {
            if (this.isGameOver) return;
            
            if (this.currentEnergy < card.cost) {
                this.showToast('INSUFFICIENT ENERGY!', '#ff0000');
                this.cameras.main.shake(100, 0.005);
                return;
            }

            this.selectedCard = card;
            this.guideText.setText(`COST [${card.cost}] : SELECT TARGET`);
        });

        this.timeline.onClickSlot = (index) => {
            if (this.isGameOver || !this.selectedCard) return;
            if (this.currentEnergy < this.selectedCard.cost) return;

            const name = this.selectedCard.cardName;

            if (name === '突き飛ばし') this.timeline.tryMoveIntent(this, index, 1);
            else if (name === '引き寄せ') this.timeline.tryMoveIntent(this, index, -1);
            else if (name === '攻撃') this.timeline.removeIntent(this, index);
            else if (name === 'サンダー') this.timeline.thunderIntent(this, index);
            else if (name === 'スタン') this.timeline.stunIntent(this, index);

            this.currentEnergy -= this.selectedCard.cost;
            this.updateEnergyDisplay();

            this.selectedCard.playUseAnimation();
            this.hand = this.hand.filter(c => c !== this.selectedCard);
            this.selectedCard = null;
            this.guideText.setText('SELECT CARD');
        };

        this.endTurnBtn.on('pointerdown', () => {
            if (this.isGameOver) return;
            this.selectedCard = null;
            this.guideText.setText('PROCESSING ENEMY TURN...');
            this.clearHand();
            this.timeline.advanceTimeline(this);
            
            this.time.delayedCall(1000, () => {
                if (this.isGameOver) return;
                this.turnCount++;
                this.turnCountText.setText(`CYCLE: ${this.turnCount}`);
                
                this.currentEnergy = this.maxEnergy;
                this.updateEnergyDisplay();
                
                this.guideText.setText('AWAITING INPUT...');
                
                let spawnNum = 1;
                if (this.turnCount >= 3) spawnNum = 2;
                if (this.turnCount >= 7) spawnNum = 3;
                if (this.defeatedCount < this.targetDefeatCount) this.spawnEnemies(spawnNum);
                this.dealCards();
            });
        });
    }

    private updateEnergyDisplay() {
        const icons = '⚡️'.repeat(this.currentEnergy);
        const empty = '・'.repeat(this.maxEnergy - this.currentEnergy);
        this.energyText.setText(`ENERGY: ${icons}${empty}`);
    }

    private spawnEnemies(count: number) {
        // 魔王降臨チェック
        if (this.defeatedCount >= this.targetDefeatCount - 1) {
             // ★魔王は一番奥(T3)に出現
             this.timeline.addIntent(this, 3, 'ATTACK', 999, 'KING');
             this.showToast('WARNING: CLASS-X "KING"', '#ff00ff');
             return;
        }

        for(let i=0; i<count; i++) {
            // ★変更：出現位置を T1, T2, T3 からランダムに選ぶ（T0は避ける）
            // T1(手前)に出ると、次のターン攻撃されるのでかなり危険！
            const targetIndex = Phaser.Math.Between(1, 3); 
            
            const rand = Phaser.Math.Between(0, 100);
            let species: EnemySpecies = 'NORMAL';
            let val = Phaser.Math.Between(10, 30);
            if (rand < 20) { species = 'BOMB'; val = 50; }
            else if (rand < 40) { species = 'SPEED'; val = 15; }
            else if (rand < 60) { species = 'ARMOR'; val = 99; }
            this.timeline.addIntent(this, targetIndex, 'ATTACK', val, species);
        }
    }

    private setupTimelineEvents() {
        this.timeline.on('enemy_action', (type: string, value: number) => {
            if (this.isGameOver) return;
            if (type === 'ATTACK') {
                this.playerHp -= value;
                this.cameras.main.shake(250, 0.02);
            }
            this.hpText.setText(`CORE: ${this.playerHp}%`);
            if (this.playerHp <= 0) this.gameOver();
        });
        this.timeline.on('enemy_defeated', () => {
            if (this.isGameOver) return;
            this.defeatedCount++;
            this.scoreText.setText(`PURGED: ${this.defeatedCount} / ${this.targetDefeatCount}`);
            this.tweens.add({ targets: this.scoreText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true });
            if (this.defeatedCount >= this.targetDefeatCount) this.gameClear();
        });
        this.timeline.on('armor_hit', (species: string) => {
            if (species === 'KING') this.showToast('TARGET IMMUNE', '#ff00ff');
            else this.showToast('TARGET ARMORED', '#aaaaaa');
        });
        this.timeline.on('bomb_exploded', () => {
            this.showToast('EXPLOSION DETECTED', '#ff8800');
            this.cameras.main.shake(400, 0.03); 
        });
    }

    private showToast(message: string, color: string) {
        const text = this.add.text(640, 300, message, {
            fontSize: '32px', color: color, fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5).setStroke('#000000', 4).setShadow(0,0,color,10);
        this.tweens.add({ targets: text, y: 200, alpha: 0, duration: 1500, onComplete: () => text.destroy() });
    }

    private createTexture() { if (!this.textures.exists('spark')) { const g = this.make.graphics({x:0,y:0}); g.fillStyle(0xffffff,1); g.fillCircle(4,4,4); g.generateTexture('spark',8,8); } }
    
    private dealCards() {
        const startX = 350; 
        const y = 650; 
        const gap = 130;
        
        const cardTypes = [
            { name: '突き飛ばし', color: 0xff0000, cost: 1 },
            { name: '引き寄せ', color: 0x0000ff, cost: 1 },
            { name: '攻撃', color: 0x00ff00, cost: 2 },
            { name: 'サンダー', color: 0xaa00ff, cost: 3 },
            { name: 'スタン', color: 0xffff00, cost: 2 }
        ];
        
        for(let i=0; i<5; i++) {
            const type = Phaser.Math.RND.pick(cardTypes);
            new Card(this, startX + (i * gap), y, type.name, type.color, type.cost);
            this.hand.push(this.children.last as Card);
        }
    }
    private clearHand() { this.hand.forEach(c => c.destroy()); this.hand = []; }

    private gameOver() {
        this.isGameOver = true; this.hpText.setText('CORE: 0%');
        this.cameras.main.flash(1000, 255, 0, 0);
        this.add.text(640, 300, 'SYSTEM FAILURE', { fontSize: '80px', color: '#ff0000', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setShadow(0,0,'#ff0000',20);
        this.createRetryButton('REBOOT SYSTEM');
    }
    private gameClear() {
        this.isGameOver = true; this.cameras.main.flash(1000, 255, 255, 255);
        this.add.text(640, 300, 'MISSION COMPLETE', { fontSize: '60px', color: '#ffff00', fontStyle: 'bold', fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setShadow(0,0,'#ffff00',20);
        this.createRetryButton('NEXT MISSION');
    }
    private createRetryButton(text: string) {
        const btn = this.add.text(640, 480, text, { fontSize: '28px', color: '#fff', backgroundColor: '#000', padding: {left:30, right:30, top:15, bottom:15}, fontFamily: '"Orbitron", sans-serif' }).setOrigin(0.5).setInteractive({useHandCursor:true}).setStroke('#ffffff',2);
        btn.on('pointerdown', () => this.scene.restart());
        this.tweens.add({ targets: btn, scaleX: 1.05, scaleY: 1.05, duration: 800, yoyo: true, repeat: -1 });
    }
}