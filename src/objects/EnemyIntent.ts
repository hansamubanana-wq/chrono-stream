// src/objects/EnemyIntent.ts
import Phaser from 'phaser';

export type IntentType = 'ATTACK' | 'DEFEND';
export type EnemySpecies = 'NORMAL' | 'ARMOR' | 'BOMB' | 'SPEED' | 'KING';

export default class EnemyIntent extends Phaser.GameObjects.Container {
    public intentType: IntentType;
    public value: number;
    public species: EnemySpecies;
    
    // ★追加：スタン状態フラグ
    public isStunned: boolean = false;
    private statusText: Phaser.GameObjects.Text;

    private baseGraphics: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, type: IntentType, value: number, species: EnemySpecies = 'NORMAL') {
        super(scene, 0, 0);

        this.intentType = type;
        this.value = value;
        this.species = species;

        this.baseGraphics = scene.add.graphics();
        this.drawEnemyShape(species);

        const valueText = scene.add.text(0, -5, value.toString(), {
            fontSize: '28px', color: '#ffffff', fontStyle: 'bold',
            fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5).setStroke('#000000', 4);

        let labelStr = type === 'ATTACK' ? 'ATK' : 'DEF';
        let labelSize = '12px';
        let labelY = 20;

        if (species === 'ARMOR') labelStr = 'SHIELD';
        else if (species === 'BOMB') { labelStr = '💣'; labelSize = '20px'; labelY = 15; }
        else if (species === 'SPEED') labelStr = 'BOOST';
        else if (species === 'KING') { labelStr = '👑'; labelSize = '28px'; labelY = 15; }

        const typeText = scene.add.text(0, labelY, labelStr, {
            fontSize: labelSize, color: '#ffffff', fontStyle: 'bold',
            fontFamily: '"Orbitron", sans-serif'
        }).setOrigin(0.5).setStroke('#000000', 3);

        if (species === 'KING') {
            scene.tweens.add({
                targets: this, y: '-=10', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
            });
        }

        // ★追加：状態異常表示用のテキスト（初期は非表示）
        this.statusText = scene.add.text(0, -35, '', {
            fontSize: '32px', color: '#ffff00', fontStyle: 'bold'
        }).setOrigin(0.5).setStroke('#000000', 4);

        this.add([this.baseGraphics, valueText, typeText, this.statusText]);
        scene.add.existing(this);
    }

    // ★追加：スタン状態の切り替え
    public setStun(enabled: boolean) {
        this.isStunned = enabled;
        if (enabled) {
            this.statusText.setText('💤');
            this.baseGraphics.alpha = 0.5; // 色を暗くする
        } else {
            this.statusText.setText('');
            this.baseGraphics.alpha = 1.0;
        }
    }

    private drawEnemyShape(species: EnemySpecies) {
        const g = this.baseGraphics;
        g.clear();

        let color = 0xff0000;
        let lineColor = 0xffffff;
        let lineWidth = 3;

        switch (species) {
            case 'NORMAL':
                color = 0xdd0000;
                g.fillStyle(color, 1); g.lineStyle(lineWidth, lineColor);
                g.beginPath();
                for(let i=0; i<6; i++) {
                    const angle = Phaser.Math.DegToRad(60 * i);
                    g.lineTo(Math.cos(angle)*35, Math.sin(angle)*35);
                }
                g.closePath(); g.fillPath(); g.strokePath();
                break;

            case 'ARMOR':
                color = 0x888888; lineColor = 0xffff00; lineWidth = 5;
                g.fillStyle(color, 1); g.lineStyle(lineWidth, lineColor);
                g.fillRoundedRect(-35, -35, 70, 70, 8);
                g.strokeRoundedRect(-35, -35, 70, 70, 8);
                break;

            case 'BOMB':
                color = 0xff6600;
                g.fillStyle(color, 1); g.lineStyle(lineWidth, lineColor);
                g.fillCircle(0,0,25); g.strokeCircle(0,0,25);
                for(let i=0; i<8; i++) {
                    const angle = Phaser.Math.DegToRad(45 * i);
                    g.lineBetween(Math.cos(angle)*25, Math.sin(angle)*25, Math.cos(angle)*40, Math.sin(angle)*40);
                }
                this.scene.tweens.add({
                    targets: g, alpha: 0.7, duration: 300, yoyo: true, repeat: -1
                });
                break;

            case 'SPEED':
                color = 0xaa00ff;
                g.fillStyle(color, 1); g.lineStyle(lineWidth, lineColor);
                g.beginPath();
                g.moveTo(40, 0); g.lineTo(-30, -25); g.lineTo(-15, 0); g.lineTo(-30, 25);
                g.closePath(); g.fillPath(); g.strokePath();
                break;

            case 'KING':
                color = 0x000000; lineColor = 0xff00ff; lineWidth = 8;
                g.lineStyle(4, 0xff00ff, 0.5);
                g.strokeCircle(0, 0, 50);
                g.lineStyle(2, 0xff00ff, 0.3);
                g.strokeCircle(0, 0, 60);
                g.fillStyle(color, 1); g.lineStyle(lineWidth, lineColor);
                g.beginPath();
                g.moveTo(-35, 20); g.lineTo(35, 20); g.lineTo(45, -10); g.lineTo(15, 5); g.lineTo(0, -35); g.lineTo(-15, 5); g.lineTo(-45, -10);
                g.closePath(); g.fillPath(); g.strokePath();
                break;
        }
    }
}