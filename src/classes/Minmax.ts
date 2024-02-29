import Domineering from "./Domineering";

class Minmax {
    alphaBeta:boolean;
    evalFunc:Function;
    constructor(alphaBeta:boolean,evalFunc:Function){
        this.alphaBeta = alphaBeta;
        this.evalFunc = evalFunc;
    }

    private copyArray(arr:unknown[]):unknown[]{
        return arr.map((x) => Array.isArray(x) ? this.copyArray(x) : x);
    }

    apply(state:Domineering,depth:number,maximizing:boolean = true){
        if(depth===0 || state.isGameOver()){
            return this.evalFunc(state);
        }

        let board = state.getBoard()

        for(let i = 0; i < board.length; i++){
            for(let j = 0; j < board.length; j++){
                
                
                
            }
        }

        

    }
}

export default Minmax;