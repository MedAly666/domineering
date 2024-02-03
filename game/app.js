const DEPTH = 5;
const BOT = 1;
const PLAYER = 2;
const N = 8;
const STEP = 70;

const canvas = document.getElementById("gameCanvas");

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
    }
    return true;
}

function removeItem(row, col, ply) {
    if (ply === PLAYER) {
        board[row][col] = 0;
        board[row + 1][col] = 0;
    } else {
        board[row][col] = 0;
        board[row][col + 1] = 0;
    }
}

function getPossibilities(ply) {
    let sum = 0;
    let row_m = ply === PLAYER ? 1 : 0;
    let col_m = ply === PLAYER ? 0 : 1;

    for (let i = 0; i < N - row_m; i++) {
        for (let j = 0; j < N - col_m; j++) {
            if (board[i][j] === 0 && board[i + row_m][j + col_m] === 0) {
                sum += 1;
            }
        }
    }

    return sum;
}

function alphabeta(recursivity, ply, ri, rj, alpha, beta) {
    if (recursivity === 0)
        return getPossibilities(ply) - (ply === BOT ? getPossibilities(PLAYER) : getPossibilities(BOT));

    let fi = 0;
    let fj = 0;
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            if (placeItem(i, j, ply)) {
                let e = -alphabeta(recursivity - 1, ply === BOT ? PLAYER : BOT, fi, fj, -beta, -alpha);
                removeItem(i, j, ply);
                if (e > alpha) {
                    alpha = e;
                    ri[0] = i;
                    rj[0] = j;
                    if (alpha >= beta) {
                        return beta;
                    }
                }
            }
        }
    }
    return alpha;
}

function bestPlay(recursivity, ply) {
    let i = [0];
    let j = [0];
    alphabeta(DEPTH, BOT, i, j, -Infinity, Infinity);
    if(isPossible(i[0],j[0],BOT)){
        placeItem(i[0], j[0], BOT);
        draw(i[0],j[0],BOT);
    }else{
        for(let row = 0;row < N;row++)
        {
            for(let col = 0;col < N-1;col++)
            {
                if(isPossible(row,col,BOT))
                {
                    placeItem(row,col,BOT);
                    draw(row,col,BOT);
                    return;
                }
            }
        }
    }
    
}
//
function endGame(ply){
    setTimeout(() => {
        alert(ply ? "You won." : "You lost.");
    }, 300);
      
}
//
function draw(row,col,ply){
	ctx.fillStyle = ply === PLAYER ? "#ff0000" : "#0000ff";
	ctx.fillRect(STEP * col + 0.5 ,STEP * row + 0.5, (ply === PLAYER ? STEP : STEP*2) - 0.5, (ply === PLAYER ? STEP*2:STEP) - 0.5);
	board[row][col] = ply ;
	board[ply === PLAYER ? (row + 1) : row][ply === PLAYER ? (col): (col + 1)] = ply;
}
//
function isPossible(row,col,ply){
	if(board[row][col] !== 0){
		return false ;
	}
	if(ply === PLAYER && (row+1>N-1 || board[row + 1][col] !== 0)){
		return false ;
	}
    if(ply === BOT && (col+1>N-1 || board[row][col + 1] !== 0)){
		return false ;
	}
	return true ;
}
//
function updateGame(event){
	let col = Math.floor(event.pageX / STEP);
	let row = Math.floor(event.pageY / STEP);

	if(isPossible(row,col,PLAYER)){
        placeItem(row,col,PLAYER);
		draw(row,col,PLAYER);
		if(getPossibilities(PLAYER) === 0){
            endGame(false);
		}
        if (getPossibilities(BOT) === 0) {
            endGame(true);
        }
        bestPlay(DEPTH, BOT);
	}
}
//
function initGame(canvas){
    board = [
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0],
		[0,0,0,0,0,0,0,0]
	]
	//set canvas size
	canvas.width = STEP*N+1 ;
	canvas.height = STEP*N+1 ;
	ctx = canvas.getContext("2d")
	
	//draw the grid
	for(let i = 0; i <= 8; i++ ){
		ctx.moveTo(i*STEP+0.5,0.5);
		ctx.lineTo(i*STEP+0.5,STEP*N+0.5);
	}
	for(let i = 0; i <= N; i++ ){
		ctx.moveTo(0.5,i*STEP+0.5);
		ctx.lineTo(STEP*N+0.5,i*STEP+0.5);
	}
	ctx.strokeStyle = "#000";
	ctx.stroke();
    bestPlay(DEPTH,BOT);
    
}
///
initGame( document.querySelector("#gameCanvas") );

canvas.addEventListener("click",(e)=>{
    updateGame(e);
},false)

