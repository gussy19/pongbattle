'use strict';

(() => {
  // ランダムを作成する関数を準備
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  //Ballクラス
  class Ball {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');
      // ボールのx座標をランダム生成
      this.x = rand(30, 250);
      // ボールのスタートy座標は固定
      this.y = 30;
      this.r = 10;
      // (3~5 or -3~-5をランダム生成。左右の方向性はランダム)
      this.vx = rand(3, 5) * (Math.random() < 0.5 ? 1 : -1);
      this.vy = rand(3, 5);
      this.isMissed = false;
    }

    // ミスした場合、isMissedステータスに変更
    getMissedStatus() {
      return this.isMissed;
    }

    // 跳ね返ったらyベクトルを反転させる
    bounce() {
      this.vy *= -1;
    }

    // ボールがpaddleにあたるときに、上部で跳ね返るように設定
    repositionTop(paddleTop) {
      this.y = paddleTop - this.r;
    }

    // ボールがpaddleにあたるときに、下部で跳ね返るように設定
    repositionBottom(paddleBottom) {
      this.y = paddleBottom + this.r;
    }

    // ボールのx座標取得
    getX() {
      return this.x;
    }
    // ボールのy座標取得
    getY() {
      return this.y;
    }
    // ボールの半径取得
    getR() {
      return this.r;
    }

    update() {
      // xとy座標にベクトルを加えて動かす
      this.x += this.vx;
      this.y += this.vy;

      // 壁の設定
      // キャンバスより下に行ったら、ミスのフラグを立てる
      if (this.y - this.r > this.canvas.height) {
        this.isMissed = true;
      }

      // 左か右に行ってしまった場合は、ベクトルxに-1をかけて跳ね返す
      if (
        this.x - this.r < 0 ||
        this.x + this.r > this.canvas.width
      ) {
        this.vx *= -1;
      }

      // 上に行った場合は、ベクトルyに-1をかけて跳ね返す
      if (
        this.y - this.r < 0
      ) {
        // this.vy *= -1;
        this.isMissed = true;
      }
    }

    draw() {
      this.ctx.beginPath();
      this.ctx.fillStyle = '#fdfdfd';
      // arcで円を描画 Math.PIは円周率
      this.ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  // Paddle1 クラス(プレイヤー1)
  class Paddle1 {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      this.ctx = this.canvas.getContext('2d');
      // パドルの横幅
      this.w = 60;
      // パドルの縦幅
      this.h = 16;
      // パドルのx座標
      this.x = this.canvas.width / 2 - (this.w / 2);
      // パドルのy座標
      this.y = this.canvas.height - 32;
      // マウスのx座標設定
      this.mouseX = this.x;
      // マウスの動きを反映
      this.addHandler();
    }

    // マウスの動きをmousemoveで取得。clientXでx軸を取得して追加
    addHandler() {
      document.addEventListener('mousemove', e => {
        this.mouseX = e.clientX;
      });
    }

    // ボールの位置情報のアップデート。引数はballクラス
    update(ball) {
      // y座標と半径でballの底判定
      const ballBottom = ball.getY() + ball.getR();
      // paddleの上はpaddleのy座標
      const paddleTop = this.y;
      // y座標と半径でballの上判定
      const ballTop = ball.getY() - ball.getR();
      // paddleの底は、y座標にpaddleの高さを足したもの
      const paddleBottom = this.y + this.h;
      // ボールの中心はボールのx座標
      const ballCenter = ball.getX();
      // パドルの左はpaddleのx座標
      const paddleLeft = this.x;
      // paddleの右はpaddleのx座標にwidthを足したもの
      const paddleRight = this.x + this.w;
      
      // ボールの跳ね返りイベントの設定
      if (
        ballBottom > paddleTop &&
        ballTop < paddleBottom &&
        ballCenter > paddleLeft &&
        ballCenter < paddleRight
      ) {
        // 上記のパドルの条件が揃えば、ボールの跳躍とボールの方向を指定。ゲームのスコアも追加。
        ball.bounce();
        ball.repositionTop(paddleTop);
        this.game.addScore();
      }
      
      // キャンバスの相対的な位置をrectに追加。
      const rect = this.canvas.getBoundingClientRect();
      // x座標を指定。マウス位置から長方形の左分を除いて、横幅の半分を除いたもの。
      this.x = this.mouseX - rect.left - (this.w / 2);

      // 壁の中でpaddleが動くようにする設定
      if (this.x < 0) {
        this.x = 0;
      }
      if (this.x + this.w > this.canvas.width) {
        this.x = this.canvas.width - this.w;
      }
    }

    // paddleをcanvas内に描画
    draw() {
      this.ctx.fillStyle = '#fdfdfd';
      this.ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  // Paddle2 クラス(プレイヤー2)
  class Paddle2 {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      this.ctx = this.canvas.getContext('2d');
      // パドルの横幅
      this.w = 60;
      // パドルの縦幅
      this.h = 16;
      // パドルのx座標
      this.x = this.canvas.width / 2 - (this.w / 2);
      // パドルのy座標
      this.y = this.canvas.height - 380;
      // マウスのx座標設定
      this.mouseX = this.x;
      // マウスの動きを反映
      this.addHandler();
    }

    // マウスの動きをmousemoveで取得。clientXでx軸を取得して追加
    addHandler() {
      document.addEventListener('mousemove', e => {
        this.mouseX = e.clientX;
      });
    }

    // ボールの位置情報のアップデート。引数はballクラス
    update(ball) {
      // y座標と半径でballの底判定
      const ballBottom = ball.getY() + ball.getR();
      // paddleの上はpaddleのy座標
      const paddleTop = this.y;
      // y座標と半径でballの上判定
      const ballTop = ball.getY() - ball.getR();
      // paddleの底は、y座標にpaddleの高さを足したもの
      const paddleBottom = this.y + this.h;
      // ボールの中心はボールのx座標
      const ballCenter = ball.getX();
      // パドルの左はpaddleのx座標
      const paddleLeft = this.x;
      // paddleの右はpaddleのx座標にwidthを足したもの
      const paddleRight = this.x + this.w;
      
      // ボールの跳ね返りイベントの設定
      if (
        //1行目のみ変更
        ballTop > paddleTop &&
        ballTop < paddleBottom &&
        ballCenter > paddleLeft &&
        ballCenter < paddleRight
      ) {
        // 上記のパドルの条件が揃えば、ボールの跳躍とボールの方向を指定。ゲームのスコアも追加。
        ball.bounce();
        // paddleBottomにreposition
        ball.repositionBottom(paddleBottom);
        this.game.addScore();
      }
      
      // キャンバスの相対的な位置をrectに追加。
      const rect = this.canvas.getBoundingClientRect();
      // x座標を指定。マウス位置から長方形の左分を除いて、横幅の半分を除いたもの。
      this.x = this.mouseX - rect.left - (this.w / 2);

      // 壁の中でpaddleが動くようにする設定
      if (this.x < 0) {
        this.x = 0;
      }
      if (this.x + this.w > this.canvas.width) {
        this.x = this.canvas.width - this.w;
      }
    }

    // paddleをcanvas内に描画
    draw() {
      this.ctx.fillStyle = '#fdfdfd';
      this.ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }
  
  // ゲーム全体の設定
  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      // キャンバスのコンテキスト設定
      this.ctx = this.canvas.getContext('2d');
      // ボールクラスの読み込み
      this.ball = new Ball(this.canvas);
      // Paddleクラスの読み込み キャンバスとゲームクラスが引数
      this.paddle1 = new Paddle1(this.canvas, this);
      this.paddle2 = new Paddle2(this.canvas, this);
      // ゲームループの実行
      this.loop();
      // ゲームオーバーフラグの初期値をfalseに設定
      this.isGameOver = false;
      // 最初はスコアゼロ
      this.score = 0;
    }

    // スコア追加のメソッド
    addScore() {
      this.score++;
    }

    // ゲームループ
    loop() {
      if (this.isGameOver) {
        return;
      }

      // updateとdrawを実行し続ける
      this.update();
      this.draw();

      // AnimationFrameの連続実行
      requestAnimationFrame(() => {
        this.loop();
      });
    }

    // ゲーム全体updateを実行
    update() {
      // ボールクラスのアップデートの実行
      this.ball.update();
      // paddleクラスのアップデートを実行。引数にballを取る
      this.paddle1.update(this.ball);
      this.paddle2.update(this.ball);

      // ボールクラスのgetmissedstatus関数にヒットしたらGameOver
      if (this.ball.getMissedStatus()) {
        this.isGameOver = true;
      }
    }

    // 全体のdrawを実行
    draw() {
      if (this.isGameOver) {
        // ゲームオーバーになったら描画をやめる
        this.drawGameOver();
        return;
      }

      // clearrectで範囲四角内のcanvasをリセットする。
      // update前に毎回画面を消すイメージ
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ball.draw();
      this.paddle1.draw();
      this.paddle2.draw();
      this.drawScore();
    }

    // ゲームオーバーの時の処理
    drawGameOver() {
      this.ctx.font = '28px "Arial Black"';
      this.ctx.fillStyle = 'tomato';
      this.ctx.fillText('GAME OVER', 100, 200);
    }

    // スコア設定
    drawScore() {
      this.ctx.font = '20px Arial';
      this.ctx.fillStyle = '#fdfdfd';
      this.ctx.fillText(this.score, 10, 25);
    }
  }
  
  // ゲームを開始
  const canvas = document.querySelector('canvas');
  if (typeof canvas.getContext === 'undefined') {
    return;
  }
  
  new Game(canvas);
})();