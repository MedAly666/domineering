import Dialog from './src/classes/Dialog';
import Domineering from './src/classes/Domineering';
import Minmax from './src/classes/Minmax';

let settingsDialog = new Dialog();
settingsDialog.fromDOM(document.getElementById('settings-dialog') as HTMLDialogElement);
//settingsDialog.open();

let aboutDialog = new Dialog();
aboutDialog.fromDOM(document.getElementById('about-dialog') as HTMLDialogElement);
//aboutDialog.open();

let gameDialog = new Dialog();
gameDialog.fromDOM(document.getElementById('game-dialog') as HTMLDialogElement);
gameDialog.open();


let game:Domineering;
let ai = new Minmax(false,evaluate);

//canvas
const canvas : HTMLCanvasElement = document.querySelector('#game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const WIDTH = canvas.width ;
const HEIGHT = canvas.height ;

setup();

function setup() {
	game = new Domineering(4);

	game.display(ctx, WIDTH, HEIGHT);

	canvas.addEventListener('click', (e) => {
		let step = WIDTH / game.getBoard().length;
		let x = Math.floor((e.clientX - canvas.offsetLeft) / step) ;
		let y = Math.floor((e.clientY - canvas.offsetTop) / step);
		
		if(game.move(y, x)){
			game.display(ctx, WIDTH, HEIGHT);
		}
		game.display(ctx, WIDTH, HEIGHT);
		console.log('value : ', evaluate(game));
		
		if(game.isGameOver()){
			
			let score = game.calculateScore();
			console.log('Game Over. \n'+(game.isVertical()?'vertical':'horizental')+' loses. \nScore: ' + score);
		}else{
			if(true){
				let move = ai.apply(game,3);
			}
		}

		
	})

}



function evaluate(state:Domineering){
	let board = state.getBoard();
	let score = 0;
	for(let i = 0; i < board.length; i++){
		for(let j = 0; j < board[i].length; j+=2){
			if( isSafe( state.getBoard(), j,i, true/*state.isVertical()*/ ) ){
				score++;
			}else{
				if( isSafe( state.getBoard(), i, j, false/*!state.isVertical()*/ ) ){
					score--;
				}
			}
			/*
			score += +isSafe(state.getBoard(),i,j,state.isVertical());
			score -= +isSafe(state.getBoard(),i,j,!state.isVertical())
			*/
		}
	}
	return score;
}

/**
 * function to check if a position is safe
 * 
 * @param board number[][]
 * @param i number
 * @param j number
 * @param vertical boolean
 * @returns is the position safe
 */
function isSafe(board:number[][],i:number,j:number,vertical:boolean):boolean{
	if(board[i][j] !== 0) return false;
	if( i + +vertical >= board.length ) return false ;
	if( j + +!vertical >= board[i].length ) return false ;

	let occupiedNeighbors = 0 ;
	/*
	if(i == 0 ) occupiedNeighbors++;
	else if(board[i-1][j] !== 0) occupiedNeighbors++;

	if(i == board.length - 1 ) occupiedNeighbors++;
	else if(board[i+1][j] !== 0) occupiedNeighbors++;

	if(j == 0 ) occupiedNeighbors++;
	else if(board[i][j-1] !== 0) occupiedNeighbors++;

	if(j == board[i].length - 1 ) occupiedNeighbors++;
	else if(board[i][j+1] !== 0) occupiedNeighbors++;
	*/

	if(vertical){
		//isTopSafe
		if( j !== 0 ){
			if(board[i][j-1] !== 0) occupiedNeighbors++;
			if( i < board.length - 1 && board[i+1][j-1] !== 0) occupiedNeighbors++;
		}else{
			occupiedNeighbors+=2;
		}
		//isBottomSafe
		if( j !== board.length - 1){
			if(board[i][j+1] !== 0) occupiedNeighbors++;
			if( i < board.length - 1 && board[i+1][j+1] !== 0) occupiedNeighbors++;
		}else{
			occupiedNeighbors+=2;
		}
		

	}else{
		//isLeftSafe
		if( i !== 0 ){
			if(board[i-1][j] !== 0) occupiedNeighbors++;
			if( j < board.length - 1 && board[i-1][j+1] !== 0) occupiedNeighbors++;
		}else{
			occupiedNeighbors+=2;
		}
		//isRightSafe
		if( i !== board.length - 1){
			if(board[i+1][j] !== 0) occupiedNeighbors++;
			if( j < board.length - 1 && board[i+1][j+1] !== 0) occupiedNeighbors++;
		}else{
			occupiedNeighbors+=2;
		}

	}

	return occupiedNeighbors == 4;

}

function undo(){
	game.undoMove();
	game.display(ctx, WIDTH, HEIGHT);
}

undo();