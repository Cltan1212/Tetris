export { render, gameover, restartButton, show, hide }
import { State } from "./types";
import { Viewport, Block, Grid } from "./types";


//////////////// GET ELEMENT //////////////////////
const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement & HTMLElement;
const preview = document.querySelector("#svgPreview") as SVGGraphicsElement & HTMLElement;
const gameover = document.querySelector("#gameOver") as SVGGraphicsElement & HTMLElement;
const container = document.querySelector("#main") as HTMLElement;
const restartButton = document.querySelector("#restartButton") as SVGGraphicsElement & HTMLElement;


//////////////// SET ATTRIBUTES //////////////////////
svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

// Text fields
const levelText = document.querySelector("#levelText") as HTMLElement;
const scoreText = document.querySelector("#scoreText") as HTMLElement;
const highScoreText = document.querySelector("#highScoreText") as HTMLElement;
const powerUpText = document.querySelector("#powerUpText") as HTMLElement;


//////////////// UTILITY RENDER FUNCTIONS //////////////////////
/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
    elem.setAttribute("visibility", "visible");
    elem.parentNode!.appendChild(elem);
  };
  
/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
    elem.setAttribute("visibility", "hidden");
  
/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {}
  ) => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
  };


//////////////// RENDERING //////////////////////
/**
 * Renders the current state to the canvas.
 *
 * In MVC terms, this updates the View using the Model.
 *
 * @param s Current state
 */
// render is update view
const render = (s: State) => {
  // check if the element exist
  if (!svg || !preview || !gameover || !container || !levelText || !scoreText || !highScoreText || !restartButton || !scoreText) return

  // clean the previous canvas
  svg.innerHTML = '';
  preview.innerHTML = '';

  // append the following button
  svg.appendChild(gameover);
  svg.appendChild(restartButton);

  // show text
  levelText.innerHTML = `${s.level}`;
  scoreText.innerHTML = `${s.score}`;
  highScoreText.innerHTML = `${s.highscore}`;
  powerUpText.innerHTML = `${s.powerUp}`

  // Add blocks to the main grid canvas
  const updateBlocks = (canvas: SVGGraphicsElement & HTMLElement, blocks: ReadonlyArray<Grid>, offsetX: number, offsetY: number) => {
    blocks.map((block) => createSvgElement(canvas.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.HEIGHT * (block.position.x + offsetX)}`,
      y: `${Block.WIDTH * (block.position.y + offsetY)}`,
      style: `fill: ${block.color}`,
    }))
    .map((block) => canvas.appendChild(block));
  };

  // Preview to the hard drop
  const previewHardDrop = (canvas: SVGGraphicsElement & HTMLElement, blocks: ReadonlyArray<Grid>) => {
    blocks.map((block) => createSvgElement(canvas.namespaceURI, "rect", {
      height: `${Block.HEIGHT}`,
      width: `${Block.WIDTH}`,
      x: `${Block.HEIGHT * (block.position.x - 1)}`,
      y: `${Block.WIDTH * (block.position.y - 1)}`,
      style: `fill: lightgrey; 
                stroke: grey; 
                stroke-width: 2px; `,
    }))
    .map((block) => canvas.appendChild(block));
  };

  // update view
  previewHardDrop(svg, s.hardDropTetro);
  updateBlocks(preview, s.previewTetro, -2, 0);
  updateBlocks(svg, s.tetromino, -1, -1);
  updateBlocks(svg, s.blocks, -1, -1);

  
};