'use strict';
    // ログイン情報から名前を取得
    const storage = localStorage;
    let username;
    if(!storage.getItem("yourname")){
        let h = '<p>';
            h += "ゲームに参加するにはログインが必要です";
            h += '</p>';
        $("#user").append( h );
    }
    else{
        username = storage.getItem("yourname");
        console.log(username);
        let h = '<p>';
            h += "名前: ";
            h += username;
            h += '</p>';
        $("#user").append( h );
    }

    // Import the functions you need from the SDKs you need
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
    import { getDatabase, ref, get, push, set, onChildAdded, remove, onChildRemoved } 
    from "https://www.gstatic.com/firebasejs/9.8.1/firebase-database.js";
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries
  
    // Your web app's Firebase configuration
    const firebaseConfig = {
      apiKey: "AIzaSyA9GSrJJ414kGHQ4ASeF_4-8Rq-oDf7myU",
      authDomain: "gsdemo-af3d2.firebaseapp.com",
      projectId: "gsdemo-af3d2",
      storageBucket: "gsdemo-af3d2.appspot.com",
      messagingSenderId: "302898596657",
      appId: "1:302898596657:web:f446619431f2322d34be10"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const firstPlayerRef = ref(db, "pongfirst");
    const secondPlayerRef = ref(db, "pongsecond");
    const ballxRef = ref(db, "ballx");
    const ballyRef = ref(db, "bally");

// 即時関数
(() => {
  // ランダムを作成する関数を準備
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  //Ballクラス
  class Ball {
    constructor(canvas, game) {
      this.canvas = canvas;
      this.game = game;
      this.ctx = this.canvas.getContext('2d');
      // ボールのx座標をランダム生成
      this.x = rand(30, 250);
      // ボールのスタートy座標は固定
      this.y = 200;
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
        // this.isMissed = true;
        this.vy *= -1;
        this.game.addScoreTwo();
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
        this.vy *= -1;
        this.game.addScoreOne();
        // this.isMissed = true;
      }

      // ボールの場所をはplayer1に合わせる。firebaseに設定
      if (username == "player1") {
        set(ballxRef, this.x);
        set(ballyRef, this.y);
      }
    }

    draw() {
      // ボールのx座標を取得
      if (username == "player2") {
        get(ballxRef).then((snapshot) => {
          if (snapshot.val()) {
              // console.log(snapshot.val());
              this.x = snapshot.val();
          } else {
              console.log("No bot message available");
          }
          }).catch((error) => {
          console.error(error);
        });
        //ボールのy座標を取得
        get(ballyRef).then((snapshot) => {
          if (snapshot.val()) {
              // console.log(snapshot.val());
              this.y = snapshot.val();
          } else {
              console.log("No bot message available");
          }
          }).catch((error) => {
          console.error(error);
        });
      }
      this.ctx.beginPath();
      this.ctx.fillStyle = '#fdfdfd';
      // arcで円を描画 Math.PIは円周率
      this.ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  // Paddle1 クラス(プレイヤー1手前側)
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
      if (username == "player1"){
        document.addEventListener('mousemove', e => {
          this.mouseX = e.clientX;
        });
      }
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
        // this.game.addScore();
      }
      
      //プレイヤー1でない場合は、x軸はfirebaseから送信される値で決まる。
      if (username != "player1"){
        get(firstPlayerRef).then((snapshot) => {
          if (snapshot.val()) {
              // console.log(snapshot.val());
              this.mouseX = snapshot.val();
              this.mouseX += rect.left
              this.mouseX += this.w / 2
          } else {
              // console.log("No bot message available");
          }
          }).catch((error) => {
          console.error(error);
        });
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

      // Firebaseへのデータsetのテスト
      if (username == "player1"){
        set(firstPlayerRef, this.x);
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
      if (username == "player2"){
        document.addEventListener('mousemove', e => {
          this.mouseX = e.clientX;
        });
      }
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
        // this.game.addScore();
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

      //プレイヤー2でない場合は、x軸はfirebaseから送信される値で決まる。
      if (username != "player2"){
        get(secondPlayerRef).then((snapshot) => {
          if (snapshot.val()) {
              // console.log(snapshot.val());
              this.mouseX = snapshot.val();
              this.mouseX += rect.left
              this.mouseX += this.w / 2
          } else {
              // console.log("No bot message available");
          }
          }).catch((error) => {
          console.error(error);
        });
      }

      // Firebaseへのデータsetのテスト
      if (username == "player2"){
        set(secondPlayerRef, this.x);
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
      this.ball = new Ball(this.canvas, this);
      // Paddleクラスの読み込み キャンバスとゲームクラスが引数
      this.paddle1 = new Paddle1(this.canvas, this);
      this.paddle2 = new Paddle2(this.canvas, this);
      // ゲームループの実行
      this.loop();
      // ゲームオーバーフラグの初期値をfalseに設定
      this.isGameOver = false;
      // 最初はスコアゼロ
      this.scoreone = 0;
      this.scoretwo = 0;
    }

    // スコア追加のメソッド
    addScoreOne() {
      this.scoreone++;
    }

    addScoreTwo() {
      this.scoretwo++;
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
      this.ctx.fillText("Player1: " + this.scoreone, 30, 350);
      this.ctx.fillText("Player2: " + this.scoretwo, 280, 60);
    }
  }
  
  // ゲームを開始
  const canvas = document.querySelector('canvas');
  if (typeof canvas.getContext === 'undefined') {
    return;
  }
  
  new Game(canvas);
})();