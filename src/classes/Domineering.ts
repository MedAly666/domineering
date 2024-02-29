interface DomineeringProps {
    verticalColor: string;
    horizontalColor: string;
}
interface Move {
    vertical:boolean,
    i:number,
    j:number
}
class Domineering {
    private board: (0|1|2)[][]; // 0 = empty, 1 = player vertical, 2 = player horizontal
    private vertical: boolean;
    private verticalColor: string;
    private horizontalColor: string;
    private moves:Move[]

    constructor(n: number = 8,props?:DomineeringProps) {
        this.board = new Array(n).fill(0).map(() => new Array(n).fill(0));
        this.vertical = true;
        this.verticalColor = props?.verticalColor || 'blue';
        this.horizontalColor = props?.horizontalColor || 'red';
        this.moves = [];
    }

    public isVertical(): boolean {
        return this.vertical;
    }

    public undoMove(){
        let move = this.moves.pop();
        if(move){
            //console.log(move);
            
            this.board[move.i][move.j] = 0;
            this.board[move.i + +move.vertical][move.j + +!move.vertical] = 0;
            this.vertical = move.vertical;
        }
    }

    /**
     * Getter function that return a copy of the current board.
     * 
     * @returns the board .
     */
    public getBoard(): (0|1|2)[][] {
        return this.board.map((x) => x.map((y) => y));
    }

    /**
     * Function to make a move in the game
     * 
     * @param row number
     * @param col number
     * @returns if the move was successful
     */
    public move(row: number, col: number): boolean {
        if(this.vertical){
            if(row === this.board.length - 1){
                return false;
            } else {
                if(this.board[row][col] === 0 && this.board[row + 1][col] === 0){
                    this.play(row, col);
                }
                return true;
            }
        } else {
            if(col === this.board.length - 1){
                return false;
            } else {
                if(this.board[row][col] === 0 && this.board[row][col + 1] === 0){
                    this.play(row, col);
                }
                return true;
            }
        }
    }

    /**
     * Function that actually makes the move
     * @param row 
     * @param col 
     */
    private play(row: number, col: number): void {
        this.board[row][col] = this.vertical ? 1 : 2;
        this.board[row + (this.vertical?1:0)][col + (this.vertical?0:1)] = this.vertical ? 1 : 2;
        this.moves.push({vertical:this.vertical,i:row,j:col});
        this.vertical = !this.vertical;
        
    }

    /**
     * Function to check if the game is over
     * @returns if the game is over
     */
    public isGameOver(): boolean {
        if(this.vertical){
            for(let i = 0; i < this.board.length - 1; i++){
                for(let j = 0; j < this.board.length ; j++){
                    if(this.board[i][j] === 0 && this.board[i + 1][j] === 0){
                        return false;
                    }
                }
            }
        }else{
            for(let i = 0; i < this.board.length ; i++){
                for(let j = 0; j < this.board.length - 1; j++){
                    if(this.board[i][j] === 0 && this.board[i][j + 1] === 0){
                        return false;
                    }
                }
            }
        }

        return true;
    }


    /**
     * 
     * @returns the score of the winner of the game
     */
    public calculateScore(): number {
        let score = 1;
        for(let i = 0; i < this.board.length; i++){
            for(let j = 0; j < this.board.length; j++){
                if( this.board[i][j] === 0 ){
                    score++;
                }
            }
        }
        return score;
    }
    
    display(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.beginPath();
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.closePath();
        ctx.beginPath();
        let step = width / this.board.length;
        for(let i = 0; i < this.board.length; i++){
            for(let j = 0; j < this.board.length; j++){
                if(this.board[i][j] === 1){
                    ctx.fillStyle = this.verticalColor;
                    ctx.fillRect(j * step, i * step, step, step);
                } else if(this.board[i][j] === 2){
                    ctx.fillStyle = this.horizontalColor;
                    ctx.fillRect(j * step, i * step, step, step);
                }else{
                    ctx.strokeStyle = '#000000';
                    ctx.rect(j * step, i * step, step, step);
                    ctx.stroke();
                }
            }
        } 
    }
}

export default Domineering;