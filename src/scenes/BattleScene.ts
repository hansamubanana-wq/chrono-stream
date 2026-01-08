// src/scenes/BattleScene.ts
import Phaser from 'phaser';
import Card from '../objects/Card';
import Timeline from '../objects/Timeline';

export default class BattleScene extends Phaser.Scene {
    private timeline!: Timeline;

    constructor() {
        super('BattleScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#222222');

        // --- 1. タイムラインの配置 ---
        this.timeline = new Timeline(this, 640, 150);

        // --- 2. 敵の配置（テスト用） ---
        // T1に攻撃(10)、T3に防御(5)、T4に攻撃(99)を置く
        this.timeline.addIntent(this, 1, 'ATTACK', 10);
        this.timeline.addIntent(this, 3, 'DEFEND', 5);
        this.timeline.addIntent(this, 4, 'ATTACK', 99);

        // --- 3. カードイベントの受信設定（ここが新機能！） ---
        // Cardクラスから 'use_card' という通知が来たら、ここが動きます
        this.events.on('use_card', (cardName: string) => {
            console.log(`Card Used: ${cardName}`);

            // カードの名前によって処理を変える
            if (cardName === 'Push') {
                // Pushなら、T1にいる敵を右(+1)へ動かしてみる
                // ※本来は「対象を選んで」動かしますが、今は固定位置でテストします
                this.timeline.tryMoveIntent(this, 1, 1);
            } 
            else if (cardName === 'Pull') {
                // Pullなら、T3にいる敵を左(-1)へ動かしてみる
                this.timeline.tryMoveIntent(this, 3, -1);
            }
        });

        // --- 4. プレイヤーの手札 ---
        const startX = 400;
        const y = 600;
        const gap = 150;

        // 赤：Push、青：Pull、緑：Attack
        new Card(this, startX, y, 'Push', 0xff0000);
        new Card(this, startX + gap, y, 'Pull', 0x0000ff);
        new Card(this, startX + gap * 2, y, 'Attack', 0x00ff00); 

        // 案内テキスト
        this.add.text(640, 30, 'Battle: Turn 1', {
            fontSize: '32px', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
    }
}