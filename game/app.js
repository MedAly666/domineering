
const DEPTH = 6; 
const BOT = 1;
const PLAYER = 2;
const N = 8;
const STEP = 70;

const canvas = document.getElementById("gameCanvas");

function killingMove(i, j, ply) {
    this.i = i;
    this.j = j;
    this.ply = ply;
}

let movesSaved = new Array(DEPTH).fill(null);
let transpositionTable = new Map();
let currentHash = 0;
let zobristTable = [];
const MAX_PLAYER_TYPES = 3;  // 0 (empty), PLAYER (1), BOT (2)

// A function that changes the content of the matrix depending on the game 
function placeItem(row, col, ply) {
    let col_m = 0;
    let row_m = 0;
    if (ply === PLAYER) {
        row_m = 1;
    } else {
        col_m = 1;
    }

    if (row + row_m >= N || col + col_m >= N || board[row + row_m][col] !== 0 || board[row][col + col_m] !== 0) {
        return false;
    } else {
        board[row][col] = ply;
        board[row + row_m][col + col_m] = ply;
        
        // Update Zobrist hash for placing the item
        updateZobristHash(row, col, ply);
        updateZobristHash(row + row_m, col + col_m, ply);
    }
    return true;
}

// function clears the game
function removeItem(row, col, ply) {
    if (ply === PLAYER) {
        // Update Zobrist hash for removing the item
        updateZobristHash(row, col, ply);
        updateZobristHash(row + 1, col, ply);
        board[row][col] = 0;
        board[row + 1][col] = 0;
    } else {
        // Update Zobrist hash for removing the item
        updateZobristHash(row, col, ply);
        updateZobristHash(row, col + 1, ply);
        board[row][col] = 0;
        board[row][col + 1] = 0;
    }
}

// Update the Zobrist hash when placing or removing an item
function updateZobristHash(row, col, ply) {
    currentHash ^= zobristTable[row][col][ply];
}

// Zobrist table initialization
function initZobristTable() {
    zobristTable = Array.from({ length: N }, () => 
        Array.from({ length: N }, () => 
            Array.from({ length: MAX_PLAYER_TYPES }, () => 
                Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
            )
        )
    );
}

// The number of possible plays for the player
function getPossibilities(ply) {
    let sum = 0;
    let row_m = ply === PLAYER ? 1 : 0;
    let col_m = ply === PLAYER ? 0 : 1;

    for (let i = 0; i < N - row_m; i++) {
        for (let j = 0; j < N - col_m; j++) {
            if (board[i][j] === 0 && board[i + row_m][j + col_m] === 0) {
                sum++;
            }
        }
    }
    return sum;
}

// A function that evaluates the current board state
function evaluate(ply){
    return getPossibilities(ply) - getPossibilities(ply == BOT ? PLAYER : BOT);
}

function isTacticalMove(i, j, ply) {
    // Si la case est déjà occupée ou que la place est invalide pour placer un domino, retournez false
    let row_m = ply === PLAYER ? 1 : 0;
    let col_m = ply === PLAYER ? 0 : 1;
    
    if (board[i][j] !== 0 || i + row_m >= N || j + col_m >= N || board[i + row_m][j + col_m] !== 0) {
        return false;
    }

    // Déterminer l'adversaire
    let opponent = (ply === PLAYER) ? BOT : PLAYER;

    // Vérifier rapidement les menaces immédiates et les opportunités de blocage
    if (ply === PLAYER) {
        // Vérifier si on capture ou menace une pièce BOT
        if (i + 1 < N && board[i + 1][j] === opponent) {
            return true;  // Menace en dessous
        }
        if (j + 1 < N && board[i][j + 1] === 0 && board[i + 1][j + 1] === opponent) {
            return true;  // Bloque le BOT
        }
    } else {
        // Vérifier si on capture ou menace une pièce PLAYER
        if (j + 1 < N && board[i][j + 1] === opponent) {
            return true;  // Menace à droite
        }
        if (i + 1 < N && board[i + 1][j] === 0 && board[i + 1][j + 1] === opponent) {
            return true;  // Bloque le PLAYER
        }
    }

    // Si aucune menace ou blocage n'est détecté, alors ce n'est pas un mouvement tactique
    return false;
}


function quiescenceSearch(alpha, beta, ply) {
    // Évaluer la position actuelle
    let standPat = evaluate(ply);

    // Si l'évaluation de la position est meilleure que beta, on fait un "beta cutoff"
    if (standPat >= beta) {
        return beta;
    }
    
    // Mettre à jour alpha si l'évaluation est meilleure
    if (standPat > alpha) {
        alpha = standPat;
    }

    // Rechercher uniquement les coups tactiques (comme les captures)
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (isTacticalMove(i, j, ply)) {
                if (placeItem(i, j, ply)) {
                    let score = -quiescenceSearch(-beta, -alpha, ply === BOT ? PLAYER : BOT);
                    removeItem(i, j, ply);
                    if (score >= beta) {
                        return beta;  // Beta cutoff
                    }
                    if (score > alpha) {
                        alpha = score;
                    }
                }
            }
        }
    }

    return alpha;
}

// Alphabete with Zobrist hashing
function alphabetakiller(depth, ply, ri, rj, alpha, beta) {
    // Si on atteint la profondeur maximale, on passe à la quiescence search
    if (depth === 0) {
        return quiescenceSearch(alpha, beta, ply);
    }
    
    // Check if current board state has been encountered before
    if (transpositionTable.has(currentHash)) {
        return transpositionTable.get(currentHash);
    }

    if (depth === 0 || getPossibilities(ply) === 0) {
        let eval = evaluate(ply);
        transpositionTable.set(currentHash, eval);  // Cache the evaluation
        return eval;
    }

    let fi = 0;
    let fj = 0;
    if (movesSaved[depth - 1] !== null) {
        if (placeItem(movesSaved[depth - 1].i, movesSaved[depth - 1].j, ply)) {
            let l = -alphabetakiller(depth - 1, ply === BOT ? PLAYER : BOT, fi, fj, -beta, -alpha);
            removeItem(movesSaved[depth - 1].i, movesSaved[depth - 1].j, ply);
            if (l > alpha) {
                alpha = l;
                ri[0] = movesSaved[depth - 1].i;
                rj[0] = movesSaved[depth - 1].j;
                if (alpha >= beta) {
                    transpositionTable.set(currentHash, beta);  // Store beta cutoff
                    return beta;
                }
            }
        }
    }

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (placeItem(i, j, ply)) {
                let l = -alphabetakiller(depth - 1, ply === BOT ? PLAYER : BOT, fi, fj, -beta, -alpha);
                removeItem(i, j, ply);
                if (l > alpha) {
                    alpha = l;
                    ri[0] = i;
                    rj[0] = j;
                    movesSaved[depth - 1] = new killingMove(i, j, ply);
                    if (alpha >= beta) {
                        transpositionTable.set(currentHash, beta);  // Store beta cutoff
                        return beta;
                    }
                }
            }
        }
    }

    transpositionTable.set(currentHash, alpha);  // Cache final alpha value
    return alpha;
}

// A function that searches for the best game for the BOT and plays it
function bestPlay() {
    let i = [0];
    let j = [0];

    alphabetakiller(DEPTH, BOT, i, j, -Infinity, Infinity);
    transpositionTable.clear();
    placeItem(i[0], j[0], BOT);
    draw(i[0],j[0],BOT);
}

// A function that prints the winning player
function endGame(ply){
    setTimeout(() => {
        alert(ply === PLAYER ? "You won." : "You lost.");
    }, 300);
}

// A function that plots the game
function draw(row, col, ply){
    ctx.fillStyle = ply === PLAYER ? "#ff0000" : "#0000ff";
    ctx.fillRect(STEP * col + 0.5 ,STEP * row + 0.5, (ply === PLAYER ? STEP : STEP*2) - 0.5, (ply === PLAYER ? STEP*2 : STEP) - 0.5);
    board[row][col] = ply ;
    board[ply === PLAYER ? (row + 1) : row][ply === PLAYER ? (col) : (col + 1)] = ply;
}

// function return the true if the play possible else false
function isPossible(row, col, ply){
    if(board[row][col] !== 0){
        return false ;
    }
    if(ply === PLAYER && (row+1 > N-1 || board[row + 1][col] !== 0)){
        return false ;
    }
    if(ply === BOT && (col+1 > N-1 || board[row][col + 1] !== 0)){
        return false ;
    }
    return true ;
}

// Update the game on every click 
function updateGame(event){
    let col = Math.floor(event.pageX / STEP);
    let row = Math.floor(event.pageY / STEP);

    if(isPossible(row, col, PLAYER)){
        if(getPossibilities(PLAYER) === 0)
            endGame(BOT);

        placeItem(row, col, PLAYER);
        draw(row, col, PLAYER);

        if (getPossibilities(BOT) === 0) {
            endGame(PLAYER);
        } else {
            bestPlay();
            if(getPossibilities(PLAYER) === 0)
                endGame(BOT);
        }
    }
}

// initial the board and the canvas
function initGame(canvas){
    board = Array.from({ length: N }, () => Array(N).fill(0));

    // Set canvas size
    canvas.width = STEP * N + 1;
    canvas.height = STEP * N + 1;
    ctx = canvas.getContext("2d");
    
    // Draw the grid
    for(let i = 0; i <= N; i++ ){
        ctx.moveTo(i * STEP + 0.5, 0.5);
        ctx.lineTo(i * STEP + 0.5, STEP * N + 0.5);
    }
    for(let i = 0; i <= N; i++ ){
        ctx.moveTo(0.5, i * STEP + 0.5);
        ctx.lineTo(STEP * N + 0.5, i * STEP + 0.5);
    }
    ctx.strokeStyle = "#000";
    ctx.stroke();
    
    initZobristTable();  // Initialize Zobrist hashing table
}

initGame(document.querySelector("#gameCanvas"));

canvas.addEventListener("click", (e) => {
    const startTime = new Date();
    updateGame(e);
    const endTime = new Date();
    console.log("temps d'execution :",endTime.getSeconds() - startTime.getSeconds());
});
