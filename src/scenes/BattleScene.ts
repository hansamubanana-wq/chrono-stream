// src/scenes/BattleScene.ts
import Phaser from 'phaser';
import Card from '../objects/Card';
import Timeline from '../objects/Timeline'; // ここが正しく読み込めればOK！

export default class BattleScene extends Phaser.Scene {
    // タイムラインの変数を定義
    private timeline!: Timeline;

    constructor() {
        super('BattleScene');
    }

    create() {
        // 背景色
        this.cameras.main.setBackgroundColor('#222222');

        // --- 1. タイムラインの配置 ---
        // ここでエラーが出ていたはずですが、importが直れば動きます
        this.timeline = new Timeline(this, 640, 150);

        // --- 2. イベント設定（マスのクリックテスト） ---
        this.timeline.onClickSlot = (index) => {
            console.log(`Slot ${index} clicked!`);
            // クリックされたマスの敵を、右(+1)に動かす
            this.timeline.tryMoveIntent(this, index, 1);
        };

        // --- 3. テスト用の敵配置 ---
        // 第3引数の 'ATTACK' などはただの文字列なので、型定義をimportしなくても動きます
        this.timeline.addIntent(this, 1, 'ATTACK', 10);
        this.timeline.addIntent(this, 3, 'DEFEND', 5);
        this.timeline.addIntent(this, 4, 'ATTACK', 99);


        // --- 4. プレイヤーの手札 ---
        const startX = 400;
        const y = 600;
        const gap = 150;

        new Card(this, startX, y, 'Push', 0xff0000);
        new Card(this, startX + gap, y, 'Pull', 0x0000ff);
        new Card(this, startX + gap * 2, y, 'Attack', 0x00ff00); 

        // 案内テキスト
        this.add.text(640, 30, 'Battle: Turn 1', {
            fontSize: '32px', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
    }
}