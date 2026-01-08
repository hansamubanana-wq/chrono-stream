// src/main.ts
import './style.css';
import Phaser from 'phaser';

// ゲームの設定
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // WEBGLかCANVASかを自動判定
    width: 1280,       // 画面の幅（PC/スマホ両対応しやすいサイズ）
    height: 720,       // 画面の高さ
    parent: 'app',     // HTMLの<div id="app">の中に描画する
    backgroundColor: '#2d2d2d', // 背景色（ダークグレー）
    scale: {
        mode: Phaser.Scale.FIT, // 画面サイズに合わせて縮小拡大
        autoCenter: Phaser.Scale.CENTER_BOTH // 画面中央に配置
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// ゲームインスタンスの作成
new Phaser.Game(config);

// 素材の読み込み処理（今は空）
function preload() {
}

// 画面の生成処理
function create(this: Phaser.Scene) {
    // 動作確認用のテキスト表示
    this.add.text(640, 360, 'Strategy Card Rogue\nDevelopment Started', {
        fontSize: '32px',
        color: '#ffffff',
        align: 'center'
    }).setOrigin(0.5); // 中心を基準に配置
}

// 毎フレームの更新処理（今は空）
function update() {
}