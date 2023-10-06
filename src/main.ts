import "./style.css";
import { scan } from "rxjs/operators";
import { ReplaySubject } from "rxjs";
import { event$ } from "./observable";
import { State } from "./types";
import { initialState, reduceState } from "./state";
import { render,show, hide, gameover, restartButton} from "./view";

// this is not completed -> instant replay
// const replay = new ReplaySubject<State>()
// const startReplay = () => {
//   replay.subscribe((replayedState) => {
//     console.log(replayedState)
//     render(replayedState)
//   });
// };

/** 
 * Main game loop
 */
export function main() {

  const source$ = event$.pipe(
    // ignore this part -> instant replay
    // scan((currentState, action) => {
    //   replay.next(currentState)
    //   return reduceState(currentState, action)
    // }, initialState)
    scan(reduceState, initialState) // accumulate the new state
  ).subscribe((s: State) => {
    render(s);
    if (s.gameEnd) {
      // startReplay()
      show(gameover);
      show(restartButton)
    } else {
      hide(gameover);
      hide(restartButton);
    } 
  });

}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
