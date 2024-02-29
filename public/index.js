// src/classes/Minmax.ts
class Dialog {
  parent;
  content;
  element;
  constructor(parent, content) {
    this.parent = parent || document.body;
    this.content = content || { header: "", body: "", footer: "" };
    this.element = document.createElement("dialog");
    if (parent && content)
      this.render();
  }
  fromDOM(element) {
    this.parent = element.parentElement;
    this.content = {
      header: element.querySelector(".dialog-header h2")?.textContent || "",
      body: element.querySelector(".dialog-body")?.innerHTML || "",
      footer: element.querySelector(".dialog-footer")?.innerHTML || ""
    };
    this.element = element;
  }
  render() {
    const dialog = document.createElement("dialog");
    dialog.className = "dialog";
    dialog.innerHTML = `
            <div class="dialog-header">
                <h2>${this.content.header}</h2>
            </div>
            <div class="dialog-body">
                ${this.content.body}
            </div>
            <div class="dialog-footer">
                ${this.content.footer}
            </div>
        `;
    this.parent.appendChild(dialog);
    this.element = dialog;
  }
  open() {
    this.element.showModal();
  }
  close() {
    this.element.close();
  }
}
var Dialog_default = Dialog;

// src/classes/Minmax.tsng.ts
class Domineering {
  board;
  vertical;
  verticalColor;
  horizontalColor;
  moves;
  constructor(n = 8, props) {
    this.board = new Array(n).fill(0).map(() => new Array(n).fill(0));
    this.vertical = true;
    this.verticalColor = props?.verticalColor || "blue";
    this.horizontalColor = props?.horizontalColor || "red";
    this.moves = [];
  }
  isVertical() {
    return this.vertical;
  }
  undoMove() {
    let move = this.moves.pop();
    if (move) {
      this.board[move.i][move.j] = 0;
      this.board[move.i + +move.vertical][move.j + +!move.vertical] = 0;
      this.vertical = move.vertical;
    }
  }
  getBoard() {
    return this.board.map((x) => x.map((y) => y));
  }
  move(row, col) {
    if (this.vertical) {
      if (row === this.board.length - 1) {
        return false;
      } else {
        if (this.board[row][col] === 0 && this.board[row + 1][col] === 0) {
          this.play(row, col);
        }
        return true;
      }
    } else {
      if (col === this.board.length - 1) {
        return false;
      } else {
        if (this.board[row][col] === 0 && this.board[row][col + 1] === 0) {
          this.play(row, col);
        }
        return true;
      }
    }
  }
  play(row, col) {
    this.board[row][col] = this.vertical ? 1 : 2;
    this.board[row + (this.vertical ? 1 : 0)][col + (this.vertical ? 0 : 1)] = this.vertical ? 1 : 2;
    this.moves.push({ vertical: this.vertical, i: row, j: col });
    this.vertical = !this.vertical;
  }
  isGameOver() {
    if (this.vertical) {
      for (let i = 0;i < this.board.length - 1; i++) {
        for (let j = 0;j < this.board.length; j++) {
          if (this.board[i][j] === 0 && this.board[i + 1][j] === 0) {
            return false;
          }
        }
      }
    } else {
      for (let i = 0;i < this.board.length; i++) {
        for (let j = 0;j < this.board.length - 1; j++) {
          if (this.board[i][j] === 0 && this.board[i][j + 1] === 0) {
            return false;
          }
        }
      }
    }
    return true;
  }
  calculateScore() {
    let score = 1;
    for (let i = 0;i < this.board.length; i++) {
      for (let j = 0;j < this.board.length; j++) {
        if (this.board[i][j] === 0) {
          score++;
        }
      }
    }
    return score;
  }
  display(ctx, width, height) {
    ctx.beginPath();
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.closePath();
    ctx.beginPath();
    let step = width / this.board.length;
    for (let i = 0;i < this.board.length; i++) {
      for (let j = 0;j < this.board.length; j++) {
        if (this.board[i][j] === 1) {
          ctx.fillStyle = this.verticalColor;
          ctx.fillRect(j * step, i * step, step, step);
        } else if (this.board[i][j] === 2) {
          ctx.fillStyle = this.horizontalColor;
          ctx.fillRect(j * step, i * step, step, step);
        } else {
          ctx.strokeStyle = "#000000";
          ctx.rect(j * step, i * step, step, step);
          ctx.stroke();
        }
      }
    }
  }
}
var Domineering_default = Domineering;

// src/classes/Minmax.ts
class Minmax {
  alphaBeta;
  evalFunc;
  constructor(alphaBeta, evalFunc) {
    this.alphaBeta = alphaBeta;
    this.evalFunc = evalFunc;
  }
  copyArray(arr) {
    return arr.map((x) => Array.isArray(x) ? this.copyArray(x) : x);
  }
  apply(state, depth, maximizing = true) {
    if (depth === 0 || state.isGameOver()) {
      return this.evalFunc(state);
    }
    let board = state.getBoard();
    for (let i = 0;i < board.length; i++) {
      for (let j = 0;j < board.length; j++) {
      }
    }
  }
}
var Minmax_default = Minmax;

// src/clas
var setup = function() {
  game = new Domineering_default(4);
  game.display(ctx, WIDTH, HEIGHT);
  canvas.addEventListener("click", (e) => {
    let step = WIDTH / game.getBoard().length;
    let x = Math.floor((e.clientX - canvas.offsetLeft) / step);
    let y = Math.floor((e.clientY - canvas.offsetTop) / step);
    if (game.move(y, x)) {
      game.display(ctx, WIDTH, HEIGHT);
    }
    game.display(ctx, WIDTH, HEIGHT);
    console.log("value : ", evaluate(game));
    if (game.isGameOver()) {
      let score = game.calculateScore();
      console.log("Game Over. \n" + (game.isVertical() ? "vertical" : "horizental") + " loses. \nScore: " + score);
    } else {
      if (true) {
        let move = ai.apply(game, 3);
      }
    }
  });
};
var evaluate = function(state) {
  let board = state.getBoard();
  let score = 0;
  for (let i = 0;i < board.length; i++) {
    for (let j = 0;j < board[i].length; j += 2) {
      if (isSafe(state.getBoard(), j, i, true)) {
        score++;
      } else {
        if (isSafe(state.getBoard(), i, j, false)) {
          /*!state.isVertical()*/
          score--;
        }
      }
    }
  }
  return score;
};
var isSafe = function(board, i, j, vertical) {
  if (board[i][j] !== 0)
    return false;
  if (i + +vertical >= board.length)
    return false;
  if (j + +!vertical >= board[i].length)
    return false;
  let occupiedNeighbors = 0;
  if (vertical) {
    if (j !== 0) {
      if (board[i][j - 1] !== 0)
        occupiedNeighbors++;
      if (i < board.length - 1 && board[i + 1][j - 1] !== 0)
        occupiedNeighbors++;
    } else {
      occupiedNeighbors += 2;
    }
    if (j !== board.length - 1) {
      if (board[i][j + 1] !== 0)
        occupiedNeighbors++;
      if (i < board.length - 1 && board[i + 1][j + 1] !== 0)
        occupiedNeighbors++;
    } else {
      occupiedNeighbors += 2;
    }
  } else {
    if (i !== 0) {
      if (board[i - 1][j] !== 0)
        occupiedNeighbors++;
      if (j < board.length - 1 && board[i - 1][j + 1] !== 0)
        occupiedNeighbors++;
    } else {
      occupiedNeighbors += 2;
    }
    if (i !== board.length - 1) {
      if (board[i + 1][j] !== 0)
        occupiedNeighbors++;
      if (j < board.length - 1 && board[i + 1][j + 1] !== 0)
        occupiedNeighbors++;
    } else {
      occupiedNeighbors += 2;
    }
  }
  return occupiedNeighbors == 4;
};
var undo = function() {
  game.undoMove();
  game.display(ctx, WIDTH, HEIGHT);
};
var settingsDialog = new Dialog_default;
settingsDialog.fromDOM(document.getElementById("settings-dialog"));
var aboutDialog = new Dialog_default;
aboutDialog.fromDOM(document.getElementById("about-dialog"));
var gameDialog = new Dialog_default;
gameDialog.fromDOM(document.getElementById("game-dialog"));
gameDialog.open();
var game;
var ai = new Minmax_default(false, evaluate);
var canvas = document.querySelector("#game");
var ctx = canvas.getContext("2d");
var WIDTH = canvas.width;
var HEIGHT = canvas.height;
setup();
undo();
