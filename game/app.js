//
const STEP = 50;
initGame( document.querySelector("#gameCanvas") );
//
function initGame(canvas){
	vertical = true ;
	game = [
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
	canvas.width = STEP*8+1 ;
	canvas.height = STEP*8+1 ;
	ctx = canvas.getContext("2d")
	
	//draw the grid
	for(let i = 0; i <= 8; i++ ){
		ctx.moveTo(i*STEP+0.5,0.5);
		ctx.lineTo(i*STEP+0.5,STEP*8+0.5)
	}
	for(let i = 0; i <= 8; i++ ){
		ctx.moveTo(0.5,i*STEP+0.5);
		ctx.lineTo(STEP*8+0.5,i*STEP+0.5)
	}
	ctx.strokeStyle = "#000"
	ctx.stroke()
	canvas.addEventListener("click",(e)=>{
		updateGame(e)
	},false)
}
//
function updateGame(event){
	let col = Math.floor(event.pageX / STEP);
	let row = Math.floor(event.pageY / STEP);
	console.log("You clicked : { "+row+" , "+col+" }\nisPossible = " + isPossible(row,col,vertical) )
	if(isPossible(row,col,vertical)){
		draw(col,row,vertical);
		if(check_end(vertical)){
			endGame(vertical);
		}
		vertical = !vertical ;
	}
}
//
function check_end(){
	for(i = 0;i<8;i++){
		for(j = 0; j < 8; j++){
			if( game[i][j]==0){
				if( (i<7 && game[i+1][j]==0) || (i>0 && game[i-1][j]==0) || (j<7 && game[i][j+1]==0) || (j>0 && game[i][j-1]==0) ){
					return false ;
				}
			}
		}
	}
	return true ;
}
//
function endGame(vertical){
	alert(vertical?"V is a winner .":"H is a winner .")
}
//
function draw(col,row,vertical){
	ctx.fillStyle = vertical ? "#ff0000" : "#0000ff";
	ctx.fillRect(STEP * col + 0.5 ,STEP * row + 0.5, (vertical ? STEP : STEP*2) - 0.5, (vertical?STEP*2:STEP) - 0.5);
	game[row][col] = 1 ;
	game[vertical ? (row + 1) : row][vertical ? (col): (col + 1)] = 1 ;
	console.log("x = "+col+"\ny = "+row)
	txt=""
	for(i=0;i<8;i++){
		for(j=0;j<8;j++){
			txt += " "+game[i][j]+" ,";
		}
		txt += "\n"
	}
	console.log(txt)
	
}
//
function isPossible(row,col,vertical){
	if(game[row][col]==1){
		return false ;
	}
	if(vertical && row+1>7){
		return false ;
	}
	if(!vertical && col+1>7){
		return false ;
	}
	if(vertical && game[row + 1][col] == 1){
		return false ;
	}
	if(!vertical && game[row][col + 1] == 1){
		return false ;
	}
	return true ;
}