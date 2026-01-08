// src/objects/EnemyIntent.ts
import Phaser from 'phaser';

// 他のファイルから読み込まず、ここで定義する！
export type IntentType = 'ATTACK' | 'DEFEND';

export default class EnemyIntent extends Phaser.GameObjects.Container {
    public intentType: IntentType;
    public value: number;

    constructor(scene: Phaser.Scene, type: IntentType, value: number) {
        super(scene, 0, 0);

        this.intentType = type;
        this.value = value;

        // 1. 背景
        const bg = scene.add.circle(0, 0, 30, 0xffffff);
        
        let color = 0xff0000;
        let label = 'ATK';
        
        if (type === 'DEFEND') {
            color = 0x0055ff;
            label = 'DEF';
        }

        bg.setFillStyle(color);
        bg.setStrokeStyle(2, 0xffffff);

        // 2. テキスト
        const valueText = scene.add.text(0, -5, value.toString(), {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const typeText = scene.add.text(0, 15, label, {
            fontSize: '12px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add([bg, valueText, typeText]);
        scene.add.existing(this);
    }
}