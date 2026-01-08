// src/objects/EnemyIntent.ts
import Phaser from 'phaser';

export type IntentType = 'ATTACK' | 'DEFEND';
// ★この行が超重要です！これがないとエラーになります
export type EnemySpecies = 'NORMAL' | 'ARMOR' | 'BOMB' | 'SPEED';

export default class EnemyIntent extends Phaser.GameObjects.Container {
    public intentType: IntentType;
    public value: number;
    public species: EnemySpecies; // 敵の種類

    constructor(scene: Phaser.Scene, type: IntentType, value: number, species: EnemySpecies = 'NORMAL') {
        super(scene, 0, 0);

        this.intentType = type;
        this.value = value;
        this.species = species;

        // 1. 背景円の描画
        const bg = scene.add.circle(0, 0, 30, 0xffffff);
        
        let fillColor = 0xff0000; // 赤 (NORMAL)
        let strokeColor = 0xffffff;
        let strokeWidth = 2;
        let labelStr = 'ATK';

        // ★種類ごとの見た目設定
        switch (species) {
            case 'ARMOR':
                fillColor = 0x555555; // 銀色
                strokeColor = 0xffff00; // 金枠
                strokeWidth = 4;
                labelStr = 'ARMOR';
                break;
            case 'BOMB':
                fillColor = 0xff8800; // オレンジ
                labelStr = 'BOMB';
                break;
            case 'SPEED':
                fillColor = 0xaa00ff; // 紫
                labelStr = 'SPD';
                break;
            default:
                if (type === 'DEFEND') {
                    fillColor = 0x0055ff;
                    labelStr = 'DEF';
                }
                break;
        }

        bg.setFillStyle(fillColor);
        bg.setStrokeStyle(strokeWidth, strokeColor);

        // 2. 数値
        const valueText = scene.add.text(0, -5, value.toString(), {
            fontSize: '24px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 3. ラベル
        const typeText = scene.add.text(0, 15, labelStr, {
            fontSize: '10px', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // ボマーなら絵文字をつける
        if (species === 'BOMB') {
            typeText.setText('💣');
            typeText.setFontSize(16);
            typeText.y = 12;
        }

        this.add([bg, valueText, typeText]);
        scene.add.existing(this);
    }
}