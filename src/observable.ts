
export { event$ }
import { fromEvent, interval, merge, timer} from "rxjs";
import { map, filter, scan, takeUntil, exhaustMap } from "rxjs/operators";
import {  Constants, Key, Event} from "./types";
import { Rotate, Move, Tick, Tetro, Restart, Movemax, PowerUp } from "./state";
import { RNG } from "./util";

//////////////// STREAM FROM KEYBOARD EVENT //////////////////////
const key$ = (event: Event) => fromEvent<KeyboardEvent>(document, event);
const fromKey = (event: Event, keyCode: Key) => key$(event).pipe(filter(({ code }) => code === keyCode));
const rng$ = (seed: number) => interval(Constants.TICK_RATE_MS).pipe(scan((state) => RNG.hash(state), seed), map(seed => RNG.scale(seed)))

//////////////// KEY //////////////////////
const left$                     = fromKey("keydown", "ArrowLeft").pipe(map(_ => new Move({axis: 'x', amount: -1})));
const right$                    = fromKey("keydown", "ArrowRight").pipe(map(_ => new Move({axis: 'x', amount: 1})));
const rotateClockwise$          = fromKey("keydown", "ArrowUp").pipe(map(_ => new Rotate(1)));
const rotateCounterClockwise$   = fromKey("keypress", "KeyZ").pipe(map(_ => new Rotate(-1)));
const dropSoft$                 = fromKey("keydown", "ArrowDown").pipe(map(_ => new Move({axis: 'y', amount: 1})));
const dropHard$                 = fromKey("keypress", "Space").pipe(map(_ => new Movemax()));
const createTetro$              = rng$(Math.floor(Math.random())).pipe(map(num => new Tetro(num)))
const restartButton$ = fromKey("keydown", "KeyR").pipe(
    exhaustMap(() => timer(2000).pipe(  // hold two seconds
        map(() => new Restart()),
        takeUntil(fromKey("keyup", "KeyR")))));
const powerUp$                  = fromKey("keypress", "KeyP").pipe(map((_) => new PowerUp()));
const tick$                     = interval(Constants.TICK_RATE_MS).pipe(map((_) => new Tick()));

//////////////// MERGING ALL STREAMS //////////////////////
const event$ = merge(
    powerUp$,
    restartButton$,
    tick$,
    createTetro$,
    left$,
    right$,
    dropSoft$,
    rotateClockwise$,
    rotateCounterClockwise$,
    dropHard$
  )
