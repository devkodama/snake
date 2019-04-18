//
// snake.js
//
//

var myGamePiece;
var myObstacles = [];
var myScore;


// Globals
var gameCanvas;
var playerSnake;


// Canvas is in screen pixels
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 480;

// Game is played on the grid
const GRID_SCALE = 10;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SCALE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SCALE;

//
const DEAD = 0;
const ALIVE = 1;

//
const SNAKE_HEAD_COLOR = "blue";
const SNAKE_BODY_COLOR = "red";
const SNAKE_LENGTH = 9;



// Utility class for (x, y) pairs

class Point {

  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  add(p) {
    return new Point(this.x + p.x, this.y + p.y);
  }

}


// Player snake class

class Snake {

  constructor(startpos, startvel, startlen=SNAKE_LENGTH) {
    this.pos = new Point(startpos.x, startpos.y);    // position of snake head
    this.vel = new Point(startvel.x, startvel.y);    // velocity of travel of snake head
    this.headcolor = SNAKE_HEAD_COLOR;
    this.bodycolor = SNAKE_BODY_COLOR;
    this.status = ALIVE;
    this.body = [ this.pos ];   // array of Points representing the coordinates of each body segment
                                // body[0] is the snake head position
    // now add body segments
    let direction = Math.floor(Math.random() * 4);
    let dx, dy;
    switch (direction) {
      case 0:
        dx=0;  dy=-1;
        break;
      case 1:
        dx=1;  dy=0;
        break;
      case 2:
        dx=0;  dy=1;
        break;
      case 3:
        dx=-1;  dy=0;
        break;
      default:
        dx=0;  dy=0;
    }
    let nextseg = this.pos;
    for (let i=1; i<startlen; i++) {
      nextseg = nextseg.add(new Point(dx,dy));
      this.body[i] = nextseg;
    }

    console.log("Snake:", this.pos, this.vel, this.color, this.status, this.body);
  }

  // advance the snake position based on it's velocity
  move(grow = false) {
    let newPoint;

    // calculate a new position for the snake head
    newPoint = this.body[0].add(this.vel);

    // wrap around
    if (newPoint.x < 0) {
      newPoint.x = GRID_WIDTH + newPoint.x;
    }
    if (newPoint.x >= GRID_WIDTH) {
      newPoint.x = newPoint.x - GRID_WIDTH;
    }
    if (newPoint.y < 0) {
      newPoint.y = GRID_HEIGHT + newPoint.y;
    }
    if (newPoint.y >= GRID_HEIGHT) {
      newPoint.y = newPoint.y - GRID_HEIGHT;
    }

    // add new head position to body coordinates array
    this.body.unshift(newPoint);

    // if not allowing the snake to grow, remove tail position to keep snake the same length
    if (!grow) {
      this.body.pop();
    }
  }

  // draw the snake on the global game canvas
  draw() {
    let p;

    let ctx = gameCanvas.context;

    // draw head and body segments
    ctx.fillStyle = this.headcolor;
    p = this.body[0];
    ctx.fillRect(p.x*GRID_SCALE, p.y*GRID_SCALE, GRID_SCALE, GRID_SCALE);

    ctx.fillStyle = this.bodycolor;
    for (let i=1; i<this.body.length; i++) {
      p = this.body[i];
      ctx.fillRect(p.x*GRID_SCALE, p.y*GRID_SCALE, GRID_SCALE, GRID_SCALE);
    }
  }

}



// Item class for objects that may appear on the screen

class Food {

  constructor(x=0, y=0) {
    this.pos = new Point(x, y);    // position of item
    this.vel = new Point(0, 0);    // velocity of item
    this.color = 0x802080;
    this.status = ALIVE;
  }

  // advance the item based on it's velocity
  move() {
    // update the new position
    this.pos.add(this.vel);
  }

  // draw the item on the canvas
  draw(canvas) {
    let cctx = canvas.context;

  }
  draw() {
    console.log(this.pos, this.vel, this.color, this.status, this.body);

  }

}


// GameGrid class for the game board

class GameGrid {

    constructor () {
      this.width = GRID_WIDTH;
      this.height = GRID_HEIGHT;
      for (let x=0; x<this.width; x++) {
        for (let y=0; y<this.height; y++) {
          this.grid[x][y] = 0;
        }
      }
    }

}



// Canvas class for the game board

class Canvas {

  // create html canvas and insert into DOM
  constructor () {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
  }

  // erases the canvas
  clear() {
    console.log("Clearing canvas...")
    this.context.fillStyle = "white";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

}


// called every interval to move snake and redraw canvas

function gameTick () {

    // Get control inputs

    // Update snake
    playerSnake.move();

    // Refresh canvas
    gameCanvas.clear();
    playerSnake.draw();
}



function startGame() {

  // create game canvas
  console.log("Creating game canvas...")
  gameCanvas = new Canvas();
  gameCanvas.clear();

  // Create player snake of appropriate length
  console.log("Creating player snake...")
  let startpos = new Point(GRID_WIDTH/2, GRID_HEIGHT/2);
  let startvel = new Point(1, 0);
  playerSnake = new Snake(startpos, startvel);    // head segment created by constructor

  // Start game loop
  gameCanvas.interval = setInterval(gameTick, 100);



  return;
}
