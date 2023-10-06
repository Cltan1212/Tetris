export { initialState, reduceState, Tick, Move, Rotate, Tetro, Restart, Movemax, PowerUp }
import { tetrominoShapes, Constants, Grid, State, Action } from "./types";
import { Pos } from "./util";


/////////////// INITIAL STATE SET UP////////////////////

/** <--------- condition of checking wallkicks ----------> */
const wallKicks = (tetromino: ReadonlyArray<Grid>) => [
    tetromino.map(block => ({ ...block, position: block.position.add(new Pos(1, 0))})),
    tetromino.map(block => ({ ...block, position: block.position.add(new Pos(2, 0))})),
    tetromino.map(block => ({ ...block, position: block.position.add(new Pos(-1, 0))})),
    tetromino.map(block => ({ ...block, position: block.position.add(new Pos(-2, 0))}))];

/** <--------- condition of checking floorkicks ----------> */
const floorKicks = (tetromino: ReadonlyArray<Grid>) => [
    tetromino.map(block => ({ ...block, position: block.position.add(new Pos(0, -1))})),
    tetromino.map(block => ({ ...block, position: block.position.add(new Pos(0, -2))}))]

/** <--------- function of creating tetromino ----------> */
const createTetromino = (position: Pos, num: number) : ReadonlyArray<Grid>  => {
    // get information from constant
    const { shape, rotatable, wallKick, floorKick } = tetrominoShapes[num - 1];  
    const colors = ['yellow', 'blue', 'pink', 'darkblue', 'orange', 'green', 'red'];
    const color = (shapeNumber: number): string  => colors[shapeNumber - 1];
    // return the created tetromino
    return shape.map(([dx, dy]) => ({
        position: new Pos(position.x + dx, position.y + dy),
        color: color(num),
        rotatable,
        wallKick, 
        floorKick
    }));
}

/** <--------- initial state when game start ----------> */
const initialState: State = {
    level: 0,
    score: 0,
    highscore: 0,
    tickRate: 0,
    createTetro: false,
    clearline:0,
    powerUp: 5,
    tetromino: createTetromino(new Pos(Constants.STARTX, Constants.STARTY), 1),
    previewTetro: createTetromino(new Pos(Constants.STARTX, Constants.STARTY), 2),
    hardDropTetro:[],
    blocks: [],
    gameEnd: false,
  } as const;

//////////////// STATE UPDATES //////////////////////
/** <--------- update state function ---------->*/
/**
 * state transducer
 * @param s input State
 * @param action type of action to apply to the State
 * @returns a new State 
 */
const reduceState = (s: State, action: Action): State => action.apply(s);

/** <--------- an action to create new tetromino ---------->*/
class Tetro implements Action {
    /**
     * @constructor
     * @param number - The number representing the type of tetromino.
     */
    constructor(public readonly number: number) {}

    /**
     * Applies the Tetro action to the game state.
     * @param {State} s - The current game state.
     * @returns {State} The updated game state after applying the action.
     */
    apply = (s: State): State => {
        // create new tetro based on the status of createTetro
        if (!s.createTetro) return s
        return {
            ...s,
            createTetro: false,
            tetromino: s.previewTetro,
            previewTetro: createTetromino(new Pos(Constants.STARTX, Constants.STARTY), this.number),
            blocks: [...s.blocks, ...s.tetromino.map(block => block)]
        }
    }
}

/** <--------- represents a game action to advance the game state by a tick ---------->*/
class Tick implements Action {
    /**
     * Applies the Tick action to the game state.
     * @param {State} s - The current game state.
     * @returns {State} The updated game state after applying the action.
     */
    apply = (s: State): State => {
        // tick rate is increase based on level (now the maximum level is 5 level)
        // i.e. at first (level 0) -> every five tick the block will drop down
        // every tick show the preview to the hard drop
        const hardDropAmount = moveDownAmount(s, s.tetromino);  // calculate hard drop amount

        if (s.tickRate === 0) {
            return { ...tick(s, {axis: 'y', amount: 1}), 
                    tickRate: s.level > 5 ?  0 : Constants.TICK_RATE_INCREASE - s.level,
                    hardDropTetro: moveTetro(s.tetromino, {axis: 'y', amount: hardDropAmount})};
        } else {
            return { ...s, tickRate: s.tickRate - 1, 
                hardDropTetro: moveTetro(s.tetromino, {axis: 'y', amount: hardDropAmount}) };
        }
    }
}

/** <--------- represents a game action to move the tetromino by one position ---------->*/
class Move implements Action {
    /**
     * @constructor
     * @param movement - The direction and amount of movement.
     */
    constructor(public readonly movement: { axis: 'x' | 'y', amount: number }) {}

    /**
     * Applies the Move action to the game state.
     * @param {State} s - The current game state.
     * @returns {State} The updated game state after applying the action.
     */
    apply = (s: State): State => { return s.gameEnd ? s: tick(s, this.movement)  } // allow movement when game is not End
}

/** <--------- represents a game action to move the tetromino to the movement ---------->*/
class Movemax implements Action {

    /**
     * Applies the Movemax action to the game state.
     * @param {State} s - The current game state.
     * @returns {State} The updated game state after applying the action.
     */
    apply = (s: State): State => {
        const moveAmount = moveDownAmount(s, s.tetromino);
        const newTetromino = moveTetro(s.tetromino, {axis: 'y', amount: moveAmount});
        return removeFullRow({...s,score: s.score + moveAmount + 1, tetromino: newTetromino});
    }
}

/** <--------- represents a game action to rotate a tetromino ---------->*/
class Rotate implements Action {
    /**
     * @constructor
     * @param direction - The direction of the rotation.
     */
    constructor(public readonly direction: number) {}

    /**
     * Applies the Rotation action to the game state.
     * @param {State} s - The current game state.
     * @returns {State} The updated game state after applying the action.
     */
    apply = (s: State): State => {
        // only the block is rotable can be rotated
        if (s.tetromino.some(block => !block.rotatable)) return s;
        // find the pivot and the new tetromino after rotating (rotate logic see util)
        const pivot = s.tetromino[1].position; 
        const newTetromino = s.tetromino.map(block => 
            ({...block, position: block.position.rotate(pivot)(this.direction)}));
        // check collision
        const collX = collisionX(s, newTetromino)
        const collY = collisionY(s, newTetromino)

        // rotate the tetromino if can
        if (!collX && !collY) return {...s, tetromino: newTetromino}
        
        // check for the floor kick 
        else if (collY &&  newTetromino[1].floorKick) {
            const validKickY = floorKicks(newTetromino).find(kick => !collisionX(s, kick) && !collisionY(s, kick));
            return validKickY ? { ...s, tetromino: validKickY } : s
        } 
        // check for the wall kick
        else if (collX && newTetromino[1].wallKick) {
            const validKickX = wallKicks(newTetromino).find(kick => !collisionX(s, kick) && !collisionY(s, kick));
            return validKickX ? { ...s, tetromino: validKickX } : s
        } 
        // worse case: cannot be rotate
        else return s
  }
}

/** <--------- represents a game action to restart the game ---------->*/
class Restart implements Action {
    /**
     * Applies the Restart action to the game state.
     * @param {State} s - The current game state.
     * @returns {State} The updated game state after applying the action.
     */
    apply = (s: State): State => { 
        return s.gameEnd ? {...initialState, highscore: s.score > s.highscore ? s.score : s.highscore} 
                            : {...initialState, highscore: s.highscore} } // restart before game end
}

/** <--------- represents a game action to power up ---------->*/
class PowerUp implements Action {
    /**
     * Applies the Power Up action to the game state.
     * @param s The current game state.
     * @returns The updated game state after applying the action.
     */
    apply = (s: State): State => {
        return s.powerUp && !s.gameEnd ? 
                        {...s, 
                        blocks: removingRow([Constants.GRID_HEIGHT], s.blocks),  // remove the last row
                        powerUp: s.powerUp - 1} 
                        : s
    }
}

//////////////// UTILITY STATE FUNCTIONS //////////////////////

/** <--------- represents a game tick ---------->*/
/**
 * A function to handle a game tick
 * @param s input state
 * @param movement the movement to be applied to the tetromino
 * @returns a new state 
 */
const tick = (s: State, movement: { axis: 'x' | 'y', amount: number }): State => {
    const newTetromino = moveTetro(s.tetromino, movement);
    const newState = handleCollision(s, newTetromino, movement);
    return removeFullRow(newState);
  };

/** <--------- represents a tetromino movement ---------->*/
/**
 * Represents a movement of tetromino
 * @param tetromino the tetromino to be moved
 * @param movement the movement to be applied to the tetromino
 * @returns a new tetromino with the new postion
 */
const moveTetro = (tetromino: ReadonlyArray<Grid>, movement: { axis: 'x' | 'y', amount: number }): ReadonlyArray<Grid> => {
    return tetromino.map(block => ({
        ...block,
        position: block.position.add(
            new Pos(movement.axis === 'x' ? movement.amount : 0, movement.axis === 'y' ? movement.amount : 0)
        ),
    }));
};

/** <--------- checking the final drop position movement ----------> */
/**
 * Check the final drop positon of the tetromino
 * @param s the current state
 * @param tetromino the tetromino to be checked
 * @returns the desired movement
 */
const moveDownAmount = (s: State, tetromino: ReadonlyArray<Grid>): number => {
    const newTetromino = moveTetro(tetromino, { axis: 'y', amount: 1 });
    return collisionY(s, newTetromino) ? 0 : 1 + moveDownAmount(s, newTetromino);
};

/** <--------- removing rows ---------->*/
/**
 * Represents a new block array after removing the row in a parameter
 * @param removeRow The rows to be removed
 * @param blocks The blocks to be checked and new position
 * @returns a new blocks after filtering and mapping
 */
const removingRow = (removeRow: ReadonlyArray<number>, blocks: ReadonlyArray<Grid>): ReadonlyArray<Grid> => {
    return blocks.filter(block => !removeRow.includes(block.position.y))
                 .map(block => ({
                    ...block,
                    position: new Pos(block.position.x, block.position.y 
                        + removeRow.filter(row => row > block.position.y).length)}))
} 

/** <--------- removing full rows ---------->*/
/**
 * Represents a new state after removing the full rows inside the grid
 * @param s input state
 * @returns a new state 
 */
const removeFullRow = (s:State): State => {
    // find all the full rows in current state to an arrays
    const findFullRows = (blocks: ReadonlyArray<Grid>): ReadonlyArray<number> => {
        const allRows = Array(Constants.GRID_HEIGHT).fill(null).map((_, index) => index + 1);
        const isRowFull = (row: number) => blocks.filter(block => block.position.y === row).length === Constants.GRID_WIDTH;
        return allRows.filter(isRowFull);
    };
    
    const fullRows = findFullRows(s.blocks);
    // calculate the score
    const calculateScore = (length: number): number => {
        if (length === 1) return 40;
        else if (length === 2) return 100;
        else if (length === 3) return 300;
        else if (length === 4) return 1200;
        else return 0;
    }

    const newLevel =  Math.floor((s.clearline)/10);
    // state update
    return {
        ...s,
        level: newLevel, // level up after clearing every 10 rows
        powerUp: s.level === newLevel ? s.powerUp : s.powerUp + 1,  // add power up when the level up
        clearline: s.clearline + fullRows.length,
        blocks: removingRow(fullRows, s.blocks),
        score: s.score + calculateScore(fullRows.length),
    };
  }

//////////////// HANDLE COLLISION //////////////////////
/** <--------- collision with X boundaries ---------->*/
/**
 * Checking if the tetromino is collide with X boundaries
 * @param s input state
 * @param newTetromino the tetromino to be checked
 * @returns if the tetromino collide to the X boundaries
 */
const collisionX = (s: State, newTetromino: ReadonlyArray<Grid>): boolean => {
    return newTetromino.some(block => {
        const newPos = block.position.x - 1;
        return newPos < 0 || newPos >= Constants.GRID_WIDTH || collidesWithOtherBlocks(s, newTetromino);
    })};

/** <--------- collision with Y boundaries ---------->*/
/**
 * Checking if the tetromino is collide with Y boundaries
 * @param s input state
 * @param newTetromino the tetromino to be checked
 * @returns if the tetromino collide to the Y boundaries
 */
const collisionY = (s: State, newTetromino: ReadonlyArray<Grid>): boolean => {
    return newTetromino.some(block => {
        const newPos = block.position.y - 1;
        return newPos <= 0 || newPos >= Constants.GRID_HEIGHT ||collidesWithOtherBlocks(s, newTetromino);
    })
};

/** <--------- collision with other blocks ---------->*/
/**
 * Checking if the tetromino is collide with other existing blocks
 * @param s input state
 * @param newTetromino the tetromino to be checked
 * @returns if the tetromino is collided with other blocks
 */
const collidesWithOtherBlocks = (s: State, newTetromino: ReadonlyArray<Grid>): boolean => {
    return newTetromino.some((block) => {
        return s.blocks.some((existingBlock) => {
            return (block.position.x === existingBlock.position.x 
                && block.position.y === existingBlock.position.y);
        });
    });
  };

/** <--------- main handle collision logic ---------->*/
/**
 * Handle different collision based on the movement
 * @param s input state
 * @param newTetromino the tetromino to be checked
 * @param movement the movement of current tetromino
 * @returns a new state
 */
const handleCollision = (s: State, newTetromino: ReadonlyArray<Grid>, movement: { axis: 'x' | 'y', amount: number }): State => {
    const isGameEnd = movement.axis === 'y' 
                    && s.tetromino.some(block => block.position.y <= 1 ) 
                    && collidesWithOtherBlocks(s, newTetromino);
    if (isGameEnd) return {...s,gameEnd: true}  
    else if (collisionX(s, newTetromino) && movement.axis === "x") return s
    else if (collisionY(s, newTetromino)  && movement.axis === "y") return {...s,createTetro: true}
    else return {...s, tetromino: moveTetro(s.tetromino, movement)}
    };
  