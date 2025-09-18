
const DEPTH = 6; 
const BOT = 1;
const PLAYER = 2;
const N = 8;
const STEP = 70;
const MAX_TT_SIZE = 500000;

// Optionally avoid storing very shallow nodes to save space:
const MIN_STORE_DEPTH = 1; // store only nodes with depth >= 1

const canvas = document.getElementById("gameCanvas");

function killingMove(i, j, ply) {
    this.i = i;
    this.j = j;
    this.ply = ply;
}

let movesSaved = new Array(DEPTH).fill(null);
let transpositionTable = new Map();
let currentHash = 0n;
let zobristSide = 0n;
let zobristTable = [];
const MAX_PLAYER_TYPES = 3;  // 0 (empty), PLAYER (2), BOT (1)

// Globals
let killerMoves = Array.from({length: DEPTH + 1}, () => []);
let historyTable = Array.from({length: N}, () => Array(N).fill(0));

// Toggle for enabling/disabling profiling (disable for pure speed runs)
const PROFILER_ENABLED = true;

// Profiler object
let profiler = {
  nodes: 0,
  qNodes: 0,
  ttLookups: 0,
  ttHits: 0,
  ttStores: 0,
  cutoffs: 0,
  timeMs: 0,
};

function profilerReset() {
  profiler.nodes = 0;
  profiler.qNodes = 0;
  profiler.ttLookups = 0;
  profiler.ttHits = 0;
  profiler.ttStores = 0;
  profiler.cutoffs = 0;
  profiler.timeMs = 0;
  profiler.startTime = performance.now();
}

function profilerStop() {
  profiler.timeMs = performance.now() - (profiler.startTime || performance.now());
}

function printProfiler() {
  console.table(profiler);
}

// Generate legal moves then order them by heuristics
function generateMovesOrdered(ply, depth) {
    const moves = [];
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (!isPossible(i, j, ply)) continue;
            let score = 0;
            // history heuristic
            score += historyTable[i][j];
            // killer heuristic
            if (killerMoves[depth] && killerMoves[depth].some(k => k.i === i && k.j === j)) score += 100000;
            // tactical bias
            if (isTacticalMove(i, j, ply)) score += 500;
            moves.push({i, j, score});
        }
    }
    moves.sort((a,b) => b.score - a.score);
    return moves;
}

// Zobrist: generate 64-bit BigInt random using crypto
function rand64BigInt() {
    const a = crypto.getRandomValues(new Uint32Array(2));
    // combine into a 64-bit BigInt
    return (BigInt(a[0]) << 32n) ^ BigInt(a[1]);
}

// Initialize zobrist table with BigInt values
function initZobristTable() {
    zobristTable = Array.from({ length: N }, () =>
        Array.from({ length: N }, () =>
            Array.from({ length: MAX_PLAYER_TYPES }, () =>
                rand64BigInt()
            )
        )
    );
    zobristSide = rand64BigInt(); // side to move
    currentHash = 0n; // reset
}

// Update the Zobrist hash when placing or removing an item
function updateZobristHash(row, col, ply) {
    // ply must be 0,1,2
    currentHash ^= zobristTable[row][col][ply];
}

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
        // flip side token because the player to move changed
        currentHash ^= zobristSide;
    }
    return true;
}

// Try to place a domino only if it is legal. Returns true if placed.
function tryPlace(row, col, ply) {
    if (!isPossible(row, col, ply)) return false;
    placeItem(row, col, ply); // this already updates board and zobrist hash
    return true;
}

// function clears the game
function undoPlace(row, col, ply) {
    // flip side token first to revert side-to-move
    currentHash ^= zobristSide;
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

// Helper to generate string key from BigInt zobrist hash
function ttKey(hashBigInt) {
    return hashBigInt.toString();
}

// Lookup in transposition table with LRU refresh.
// Returns stored usable value or null.
function ttLookup(alpha, beta, depth) {
    if (PROFILER_ENABLED) profiler.ttLookups++;
    const key = ttKey(currentHash);
    if (!transpositionTable.has(key)) return null;

    // Get entry
    const e = transpositionTable.get(key);

    // If stored entry too shallow, treat as miss
    if (e.depth < depth) return null;

    // Move entry to the end to mark it as recently used:
    // (delete + set is a common LRU trick with Map)
    transpositionTable.delete(key);
    transpositionTable.set(key, e);

    // Interpret flags
    if (e.flag === "EXACT"){
        profiler.ttHits++;
        return e.value;
    }
    if (e.flag === "LOWER" && e.value >= beta){
        profiler.ttHits++;
        return e.value;
    }
    if (e.flag === "UPPER" && e.value <= alpha){
        profiler.ttHits++;
        return e.value;
    }

    // Not usable bound for this alpha/beta window
    return null;
}

// Store entry in TT while enforcing capacity and optional depth threshold.
function ttStore(value, depth, flag, bestMove) {
    if (PROFILER_ENABLED) profiler.ttStores++;

    // Optionally avoid storing very shallow nodes
    if (depth < MIN_STORE_DEPTH) return;

    const key = ttKey(currentHash);

    // If key exists, remove first so that new insertion moves it to the end (recent).
    if (transpositionTable.has(key)) {
        transpositionTable.delete(key);
    }

    // Insert as most-recent
    transpositionTable.set(key, { value, depth, flag, bestMove });

    // Enforce size limit: delete oldest inserted entry when exceeded
    if (transpositionTable.size > MAX_TT_SIZE) {
        // Map preserves insertion order. keys().next().value gives the oldest key.
        const oldestKey = transpositionTable.keys().next().value;
        if (oldestKey !== undefined) {
            transpositionTable.delete(oldestKey);
        }
    }
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


function quiescenceSearch(alpha, beta, ply, qDepth = 3) {
    if (PROFILER_ENABLED) profiler.qNodes++;

    if (qDepth <= 0) return evaluate(ply);

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
            if (tryPlace(i, j, ply)) {
                    let score = -quiescenceSearch(-beta, -alpha, ply === BOT ? PLAYER : BOT, qDepth - 1);
                    undoPlace(i, j, ply);
                    if (score >= beta) {
                        return beta;  // Beta cutoff
                    }
                    if (score > alpha) {
                        alpha = score;
                    }
            }
        }
    }

    return alpha;
}

// Ensure killerMoves exists per-depth and add a killer move safely.
// Keeps at most 2 killer moves per depth.
function addKiller(depth, move) {
    // clamp depth to a safe integer index (non-negative)
    let idx = Math.max(0, Math.floor(depth));

    // If killerMoves isn't initialized or is too small, grow it dynamically
    if (!Array.isArray(killerMoves)) {
        killerMoves = [];
    }
    while (killerMoves.length <= idx) {
        killerMoves.push([]); // initialize empty arrays up to idx
    }

    // Ensure the inner entry is an array
    if (!Array.isArray(killerMoves[idx])) {
        killerMoves[idx] = [];
    }

    // Insert the new killer move at the front if not duplicate
    // Optionally avoid duplicates:
    if (!killerMoves[idx].some(k => k.i === move.i && k.j === move.j)) {
        killerMoves[idx].unshift(move);
    }

    // Keep only top 2 killers
    if (killerMoves[idx].length > 2) killerMoves[idx].length = 2;
}

// Replace existing alphabeta with this improved version
function alphabeta(depth, ply, ri, rj, alpha, beta) {
    if (PROFILER_ENABLED) profiler.nodes++;

    // Terminal / leaf handling first
    if (depth === 0 || getPossibilities(ply) === 0) {
        // use quiescence to avoid horizon effect when depth==0
        //const leafVal = (depth === 0) ? quiescenceSearch(alpha, beta, ply) : evaluate(ply);
        let value = evaluate(ply);
        // store as exact (leaf)
        ttStore(value, depth, "EXACT", null);
        return value;
    }

    // Transposition lookup (after leaf check)
    const ttVal = ttLookup(alpha, beta, depth);
    if (ttVal !== null) return ttVal;

    let originalAlpha = alpha;
    let bestVal = -Infinity;
    let bestMove = null;

    // Try TT-best move first if present
    const key = ttKey(currentHash);
    if (transpositionTable.has(key)) {
        const e = transpositionTable.get(key);
        if (e.bestMove && isPossible(e.bestMove.i, e.bestMove.j, ply)) {
            const { i, j } = e.bestMove;
            if (tryPlace(i, j, ply)) {
                const val = -alphabeta(depth - 1, ply === BOT ? PLAYER : BOT, [0], [0], -beta, -alpha);
                undoPlace(i, j, ply);
                if (val > bestVal) { bestVal = val; bestMove = { i, j }; }
                if (bestVal > alpha) { alpha = bestVal; historyTable[i][j] += depth * depth; }
                if (alpha >= beta) {
                    // Beta cutoff -> lower bound
                    if (PROFILER_ENABLED) profiler.cutoffs++;
                    ttStore(bestVal, depth, "LOWER", { i, j });
                    addKiller(depth, { i, j });
                    return beta;
                }
            }
        }
    }

    // Ordered moves
    const moves = generateMovesOrdered(ply, depth);
    for (const m of moves) {
        const i = m.i, j = m.j;
        if (!tryPlace(i, j, ply)) continue;
        const val = -alphabeta(depth - 1, ply === BOT ? PLAYER : BOT, [0], [0], -beta, -alpha);
        undoPlace(i, j, ply);

        if (val > bestVal) {
            bestVal = val;
            bestMove = { i, j };
        }
        if (val > alpha) {
            alpha = val;
            historyTable[i][j] += depth * depth;
        }
        if (alpha >= beta) {
            // Beta cutoff -> lower bound
            ttStore(alpha, depth, "LOWER", bestMove);
            addKiller(depth, { i, j });
            return beta;
        }
    }

    // After searching all moves:
    // If bestVal <= originalAlpha => upper bound (no move improved alpha)
    // else exact value
    if (bestVal <= originalAlpha) {
        ttStore(bestVal, depth, "UPPER", bestMove);
    } else {
        ttStore(bestVal, depth, "EXACT", bestMove);
    }

    if (bestMove) { ri[0] = bestMove.i; rj[0] = bestMove.j; }
    return bestVal;
}


// A function that searches for the best game for the BOT and plays it
function searchAndPlay() {
    profilerReset();
    let i = [0];
    let j = [0];

    alphabeta(DEPTH, BOT, i, j, -Infinity, Infinity);
    console.log("transpositionTable size:", transpositionTable.size);
    profilerStop();
    printProfiler();
    // Safety: ensure move is legal
    if (!isPossible(i[0], j[0], BOT)) {
        console.warn("alphabeta returned illegal move; falling back to first legal move");
        const moves = generateMovesOrdered(BOT, DEPTH);
        if (moves.length === 0) {
            endGame(PLAYER);
            return;
        }
        i[0] = moves[0].i;
        j[0] = moves[0].j;
    }

    tryPlace(i[0], j[0], BOT);
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

// Flag to avoid user input while the bot is thinking
let thinking = false;

function updateGame(event) {
    // If engine is thinking, ignore user clicks
    if (thinking) return;
    
    let col = Math.floor(event.pageX / STEP);
    let row = Math.floor(event.pageY / STEP);

    // Check player move legality
    if (!isPossible(row, col, PLAYER)) return;
    
    // Place player's move and render (placeItem updates board and zobrist)
    placeItem(row, col, PLAYER);
    draw(row, col, PLAYER); // draw should NOT mutate board

    // After player's move, check if BOT has any moves; if not, player wins
    if (getPossibilities(BOT) === 0) {
        endGame(PLAYER);
        return;
    }

    // Now call the search and play the bot's move.
    // Block further clicks while the engine calculates.
    thinking = true;
    try {
    // searchAndPlay is expected to be synchronous here (blocking).
    // If it's asynchronous, see the async version below.
    searchAndPlay(); // this should play the BOT move (place & draw)
    } catch (err) {
        console.error("searchAndPlay error:", err);
    } finally {
        thinking = false;
    }

    // After bot move, check if player has moves; if not BOT wins
    if (getPossibilities(PLAYER) === 0) {
    endGame(BOT);
    }
}

//initZobristTable();
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

    // Optional: clear TT at new game start
    transpositionTable.clear();
    /*
    // If BOT should play first, schedule it after the browser rendered the grid
    if (getPossibilities(BOT) > 0) {
        thinking = true;
        try {
            searchAndPlay(); // synchronous search executed after render
        } finally {
            thinking = false;
        }
    }*/
}

initGame(document.querySelector("#gameCanvas"));

canvas.addEventListener("click", (e) => {
    const startTime = new Date();
    updateGame(e);
    const endTime = new Date();
    //console.log("temps d'execution :",endTime.getSeconds() - startTime.getSeconds());
});
