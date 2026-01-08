// src/main.ts
import './style.css';
import Phaser from 'phaser';
import BattleScene from './scenes/BattleScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'app',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // ここで作成したSceneを登録リストに追加
    scene: [BattleScene]
};

new Phaser.Game(config);