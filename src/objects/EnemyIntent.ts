// src/objects/EnemyIntent.ts
import Phaser from 'phaser';

export type IntentType = 'ATTACK' | 'DEFEND';

export default class EnemyIntent extends Phaser.GameObjects.Container {
    public intentType: IntentType;
    public value: number;
    public isArmored: boolean; // ★追加：アーマー持ちかどうか

    constructor(scene: Phaser.Scene, type: IntentType, value: number, isArmored: boolean = false) {
        super(scene, 0, 0);

        this.intentType = type;
        this.value = value;
        this.isArmored = isArmored;

        // 1. 背景（アーマーなら銀色、通常なら色付き）
        const bg = scene.add.circle(0, 0, 30, 0xffffff);
        
        let color = 0xff0000; // 赤 (Attack)
        let strokeColor = 0xffffff;
        let strokeWidth = 2;

        if (this.isArmored) {
            color = 0x555555; // 銀色（アーマー）
            strokeColor = 0xffff00; // 金色の枠
            strokeWidth = 4;
        } else if (type === 'DEFEND') {
            color = 0x0055ff; // 青 (Defend)
        }

        bg.setFillStyle(color);
        bg.setStrokeStyle(strokeWidth, strokeColor);

        // 2. 数値テキスト
        const valueText = scene.add.text(0, -5, value.toString(), {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 3. タイプラベル
        const labelStr = this.isArmored ? 'ARMOR' : (type === 'ATTACK' ? 'ATK' : 'DEF');
        const typeText = scene.add.text(0, 15, labelStr, {
            fontSize: '10px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add([bg, valueText, typeText]);
        scene.add.existing(this);
    }
}