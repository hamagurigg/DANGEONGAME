// JavaScript source code
"use strict";

let scroller = new Scroller(); // スクロール管理オブジェクト
Player1.prototype = scroller; // scrollerをPlayerのprototypeに設定
Player2.prototype = scroller; // scrollerをPlayerのprototypeに設定
Player3.prototype = scroller; // scrollerをPlayerのprototypeに設定

const W = 31; // 迷路の幅
const H = 31; // 迷路の高さ[]
const goalX = W - 2;
const goalY = H - 2;
const GAMECLEAR = 1; // ゲームクリア状態
const maze = []; // 迷路
const player1 = new Player1(1, 1); // 主人公1
const player2 = new Player2(1, 1); // 主人公2
const player3 = new Player3(1, 1); // 主人公3

let ctx; // 描画用コンテキスト
let keyCode = 0; // 押下されたキー
let statuss = 0; // ゲームの状態
let timer = NaN; // タイマー
let rewardGoal2 = 100; //エージェント２の報酬初期値
let rewardNewPosition2 = 100; //エージェント２の報酬初期値
let alpha3 = 0.6;
let gamma3 = 0.99;
let penaltyWall3 = -20;
let rewardCloser3 = 5;
let rewardNewPosition3 = 10;
let rewardGoal3 = 50;

// スクロール処理オブジェクト
function Scroller() {
    // 移動先(dx,dy)が設定された場合にスクロール
    this.doScroll = function () {
        if (this.dx == 0 && this.dy == 0) {
            return; // 移動先dx,dyが0のときは何もしない
        }

        if (++this.scrollCount >= 5) {
            this.x = this.x + this.dx; // x座標更新
            this.y = this.y + this.dy; // y座標更新
            this.dx = 0; // 移動先とカウンタをリセット
            this.dy = 0;
            this.scrollCount = 0;
        }
    };

    // 現在のx座標を返す
    this.getScrollX = function () {
        return this.x * 50 + this.dx * this.scrollCount * 10; // 移動中スクロール量を含むx座標(50は50px,1マスが50pxだから)
    };

    // 現在のy座標を返す
    this.getScrollY = function () {
        return this.y * 50 + this.dy * this.scrollCount * 10; // 移動中スクロール量を含むy座標(scrollCountの10は動きの滑らかさ)
    };
}

// ユークリッド距離を計算する関数
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

// 主人公1オブジェクトコンストラクタ
function Player1(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.dir = 0;
    this.scrollCount = 0;
    this.path = []; // 軌跡を保存する配列
    this.stepCount = 0; // ステップ数

    this.update1 = function () {
        // ここで `this` を変数にキャプチャします
        let self = this;

        this.doScroll();  // スクロール処理の実行

        if (this.scrollCount > 0) {
            return;  // スクロール中の場合、ここで処理を終了
        }

        // ゲームクリアのチェック
        if (this.x == W - 2 && this.y == H - 2) {
            clearInterval(timer);  // タイマーのクリア
            statuss = GAMECLEAR;  // ゲームクリアの状態に設定
            document.getElementById("bgm").pause();  // バックグラウンドミュージックの一時停止
            repaint1();  // 画面の再描画
        }

        this.dx = 0;  // X軸の変化量をゼロに設定
        this.dy = 0;  // Y軸の変化量をゼロに設定

        this.path.push({ x: this.x, y: this.y }); // 移動後の位置を軌跡に追加

        this.stepCount++; // ステップ数をカウント

        // `updatePlayerMovement` 関数を定義します
        function updatePlayerMovement1() {
            let direction = Math.floor(Math.random() * 10);
            let threshold = parseInt(document.getElementById('directionThreshold').value);

            if (direction < threshold) {
                self.dy = 1;
                self.dir = 1;
            } else {
                direction = Math.floor(Math.random() * 3);
                switch (direction) {
                    case 0:
                        self.dy = -1;
                        self.dir = 0;
                        break;
                    case 1:
                        self.dx = -1;
                        self.dir = 2;
                        break;
                    case 2:
                        self.dx = 1;
                        self.dir = 3;
                        break;
                }
            }
        }

        // この `updatePlayerMovement` 関数を使用する箇所
        updatePlayerMovement1();

        // 迷路の範囲外には移動できない
        if (this.x + this.dx < 0 || this.x + this.dx >= W || this.y + this.dy < 0 || this.y + this.dy >= H) {
            return;
        }

        if (maze[this.y + this.dy][this.x + this.dx] == 0) {
            this.x += this.dx;
            this.y += this.dy;
        }
    };

    this.doScroll = function () {
        // スクロール処理
        // ...
    };


    this.paint1 = function (gc, x, y, w, h) {　//paint関数は主人公の画像を描画するための関数である
        let img = document.getElementById("alien" + this.dir); //向きに応じた画像の取得
        gc.drawImage(img, x, y, w, h); // 主人公描画
    };
}

function random(v) {
    return Math.floor(Math.random() * v); // 0 から vまでの乱数を整数で返す
}

// 主人公2オブジェクトコンストラクタ
function Player2(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.dir = 0;
    this.scrollCount = 0;
    this.exploredPositions2 = {}; // 探索済み位置を記録するオブジェクト
    this.totalReward = 0; // 総報酬
    this.stepCount = 0; // ステップ数
    this.path = []; // 軌跡を保存する配列

    this.update2 = function () {
        this.doScroll();
        if (this.scrollCount > 0) {
            return;
        }

        if (this.x === W - 2 && this.y === H - 2) {
            clearInterval(timer);
            statuss = GAMECLEAR;
            document.getElementById("bgm").pause();
            repaint2();
            this.giveReward2(100); // ゴールへの到達に対して高い報酬を与える
            return;
        }

        this.dx = 0;
        this.dy = 0;

        this.path.push({ x: this.x, y: this.y }); // 移動後の位置を軌跡に追加

        this.stepCount++;

        let bestAction2 = this.getBestAction2(); // 最適な行動を取得

        switch (bestAction2) {
            case 0:
                this.dy = -1;
                this.dir = 0;
                break;
            case 1:
                this.dy = 1;
                this.dir = 1;
                break;
            case 2:
                this.dx = -1;
                this.dir = 2;
                break;
            case 3:
                this.dx = 1;
                this.dir = 3;
                break;
        }

        // 迷路の範囲外には移動できない
        if (this.x + this.dx < 0 || this.x + this.dx >= W || this.y + this.dy < 0 || this.y + this.dy >= H) {
            return;
        }

        if (maze[this.y + this.dy][this.x + this.dx] === 0) {
            this.x += this.dx;
            this.y += this.dy;

            const positionKey2 = `${this.x}-${this.y}`;
            if (!(positionKey2 in this.exploredPositions2)) {
                this.exploredPositions2[positionKey2] = true;
                this.giveReward2(10); // 新しい位置に到達した場合に報酬を与える
            }
        }

        this.stepCount++; // ステップ数をカウント

        // ステータスを表示する関数を呼び出す
        displayStats2();
    };

    this.doScroll = function () {
        // スクロール処理
        // ...
    };

    this.getBestAction2 = function () {
        const numSimulations = 2000; // プレイアウト回数
        const scores = [0, 0, 0, 0]; // 各行動のスコアを記録する配列
        const explorationFactor = 0.5; // 探索度合いの調整係数

        for (let i = 0; i < numSimulations; i++) {
            const actions2 = [0, 1, 2, 3]; // 行動の候補


            // ランダムな行動を選択
            const randomActionIndex = Math.floor(Math.random() * actions2.length);
            const randomAction = actions2[randomActionIndex];

            // 仮想的に行動を実行し、結果を評価する

            const result = simulateAction(randomAction);
            scores[randomAction] += result;
        }

        // スコアの最大値を持つ行動を最適な行動とする
        const bestActionIndex = scores.indexOf(Math.max(...scores));
        return bestActionIndex;
    };



    this.paint2 = function (gc, x, y, w, h) {
        // paint関数は主人公の画像を描画するための関数である
        let img = document.getElementById("hero" + this.dir); // 向きに応じた画像の取得
        gc.drawImage(img, x, y, w, h); // 主人公描画
    };
}

function simulateAction(action2) {
    // プレイヤーの位置と行動を一時的に変更する
    const originalX = player2.x;
    const originalY = player2.y;
    let reward2 = 0;

    // 行動に基づいてプレイヤーの位置を更新する
    switch (action2) {
        case 0: // 上に移動
            if (player2.y - 1 >= 0 && maze[player2.y - 1][player2.x] === 0) {
                player2.y--;
            }
            break;
        case 1: // 下に移動
            if (player2.y + 1 < H && maze[player2.y + 1][player2.x] === 0) {
                player2.y++;
            }
            break;
        case 2: // 左に移動
            if (player2.x - 1 >= 0 && maze[player2.y][player2.x - 1] === 0) {
                player2.x--;
            }
            break;
        case 3: // 右に移動
            if (player2.x + 1 < W && maze[player2.y][player2.x + 1] === 0) {
                player2.x++;
            }
            break;
    }

    // ゴールに到達した場合の報酬
    if (player2.x === W - 2 && player2.y === H - 2) {
        reward2 += rewardGoal2;
    }

    // 新しい位置に到達した場合の報酬
    const newPositionKey2 = `${player2.x}-${player2.y}`;
    if (!(newPositionKey2 in player2.exploredPositions2)) {
        player2.exploredPositions2[newPositionKey2] = true;
        reward2 += rewardNewPosition2;
    }

    // ステップ数の報酬（ステップ数を最小化することを促す）
    reward2 -= 1;

    // 元の位置にプレイヤーを戻す
    player2.x = originalX;
    player2.y = originalY;

    return reward2;
}

this.giveReward2 = function (reward2) {
    // 報酬を加算する
    this.totalReward += reward2;
};

// 主人公オブジェクトコンストラクタ3
function Player3(x, y) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.dir = 0;
    this.scrollCount = 0;
    this.exploredPositions = {}; // 探索済み位置を記録するオブジェクト
    this.totalReward = 0; // 総報酬
    this.stepCount = 0; // ステップ数
    this.path = []; // 軌跡を保存する配列

    // DQN関連のパラメータ
    this.epsilon = 1.0; // ε-グリーディの初期値
    this.epsilonDecay = 0.995; // εの減少率
    this.epsilonMin = 0.01; // εの最小値
    this.gamma = 0.95; // 割引率
    this.learningRate = 0.001; // 学習率
    this.memory = []; // 経験を保存するリプレイバッファ
    this.batchSize = 32; // ミニバッチサイズ
    this.targetUpdate = 100; // ターゲットモデルの更新頻度
    this.model = this.buildModel(); // DQNモデル
    this.targetModel = this.buildModel(); // ターゲットモデル
    this.updateTargetModel(); // ターゲットモデルを初期化

    this.update3 = async function () {
        this.doScroll();
        if (this.scrollCount > 0) {
            return;
        }

        if (this.x === W - 2 && this.y === H - 2) {
            clearInterval(timer);
            statuss = GAMECLEAR;
            document.getElementById("bgm").pause();
            repaint3();
            return;
        }

        this.dx = 0;
        this.dy = 0;

        let bestAction3 = await this.getBestAction3(); // 最適な行動を取得
        this.performAction3(bestAction3);

        // ここで報酬を計算し、ログ出力
        let reward3 = performActionAndGetReward3(this, bestAction3);
        console.log(`Action3: ${bestAction3}, Reward: ${reward3}`);

        this.stepCount++;

        // εの減少
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }

        // 経験をリプレイして学習
        if (this.memory.length >= this.batchSize) {
            await this.replay();
        }

        // ターゲットモデルの更新
        if (this.stepCount % this.targetUpdate === 0) {
            this.updateTargetModel();
        }

        // ステータスを表示する関数を呼び出す
        displayStats3();
    };

    this.performAction3 = function (bestAction3) {
        // 移動前の状態を保存
        const originalState3 = { x: this.x, y: this.y };

        // 移動方向を設定し、有効な場合に位置を更新
        this.setMovementDirection(bestAction3);
        if (this.isPlayerMoveValid()) {
            this.updatePosition3();
            this.path.push({ x: this.x, y: this.y }); // 移動後の位置を軌跡に追加
        }

        // 移動後の状態を取得
        const newState3 = { x: this.x, y: this.y };

        // 報酬の計算
        let reward3 = performActionAndGetReward3(this, bestAction3);

        // メモリに経験を保存
        this.memory.push([originalState3, bestAction3, reward3, newState3]);
    };

    this.setMovementDirection = function (action3) {
        switch (action3) {
            case 0: // 上に移動
                this.dy = -1;
                this.dir = 0;
                break;
            case 1: // 下に移動
                this.dy = 1;
                this.dir = 1;
                break;
            case 2: // 左に移動
                this.dx = -1;
                this.dir = 2;
                break;
            case 3: // 右に移動
                this.dx = 1;
                this.dir = 3;
                break;
        }
    };

    this.updatePosition3 = function () {
        this.x += this.dx;
        this.y += this.dy;
        this.dx = 0; // 移動先のdx, dyをリセット
        this.dy = 0;
    };

    this.isPlayerMoveValid = function () {
        return (
            this.x + this.dx >= 0 &&
            this.x + this.dx < W &&
            this.y + this.dy >= 0 &&
            this.y + this.dy < H &&
            maze[this.y + this.dy][this.x + this.dx] === 0
        );
    };

    this.getBestAction3 = async function () {
        const currentState = { x: this.x, y: this.y };

        // εの確率でランダムな行動を選択
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * 4);
        }

        // 現在の状態のQ値を取得
        const qValues = await this.model.predict(tf.tensor2d([Object.values(currentState)])).data();
        return qValues.indexOf(Math.max(...qValues));
    };

    this.buildModel = function () {
        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 24, inputShape: [2], activation: 'relu' }));
        model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 4, activation: 'linear' }));
        model.compile({ optimizer: tf.train.adam(this.learningRate), loss: 'mse' });
        return model;
    };

    this.updateTargetModel = function () {
        this.targetModel.setWeights(this.model.getWeights());
    };

    this.replay = async function () {
        const minibatch = this.memory.slice(-this.batchSize);
        for (let i = 0; i < minibatch.length; i++) {
            const [state, action, reward, nextState] = minibatch[i];

            // 現在のQ値
            let qUpdate = reward;
            if (!(nextState.x === W - 2 && nextState.y === H - 2)) {
                const qValuesNext = await this.targetModel.predict(tf.tensor2d([Object.values(nextState)])).data();
                qUpdate += this.gamma * Math.max(...qValuesNext);
            }

            // 更新後のQ値
            const qValues = await this.model.predict(tf.tensor2d([Object.values(state)])).array();
            qValues[0][action] = qUpdate;

            // モデルの更新
            await this.model.fit(tf.tensor2d([Object.values(state)]), tf.tensor2d([qValues[0]]), { epochs: 1, verbose: 0 });
        }
    };

    this.giveReward = function (reward3) {
        // 報酬を加算する
        this.totalReward += reward3;
    };

    this.paint3 = function (gc, x, y, w, h) {
        // paint関数は主人公の画像を描画するための関数である
        let img = document.getElementById("yusya" + this.dir); // 向きに応じた画像の取得
        gc.drawImage(img, x, y, w, h); // 主人公描画
    };
}

function init1() {　//ゲーム1の初期化を行う関数
    let maze = document.getElementById("maze");
    ctx = maze.getContext("2d"); // 描画コンテキスト　
    ctx.font = "bold 48px sans-serif"; //ゲームオーバーなどの後で描画されるテキストがこのフォントスタイルで描画される

    createMaze(W, H); // 迷路作成
    repaint1();
    // ステップ数を初期化して表示
    const statsElement = document.getElementById("stats");
    statsElement.innerHTML = `<h3>Stats:</h3><p>Steps: 0</p>`;
}

function init2() {　//ゲーム2の初期化を行う関数
    let maze = document.getElementById("maze");
    ctx = maze.getContext("2d"); // 描画コンテキスト　
    ctx.font = "bold 48px sans-serif"; //ゲームオーバーなどの後で描画されるテキストがこのフォントスタイルで描画される

    createMaze(W, H); // 迷路作成
    repaint2();
    // ステップ数を初期化して表示
    const statsElement = document.getElementById("stats");
    statsElement.innerHTML = `<h3>Stats:</h3><p>Steps: 0</p>`;
}

function init3() {　//ゲーム3の初期化を行う関数
    let maze = document.getElementById("maze");
    ctx = maze.getContext("2d"); // 描画コンテキスト
    ctx.font = "bold 48px sans-serif"; // ゲームオーバーなどの後で描画されるテキストがこのフォントスタイルで描画される
    updateParameters3();
    createMaze(W, H); // 迷路作成
    repaint3();

    // エピソード数とステップ数を初期化
    episodeCount = 0; // エピソード数をリセット
    player3.stepCount = 0; // ステップ数をリセット

    // ステータスを表示する要素を更新
    const statsElement = document.getElementById("stats");
    statsElement.innerHTML = `<h3>Stats:</h3><p>Steps: ${player3.stepCount}</p><p>Episodes: ${episodeCount}</p>`;
}

// 棒倒し法：幅:w、高さ:hの迷路生成
function createMaze(w, h) {
    for (let y = 0; y < h; y++) {
        maze[y] = [];
        for (let x = 0; x < w; x++) {
            // 周囲は壁(1)、それ以外は通路(0)で初期化
            maze[y][x] = x == 0 || x == w - 1 || y == 0 || y == h - 1 ? 1 : 0;
        }
    }

    // ここから壁の配置
    // 任意の場所に壁を設置するには、対応するセルの値を1に変更します
    maze[1][2] = 1; // (2, 2)のセルに壁を設置
    maze[1][4] = 1; // (4, 6)のセルに壁を設置
    maze[1][12] = 1;
    maze[1][24] = 1;
    maze[2][2] = 1;
    maze[2][4] = 1;
    maze[2][6] = 1;
    maze[2][7] = 1;
    maze[2][8] = 1;
    maze[2][10] = 1;
    maze[2][12] = 1;
    maze[2][14] = 1;
    maze[2][15] = 1;
    maze[2][16] = 1;
    maze[2][17] = 1;
    maze[2][18] = 1;
    maze[2][20] = 1;
    maze[2][22] = 1;
    maze[2][24] = 1;
    maze[2][26] = 1;
    maze[2][27] = 1;
    maze[2][28] = 1;
    maze[3][8] = 1;
    maze[3][10] = 1;
    maze[3][20] = 1;
    maze[3][22] = 1;
    maze[3][26] = 1;
    maze[4][1] = 1;
    maze[4][2] = 1;
    maze[4][3] = 1;
    maze[4][4] = 1;
    maze[4][6] = 1;
    maze[4][7] = 1;
    maze[4][8] = 1;
    maze[4][10] = 1;
    maze[4][11] = 1;
    maze[4][12] = 1;
    maze[4][13] = 1;
    maze[4][14] = 1;
    maze[4][15] = 1;
    maze[4][16] = 1;
    maze[4][17] = 1;
    maze[4][18] = 1;
    maze[4][20] = 1;
    maze[4][22] = 1;
    maze[4][23] = 1;
    maze[4][24] = 1;
    maze[4][25] = 1;
    maze[4][26] = 1;
    maze[4][28] = 1;
    maze[4][29] = 1;
    maze[5][8] = 1;
    maze[5][16] = 1;
    maze[5][24] = 1;
    maze[6][2] = 1;
    maze[6][3] = 1;
    maze[6][4] = 1;
    maze[6][5] = 1;
    maze[6][6] = 1;
    maze[6][7] = 1;
    maze[6][8] = 1;
    maze[6][10] = 1;
    maze[6][11] = 1;
    maze[6][12] = 1;
    maze[6][14] = 1;
    maze[6][16] = 1;
    maze[6][17] = 1;
    maze[6][18] = 1;
    maze[6][20] = 1;
    maze[6][22] = 1;
    maze[6][23] = 1;
    maze[6][24] = 1;
    maze[6][25] = 1;
    maze[6][26] = 1;
    maze[6][28] = 1;
    maze[6][29] = 1;
    maze[7][6] = 1;
    maze[7][14] = 1;
    maze[7][20] = 1;
    maze[7][26] = 1;
    maze[8][2] = 1;
    maze[8][3] = 1;
    maze[8][4] = 1;
    maze[8][5] = 1;
    maze[8][6] = 1;
    maze[8][8] = 1;
    maze[8][9] = 1;
    maze[8][10] = 1;
    maze[8][12] = 1;
    maze[8][14] = 1;
    maze[8][16] = 1;
    maze[8][18] = 1;
    maze[8][20] = 1;
    maze[8][21] = 1;
    maze[8][22] = 1;
    maze[8][23] = 1;
    maze[8][24] = 1;
    maze[8][25] = 1;
    maze[8][26] = 1;
    maze[8][27] = 1;
    maze[8][28] = 1;
    maze[9][6] = 1;
    maze[9][10] = 1;
    maze[9][12] = 1;
    maze[9][14] = 1;
    maze[9][16] = 1;
    maze[9][18] = 1;
    maze[10][2] = 1;
    maze[10][3] = 1;
    maze[10][4] = 1;
    maze[10][5] = 1;
    maze[10][6] = 1;
    maze[10][8] = 1;
    maze[10][10] = 1;
    maze[10][11] = 1;
    maze[10][12] = 1;
    maze[10][14] = 1;
    maze[10][15] = 1;
    maze[10][16] = 1;
    maze[10][17] = 1;
    maze[10][18] = 1;
    maze[10][20] = 1;
    maze[10][22] = 1;
    maze[10][24] = 1;
    maze[10][25] = 1;
    maze[10][26] = 1;
    maze[10][27] = 1;
    maze[10][28] = 1;
    maze[11][2] = 1;
    maze[11][8] = 1;
    maze[11][10] = 1;
    maze[11][18] = 1;
    maze[11][20] = 1;
    maze[11][22] = 1;
    maze[12][1] = 1;
    maze[12][2] = 1;
    maze[12][4] = 1;
    maze[12][5] = 1;
    maze[12][6] = 1;
    maze[12][8] = 1;
    maze[12][9] = 1;
    maze[12][10] = 1;
    maze[12][12] = 1;
    maze[12][13] = 1;
    maze[12][14] = 1;
    maze[12][16] = 1;
    maze[12][17] = 1;
    maze[12][18] = 1;
    maze[12][19] = 1;
    maze[12][20] = 1;
    maze[12][21] = 1;
    maze[12][22] = 1;
    maze[12][23] = 1;
    maze[12][24] = 1;
    maze[12][26] = 1;
    maze[12][27] = 1;
    maze[12][28] = 1;
    maze[13][6] = 1;
    maze[13][8] = 1;
    maze[13][14] = 1;
    maze[13][18] = 1;
    maze[14][2] = 1;
    maze[14][4] = 1;
    maze[14][5] = 1;
    maze[14][6] = 1;
    maze[14][7] = 1;
    maze[14][8] = 1;
    maze[14][9] = 1;
    maze[14][10] = 1;
    maze[14][11] = 1;
    maze[14][12] = 1;
    maze[14][14] = 1;
    maze[14][15] = 1;
    maze[14][16] = 1;
    maze[14][18] = 1;
    maze[14][20] = 1;
    maze[14][21] = 1;
    maze[14][22] = 1;
    maze[14][24] = 1;
    maze[14][26] = 1;
    maze[14][28] = 1;
    maze[14][29] = 1;
    maze[15][2] = 1;
    maze[15][16] = 1;
    maze[15][18] = 1;
    maze[15][20] = 1;
    maze[15][24] = 1;
    maze[15][26] = 1;
    maze[16][1] = 1;
    maze[16][2] = 1;
    maze[16][4] = 1;
    maze[16][5] = 1;
    maze[16][6] = 1;
    maze[16][8] = 1;
    maze[16][10] = 1;
    maze[16][11] = 1;
    maze[16][12] = 1;
    maze[16][14] = 1;
    maze[16][15] = 1;
    maze[16][16] = 1;
    maze[16][17] = 1;
    maze[16][18] = 1;
    maze[16][20] = 1;
    maze[16][21] = 1;
    maze[16][22] = 1;
    maze[16][24] = 1;
    maze[16][25] = 1;
    maze[16][26] = 1;
    maze[16][27] = 1;
    maze[16][28] = 1;
    maze[16][29] = 1;
    maze[17][6] = 1;
    maze[17][8] = 1;
    maze[17][14] = 1;
    maze[17][22] = 1;
    maze[18][2] = 1;
    maze[18][3] = 1;
    maze[18][4] = 1;
    maze[18][6] = 1;
    maze[18][7] = 1;
    maze[18][8] = 1;
    maze[18][10] = 1;
    maze[18][11] = 1;
    maze[18][12] = 1;
    maze[18][14] = 1;
    maze[18][15] = 1;
    maze[18][16] = 1;
    maze[18][17] = 1;
    maze[18][18] = 1;
    maze[18][19] = 1;
    maze[18][20] = 1;
    maze[18][22] = 1;
    maze[18][24] = 1;
    maze[18][25] = 1;
    maze[18][26] = 1;
    maze[18][28] = 1;
    maze[19][8] = 1;
    maze[19][12] = 1;
    maze[19][24] = 1;
    maze[19][28] = 1;
    maze[20][1] = 1;
    maze[20][2] = 1;
    maze[20][4] = 1;
    maze[20][6] = 1;
    maze[20][7] = 1;
    maze[20][8] = 1;
    maze[20][10] = 1;
    maze[20][12] = 1;
    maze[20][13] = 1;
    maze[20][14] = 1;
    maze[20][15] = 1;
    maze[20][16] = 1;
    maze[20][18] = 1;
    maze[20][20] = 1;
    maze[20][21] = 1;
    maze[20][22] = 1;
    maze[20][23] = 1;
    maze[20][24] = 1;
    maze[20][26] = 1;
    maze[20][27] = 1;
    maze[20][28] = 1;
    maze[21][4] = 1;
    maze[21][6] = 1;
    maze[21][10] = 1;
    maze[21][18] = 1;
    maze[21][28] = 1;
    maze[22][1] = 1;
    maze[22][2] = 1;
    maze[22][4] = 1;
    maze[22][5] = 1;
    maze[22][6] = 1;
    maze[22][7] = 1;
    maze[22][8] = 1;
    maze[22][10] = 1;
    maze[22][12] = 1;
    maze[22][14] = 1;
    maze[22][15] = 1;
    maze[22][16] = 1;
    maze[22][17] = 1;
    maze[22][18] = 1;
    maze[22][19] = 1;
    maze[22][20] = 1;
    maze[22][22] = 1;
    maze[22][24] = 1;
    maze[22][25] = 1;
    maze[22][26] = 1;
    maze[22][28] = 1;
    maze[23][8] = 1;
    maze[23][10] = 1;
    maze[23][12] = 1;
    maze[23][18] = 1;
    maze[23][22] = 1;
    maze[23][26] = 1;
    maze[23][28] = 1;
    maze[24][2] = 1;
    maze[24][3] = 1;
    maze[24][4] = 1;
    maze[24][5] = 1;
    maze[24][6] = 1;
    maze[24][8] = 1;
    maze[24][9] = 1;
    maze[24][10] = 1;
    maze[24][11] = 1;
    maze[24][12] = 1;
    maze[24][13] = 1;
    maze[24][14] = 1;
    maze[24][16] = 1;
    maze[24][18] = 1;
    maze[24][19] = 1;
    maze[24][20] = 1;
    maze[24][22] = 1;
    maze[24][24] = 1;
    maze[24][25] = 1;
    maze[24][26] = 1;
    maze[24][27] = 1;
    maze[24][28] = 1;
    maze[25][4] = 1;
    maze[25][8] = 1;
    maze[25][16] = 1;
    maze[25][20] = 1;
    maze[25][22] = 1;
    maze[25][24] = 1;
    maze[26][2] = 1;
    maze[26][4] = 1;
    maze[26][5] = 1;
    maze[26][6] = 1;
    maze[26][7] = 1;
    maze[26][8] = 1;
    maze[26][10] = 1;
    maze[26][11] = 1;
    maze[26][12] = 1;
    maze[26][13] = 1;
    maze[26][14] = 1;
    maze[26][15] = 1;
    maze[26][16] = 1;
    maze[26][18] = 1;
    maze[26][19] = 1;
    maze[26][20] = 1;
    maze[26][21] = 1;
    maze[26][22] = 1;
    maze[26][23] = 1;
    maze[26][24] = 1;
    maze[26][26] = 1;
    maze[26][27] = 1;
    maze[26][28] = 1;
    maze[26][29] = 1;
    maze[27][2] = 1;
    maze[27][4] = 1;
    maze[27][24] = 1;
    maze[28][2] = 1;
    maze[28][3] = 1;
    maze[28][4] = 1;
    maze[28][6] = 1;
    maze[28][7] = 1;
    maze[28][8] = 1;
    maze[28][10] = 1;
    maze[28][11] = 1;
    maze[28][12] = 1;
    maze[28][13] = 1;
    maze[28][14] = 1;
    maze[28][16] = 1;
    maze[28][17] = 1;
    maze[28][18] = 1;
    maze[28][19] = 1;
    maze[28][20] = 1;
    maze[28][21] = 1;
    maze[28][22] = 1;
    maze[28][24] = 1;
    maze[28][26] = 1;
    maze[28][27] = 1;
    maze[28][28] = 1;
    maze[29][8] = 1;

    // 任意の場所にさらに壁を設置する場合は、同様に値を変更します


}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// x, yの場所に半径rの円を色colorで描画
function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);　//円を描画するメソッド
    ctx.fill();
}

// 描画1
function repaint1() {
    // 背景クリア
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 900, 600);　//ctx.fillRectは長方形を描画するメソッド。(x,y,w,h)

    // クリップ領域設定
    ctx.save();
    ctx.beginPath();
    ctx.arc(300, 300, 300, 0, Math.PI * 2);
    ctx.clip();　//クリップ領域外に描画される部分が表示されなくなる

    // 画面中央の迷路描画
    ctx.fillStyle = "brown";
    ctx.translate(6 * 50, 6 * 50);
    ctx.translate(-1 * player1.getScrollX(), -1 * player1.getScrollY());
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            if (maze[y][x] == 1) {
                ctx.fillRect(x * 50, y * 50, 50, 50); // 壁の画像描画
            }
        }
    }
    ctx.restore();

    // 画面右の地図描画
    ctx.fillStyle = "#eeeeee";　//#eeeeeeは濃いグレー色
    ctx.fillRect(650, 0, 250, 600);

    ctx.save();
    ctx.translate(670, 300);
    ctx.fillStyle = "brown";
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            if (maze[y][x] == 1) {
                ctx.fillRect(x * 7, y * 7, 7, 7);　//ctx.fillRectは短形を描画する
            }
        }
    }

    // 軌跡を描画
    ctx.fillStyle = "blue";
    for (let i = 0; i < player1.path.length; i++) {
        ctx.fillRect(player1.path[i].x * 7, player1.path[i].y * 7, 7, 7);
    }

    drawCircle(player1.x * 7 + 3, player1.y * 7 + 3, 3, "red"); // 自分を赤で　drawCircleは先ほど定義した

    ctx.restore();



    // 主人公描画とメッセージ
    player1.paint1(ctx, 300, 300, 50, 50);
    ctx.fillStyle = "yellow";
    if (statuss == GAMECLEAR) {
        ctx.fillText("GAME CLEAR", 150, 200);
    }
}

// 描画2
function repaint2() {
    // 背景クリア
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 900, 600);　//ctx.fillRectは長方形を描画するメソッド。(x,y,w,h)

    // クリップ領域設定
    ctx.save();
    ctx.beginPath();
    ctx.arc(300, 300, 300, 0, Math.PI * 2);
    ctx.clip();　//クリップ領域外に描画される部分が表示されなくなる

    // 画面中央の迷路描画
    ctx.fillStyle = "brown";
    ctx.translate(6 * 50, 6 * 50);
    ctx.translate(-1 * player2.getScrollX(), -1 * player2.getScrollY());
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            if (maze[y][x] == 1) {
                ctx.fillRect(x * 50, y * 50, 50, 50); // 壁の画像描画
            }
        }
    }
    ctx.restore();

    // 画面右の地図描画
    ctx.fillStyle = "#eeeeee";　//#eeeeeeは濃いグレー色
    ctx.fillRect(650, 0, 250, 600);

    ctx.save();
    ctx.translate(670, 300);
    ctx.fillStyle = "brown";
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            if (maze[y][x] == 1) {
                ctx.fillRect(x * 7, y * 7, 7, 7);　//ctx.fillRectは短形を描画する
            }
        }
    }

    // 軌跡を描画
    ctx.fillStyle = "blue";
    for (let i = 0; i < player2.path.length; i++) {
        ctx.fillRect(player2.path[i].x * 7, player2.path[i].y * 7, 7, 7);
    }

    drawCircle(player2.x * 7 + 3, player2.y * 7 + 3, 3, "red"); // 自分を赤で　drawCircleは先ほど定義した

    ctx.restore();



    // 主人公描画とメッセージ
    player2.paint2(ctx, 300, 300, 50, 50);
    ctx.fillStyle = "yellow";
    if (statuss == GAMECLEAR) {
        ctx.fillText("GAME CLEAR", 150, 200);
    }
}

// 描画3
function repaint3() {
    // 背景クリア
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 900, 600);

    // クリップ領域設定
    ctx.save();
    ctx.beginPath();
    ctx.arc(300, 300, 300, 0, Math.PI * 2);
    ctx.clip();

    // 画面中央の迷路描画
    ctx.fillStyle = "brown";
    ctx.translate(6 * 50, 6 * 50);
    ctx.translate(-1 * player3.getScrollX(), -1 * player3.getScrollY());
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            if (maze[y][x] == 1) {
                ctx.fillRect(x * 50, y * 50, 50, 50); // 壁の画像描画
            }
        }
    }
    ctx.restore();

    // 画面右の地図描画
    ctx.fillStyle = "#eeeeee";
    ctx.fillRect(650, 0, 250, 600);

    ctx.save();
    ctx.translate(670, 300);
    ctx.fillStyle = "brown";
    for (let x = 0; x < W; x++) {
        for (let y = 0; y < H; y++) {
            if (maze[y][x] == 1) {
                ctx.fillRect(x * 7, y * 7, 7, 7);
            }
        }
    }

    // 軌跡を描画
    ctx.fillStyle = "blue";
    for (let i = 0; i < player3.path.length; i++) {
        ctx.fillRect(player3.path[i].x * 7, player3.path[i].y * 7, 7, 7);
    }

    drawCircle(player3.x * 7 + 3, player3.y * 7 + 3, 3, "red");
    ctx.restore();

    // 主人公描画とメッセージ
    player3.paint3(ctx, 300, 300, 50, 50);
    ctx.fillStyle = "yellow";
    if (statuss == GAMECLEAR) {
        ctx.fillText("GAME CLEAR", 150, 200);
    }
}

function initMenu() {
    // メニューの初期化ロジックを追加（必要であれば）
    // 例: メニュー画面のタイトルやデザインの設定

    // メニューの要素を表示
    document.getElementById("mainMenu").style.display = "block";
}

function startGame1() {
    init1();
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("gameElements").style.display = "block";
    document.getElementById("gameReturnMenu1").style.display = "block"; // ゲームクリア時のメニューボタンを非表示
    // ここで START1 ボタンを表示
    document.getElementById("START1").style.display = "block";
    document.getElementById("directionThreshold").style.display = "block";
    document.getElementById("button-container1").style.display = "block";
    document.getElementById("agent-explanation1").style.display = "block";
    // 20秒後にメッセージを表示
    setTimeout(function () {
        document.getElementById('message1').style.display = 'block';
    }, 5000); // 5秒
}

function startGame2() {
    init2();
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("gameElements").style.display = "block";
    document.getElementById("gameReturnMenu2").style.display = "block"; // ゲームクリア時のメニューボタンを非表示
    // ここで START2 ボタンを表示
    document.getElementById("START2").style.display = "block";
    document.getElementById("control-panel2").style.display = "block"; // コントロールパネル２を表示
    document.getElementById("button-container2").style.display = "block";
    document.getElementById("agent-explanation2").style.display = "block";
}

function startGame3() {
    init3();
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("gameElements").style.display = "block";
    document.getElementById("gameReturnMenu3").style.display = "block"; // ゲームクリア時のメニューボタンを非表示
    // ここで START3 ボタンを表示
    document.getElementById("START3").style.display = "block";
    document.getElementById("control-panel3").style.display = "block"; // コントロールパネル２を表示
    document.getElementById("q-values").style.display = "block"; // コントロールパネル２を表示
    document.getElementById("button-container3").style.display = "block";
    document.getElementById("agent-explanation3").style.display = "block";
}

function go1() {

    let maze = document.getElementById("maze");

    maze.oncontextmenu = function (e) {
        e.preventDefault();
    };

    timer = setInterval(tick1, 45);
    document.getElementById("bgm").play();

    // "START1" ボタンを表示から非表示に変更
    document.getElementById("START1").style.display = "none";
}

function go2() {

    let maze = document.getElementById("maze");

    maze.oncontextmenu = function (e) {
        e.preventDefault();
    };

    timer = setInterval(tick2, 45);
    document.getElementById("bgm").play();

    // "START2" ボタンを表示から非表示に変更
    document.getElementById("START2").style.display = "none";
}

function go3() {

    let maze = document.getElementById("maze");

    maze.oncontextmenu = function (e) {
        e.preventDefault();
    };

    timer = setInterval(tick3, 0);
    document.getElementById("bgm").play();

    // "START3" ボタンを表示から非表示に変更
    document.getElementById("START3").style.display = "none";
}

// メインルーチン1
function tick1() {
    player1.update1();
    repaint1();
    displayStats1(); // ステップ数の更新を行う



}

// メインルーチン2
function tick2() {
    player2.update2();
    repaint2();
    displayStats2(); // ステップ数の更新を行う


}

// メインルーチン3
function tick3() {
    updateState3();
    player3.update3();
    repaint3();
    displayStats3(); // ステップ数の更新を行う
    displayQValues();


}

//ステップ数を表示する関数
function displayStats1() {
    const statsElement = document.getElementById("stats");
    if (!statsElement) return; // statsElementが存在しない場合は何もしない

    // ステップ数のみを表示
    statsElement.innerHTML = `<h3>Stats:</h3>
                                      <p>Steps: ${player1.stepCount}</p>`;
}

function displayStats2() {
    const statsElement = document.getElementById("stats");
    if (!statsElement) return; // statsElementが存在しない場合は何もしない

    // ステップ数のみを表示
    statsElement.innerHTML = `<h3>Stats:</h3>
                                      <p>Steps: ${player2.stepCount}</p>`;
}

// Q値、ステップ数、エピソード数を表示する関数
function displayStats3() {
    const statsElement = document.getElementById("stats");
    if (!statsElement) return;

    // ステップ数とエピソード数の更新
    statsElement.innerHTML = `<h3>Stats:</h3>
                          <p>Steps: ${player3.stepCount}</p>
                          <p>Episodes: ${episodeCount}</p>`;
}

function displayQValues() {
    const qValuesElement = document.getElementById("q-values");
    if (!qValuesElement) return;

    qValuesElement.innerHTML = '<h4>Q Values:</h4>';
    for (const state in QTable) {
        const p = document.createElement('p');
        p.textContent = `${state}: ${JSON.stringify(QTable[state])}`;
        qValuesElement.appendChild(p);
    }
}

// ゲーム状態をリセットする関数
function resetGame1() {
    clearInterval(timer); // ゲームのタイマーをクリア
    player1.x = 1; // プレイヤーの x 座標をリセット
    player1.y = 1; // プレイヤーの y 座標をリセット
    // 必要な変数やゲーム状態をリセットします
    player1.stepCount = 0; // ステップ数をリセット
    player1.path = []; // 軌跡をリセット
}

// ゲーム状態をリセットする関数
function resetGame2() {
    clearInterval(timer); // ゲームのタイマーをクリア
    player2.x = 1; // プレイヤーの x 座標をリセット
    player2.y = 1; // プレイヤーの y 座標をリセット
    // 必要な変数やゲーム状態をリセットします
    player2.stepCount = 0; // ステップ数をリセット
    player2.path = []; // 軌跡をリセット
}

// ゲーム状態をリセットする関数
function resetGame3() {
    clearInterval(timer); // ゲームのタイマーをクリア
    player3.x = 1; // プレイヤーの x 座標をリセット
    player3.y = 1; // プレイヤーの y 座標をリセット
    // 必要な変数やゲーム状態をリセットします
    player3.stepCount = 0; // ステップ数をリセット
    player3.episodeCount = 0; // ステップ数をリセット
    player3.path = []; // 軌跡をリセット
}

// メインメニューに戻る処理を担当する関数
function returnToMenu1() {
    resetGame1(); // ゲームをリセット
    statuss = 0;
    document.getElementById("bgm").pause();
    repaint1();
    document.getElementById("gameReturnMenu1").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
    document.getElementById("gameElements").style.display = "none";
    document.getElementById("directionThreshold").style.display = "none";
    document.getElementById("START1").style.display = "none";
    document.getElementById("button-container1").style.display = "none";
    document.getElementById("agent-explanation1").style.display = "none";
    document.getElementById("message1").style.display = "none";
}

// メインメニューに戻る処理を担当する関数
function returnToMenu2() {
    resetGame2(); // ゲームをリセット
    statuss = 0;
    document.getElementById("bgm").pause();
    repaint2();
    document.getElementById("gameReturnMenu2").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
    document.getElementById("gameElements").style.display = "none";
    document.getElementById("control-panel2").style.display = "none";
    document.getElementById("START2").style.display = "none";
    document.getElementById("START2").style.display = "none";
    document.getElementById("button-container2").style.display = "none";
    document.getElementById("agent-explanation2").style.display = "none";
    document.getElementById("message1").style.display = "none";


}

// メインメニューに戻る処理を担当する関数
function returnToMenu3() {
    resetGame3(); // ゲームをリセット
    statuss = 0;
    document.getElementById("bgm").pause();
    repaint3();
    document.getElementById("gameReturnMenu3").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
    document.getElementById("gameElements").style.display = "none";
    document.getElementById("control-panel3").style.display = "none";
    document.getElementById("q-values").style.display = "none";
    document.getElementById("START3").style.display = "none";
    document.getElementById("button-container3").style.display = "none";
    document.getElementById("agent-explanation3").style.display = "none";
    document.getElementById("message1").style.display = "none";
}

function showOptions() {
    // オプション画面を表示（実装が必要）
    // 例: オプションダイアログを表示するロジック
}

//exit機能
function confirmExit() {
    if (window.confirm("ゲームを終了しますか？")) {
        window.close(); // ユーザーが確認した場合、タブが閉じられます
    }
}

function updateParameters3() {
    alpha3 = parseFloat(document.getElementById("learning-rate").value);
    gamma3 = parseFloat(document.getElementById("discount-rate").value);
    penaltyWall3 = parseFloat(document.getElementById("penalty-wall").value);
    rewardCloser3 = parseFloat(document.getElementById("reward-closer").value);
    rewardNewPosition3 = parseFloat(document.getElementById("reward-new-position").value);
    rewardGoal3 = parseFloat(document.getElementById("reward-goal").value);
}

// コード表示関数
function showCode1() {
    var codeContainer = document.getElementById("code-container1");
    if (codeContainer.style.display === "none") {
        codeContainer.style.display = "block";
    } else {
        codeContainer.style.display = "none";
    }
}

// コード表示関数
function showCode2() {
    var codeContainer = document.getElementById("code-container2");
    if (codeContainer.style.display === "none") {
        codeContainer.style.display = "block";
    } else {
        codeContainer.style.display = "none";
    }
}

// コード表示関数
function showCode3() {
    var codeContainer = document.getElementById("code-container3");
    if (codeContainer.style.display === "none") {
        codeContainer.style.display = "block";
    } else {
        codeContainer.style.display = "none";
    }
}
