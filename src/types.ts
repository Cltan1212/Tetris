export { Viewport, Constants, Block, tetrominoShapes}
export type { Key, Event, State, Action, Grid}
import { Pos } from "./util";

//////////////// CONSTANT FOR VIEW //////////////////////
const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 80,
  } as const;
  
//////////////// CONSTANT FOR GAME LOGIC //////////////////////
const Constants = {
    TICK_RATE_MS: 100,
    TICK_RATE_INCREASE: 5,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20,
    STARTX: 4,
    STARTY: 1
  } as const;

const Block = {
    WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
    HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

//////////////// KEYBOARD INPUT TYPE //////////////////////
type Key = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "KeyP" | "KeyZ" | "ArrowDown" | "Space" | "KeyR" ;

type Event = "keydown" | "keyup" | "keypress";

//////////////// GAME TYPE //////////////////////
/** <--------- every object that participates in physics is a Grid ---------->*/
type Grid = {
    position: Pos,
    color: string
    rotatable: boolean,
    wallKick: boolean,
    floorKick: boolean
}

/** <--------- game state ---------->*/
type State = Readonly<{
    level: number,
    score: number,
    highscore: number,
    createTetro: boolean,
    tickRate: number,
    clearline: number,
    powerUp: number,
    tetromino: ReadonlyArray<Grid>,
    previewTetro:  ReadonlyArray<Grid>,
    hardDropTetro: ReadonlyArray<Grid>,
    blocks: ReadonlyArray<Grid>,
    gameEnd: boolean
  }>;

/** <--------- represents a type of an action ---------->*/
interface Action {
    apply(s: State): State;
  }

//////////////// CONSTANT FOR TETROMINO //////////////////////
const tetrominoShapes = [
    // Shape 1: O (Yellow)
    { shape: [[0, 0], [1, 0], [0, 1], [1, 1]], rotatable: false, wallKick: false, floorKick: false },

    // Shape 2: I (Blue)
    { shape: [[0, 0], [1, 0], [2, 0], [3, 0]], rotatable: true, wallKick: true, floorKick: true },  

    // Shape 3: L (Pink)
    { shape: [[0, 1], [1, 1], [2, 1], [2, 0]], rotatable: true, wallKick: true, floorKick: false },  

    // Shape 4: J (Dark Blue)
    { shape: [[2, 1], [1, 1], [0, 1], [0, 0 ]], rotatable: true, wallKick: true, floorKick: false },

    // Shape 5: T (Orange)
    { shape: [[0, 1], [1, 1], [2, 1], [1, 0]], rotatable: true, wallKick: true, floorKick: true },

    // Shape 6: S (Green)
    { shape: [[0, 1], [1, 1], [1, 0], [2, 0]], rotatable: true, wallKick: true, floorKick: false },

    // Shape 7: Z (Red)
    { shape: [[0, 0], [1, 0], [1, 1], [2, 1]], rotatable: true, wallKick: true, floorKick: false },
];