//
// snake.js
//
// A snake game
//



// Globals

var gameCanvas;
var gameController;
var playerSnake;
var playerScore;
var foodItems;
var gotItemSound;


//
const UPDATE_INTERVAL = 40;      // in milliseconds

// Canvas is in screen pixels
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 480;

// Game is played on a grid
const GRID_SCALE = 30;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SCALE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SCALE;

// Scoreboard constants
const SCORE_FONT = '20px Arial Black';
const SCORE_COLOR = 'black';

// Snake constants
const SNAKE_HEAD_COLOR = 'blue';
const SNAKE_BODY_COLOR = 'green';
const SNAKE_WIDTH = 1;    // in grid units
const SNAKE_HEIGHT = 1;   // in grid units
const SNAKE_LENGTH = 20;
const SNAKE_VELOCITY_SCALE = 0.2;

// Food constants
//   width and height are dimensions of food item in grid units
//   points is score value of food item
const FOOD_MENU = {
  "donut_blueberry_polka_dot": { width: 1, height: 1, points: 20 },
  "donut_chocolate_confetti": { width: 1, height: 1, points: 10 },
  "donut_chocolate_sprinkle": { width: 1, height: 1, points: 10 },
  "donut_frosted_vanilla": { width: 1, height: 1, points: 10 },
  "donut_glazed": { width: 1, height: 1, points: 10 },
  "donut_lemon_sprinkle": { width: 1, height: 1, points: 20 },
  "donut_pistachio": { width: 1, height: 1, points: 30 },
  "donut_strawberry_chocolate_striped": { width: 1, height: 1, points: 20 },
  "donut_strawberry_coconut": { width: 1, height: 1, points: 10 },
};
const FOOD_GRID_SPACING = 0.25;


// Snake and food statuses
const DEAD = 0;
const ALIVE = 1;
const EATEN = 2;

// Misc constants
const UP = 0;
const RIGHT = 1;
const DOWN = 2;
const LEFT = 3;

// Key codes
const KEY_UP_ARROW = 38;
const KEY_DOWN_ARROW = 40;
const KEY_LEFT_ARROW = 37;
const KEY_RIGHT_ARROW = 39;




// Utility class for (x, y) pairs

class Point {

  constructor(x, y) {
    this.x = x || 0;
    this.y = y || 0;
  }

  // Adds the point p and returns a new Point object
  add(pt) {
    return new Point(this.x + pt.x, this.y + pt.y);
  }

  // restrict points to on-canvas coordiantes by wrap around
  // if this.x < 0 or this.x >= CANVAS_WIDTH, make it wrap around
  // if this.y < 0 or this.y >= CANVAS_HEIGHT, make it wrap around
  wrapToCanvas() {
    if (this.x < 0) {
      this.x += CANVAS_WIDTH;
    } else if (this.x >= CANVAS_WIDTH) {
      this.x -= CANVAS_WIDTH;
    }
    if (this.y < 0) {
      this.y += CANVAS_HEIGHT;
    } else if (this.y >= CANVAS_HEIGHT) {
      this.y -= CANVAS_HEIGHT;
    }
  }

  // restrict points to on-GRID_SCALE coordiantes by wrap around
  // if this.x < 0 or this.x >= GRID_WIDTH, make it wrap around
  // if this.y < 0 or this.y >= GRID_HEIGHT, make it wrap around
  wrapToGrid() {
    if (this.x < 0) {
      this.x += GRID_WIDTH;
    } else if (this.x >= GRID_WIDTH) {
      this.x -= GRID_WIDTH;
    }
    if (this.y < 0) {
      this.y += GRID_HEIGHT;
    } else if (this.y >= GRID_HEIGHT) {
      this.y -= GRID_HEIGHT;
    }
  }

}


// Sound class
class Sound {

  constructor(name,src) {
    this.name = name;
    this.audio = document.createElement("audio");
    this.audio.setAttribute("id", name);
    this.audio.src = src;
    this.audio.setAttribute("preload", "auto");
    this.audio.setAttribute("controls", "none");
    this.audio.style.display = "none";
    document.body.appendChild(this.audio);
  }

  // start playing the sound
  play() {
    let audio = document.getElementById(this.name);
    audio.currentTime = 0;
    audio.play();
  }

  // stop playing the sound
  stop() {
    this.audio.pause();
  }

}



// Player snake class

class Snake {

  constructor(startpos, startlen=SNAKE_LENGTH) {
    this.pos = new Point(startpos.x, startpos.y);    // position of snake head
    this.headcolor = SNAKE_HEAD_COLOR;
    this.bodycolor = SNAKE_BODY_COLOR;
    this.width = SNAKE_WIDTH;
    this.height = SNAKE_HEIGHT;
    this.status = ALIVE;
    this.growthenergy = 0;

    this.body = [ this.pos ];   // array of Points representing the coordinates of each body segment
                                // body[0] is the snake head position

    // now add on body segments and set initial velocity
    let direction = Math.floor(Math.random() * 4);
    let dx, dy;
    switch (direction) {
      case 0:
        dx = 0;  dy = -1;
        this.vel = new Point(0, 1 * SNAKE_VELOCITY_SCALE);
        this.heading = DOWN;
        break;
      case 1:
        dx = 1;  dy = 0;
        this.vel = new Point(-1 * SNAKE_VELOCITY_SCALE, 0);
        this.heading = LEFT;
        break;
      case 2:
        dx = 0;  dy = 1;
        this.vel = new Point(0, -1 * SNAKE_VELOCITY_SCALE);
        this.heading = UP;
        break;
      case 3:
        dx = -1;  dy = 0;
        this.vel = new Point(1 * SNAKE_VELOCITY_SCALE, 0);
        this.heading = RIGHT;
        break;
      default:
        // should never get here
        console.log('error: Error in setting initial direction')
    }
    let nextseg = this.pos;
    for (let i=1; i<startlen; i++) {
      nextseg = nextseg.add(new Point(dx,dy));
      this.body[i] = nextseg;
    }
  }

  // change the snake velocity based on the specified direction
  // the snake cannot turn 180 degrees, so need to check current heading
  // before changing directions
  steer(direction) {
    let heading;

    // change snake direction
    heading = this.heading;
    switch (direction) {
      case UP:
        if (heading != DOWN) {
          playerSnake.vel.x = 0;
          playerSnake.vel.y = -1 * SNAKE_VELOCITY_SCALE;
          this.heading = UP;
        }
        break;
      case DOWN:
        if (heading != UP) {
          playerSnake.vel.x = 0;
          playerSnake.vel.y = 1 * SNAKE_VELOCITY_SCALE;
          this.heading = DOWN;
        }
        break;
      case LEFT:
        if (heading != RIGHT) {
          playerSnake.vel.x = -1 * SNAKE_VELOCITY_SCALE;
          playerSnake.vel.y = 0;
          this.heading = LEFT;
        }
        break;
      case RIGHT:
        if (heading != LEFT) {
          playerSnake.vel.x = 1 * SNAKE_VELOCITY_SCALE;
          playerSnake.vel.y = 0;
          this.heading = RIGHT;
        }
        break;
      default:
        // no valid direction, maintain previous velocity
    }
  }

  // update the snake position based on its velocity
  update(grow = false) {
    let newPoint;

    // calculate a new position for the snake head
    newPoint = this.body[0].add(this.vel);

    // handle wrap around
    newPoint.wrapToGrid();

    // add new head position to front of body coordinates array
    this.body.unshift(newPoint);

    // snake automatically grows if it has positive growthenergy
    // if not allowing the snake to grow, remove tail position to keep snake the same length
    if (this.growthenergy > 0) {
      this.growthenergy -= 1;
    } else if (!grow) {
      this.body.pop();
    }
  }

  // check for collision of snake head with position pos
  collision(item) {
    let head;
    let itemprops;
    let hx, hy;
    let fx, fy;
    let posx0, posy0;
    let posx1, posy1;

    if (item.status == EATEN) {
      console.log('warning: checking for collision with eaten item')
      return false;
    }

    // (posx0, posy0) and (posx1, posy1) define a bounding box within which the
    // food item location (origin) must fall to collide
    itemprops = FOOD_MENU[item.type];
    fx = item.pos.x;
    fy = item.pos.y;

    head = this.body[0];
    hx = head.x;
    hy = head.y;

    if (hx < 1 && fx >= GRID_WIDTH - 1) {
      fx -= GRID_WIDTH;
    }
    if (hy < 1 && fy >= GRID_HEIGHT - 1) {
      fy -= GRID_HEIGHT;
    }
    if (hx >= GRID_WIDTH - 1 && fx < 1) {
      fx += GRID_WIDTH;
    }
    if (hy >= GRID_HEIGHT - 1 && fy < 1) {
      fy += GRID_HEIGHT;
    }
    posx0 = hx - itemprops.width;
    posx1 = hx + this.width;
    posy0 = hy - itemprops.height;
    posy1 = hy + this.height;

    if (fx > posx0 && fx < posx1 && fy > posy0 && fy < posy1) {
        return true;
    }

    // if the

    return false;
  }

  // old collision check
  // checks for exact collision with position pos.x and pos.y only
  collision_old(item) {
    if (item.status == EATEN) {
      return false;
    }
    for (let i=0; i<this.body.length; i++) {
      if (this.body[i].x == item.pos.x && this.body[i].y == item.pos.y) {
        return true;
      }
    }
    return false;
  }

  // draw the snake on the global game canvas
  // if the snake extends past the last row or column, need to also draw the part that wraps around
  draw() {
    let p;
    let x, y;
    let wrap;

    // get the canvas context
    let ctx = gameCanvas.context;

    // draw body then head segments
    ctx.fillStyle = this.bodycolor;
    for (let i=1; i<this.body.length; i++) {
      p = this.body[i];
      ctx.fillRect(p.x*GRID_SCALE, p.y*GRID_SCALE, GRID_SCALE, GRID_SCALE);
    }
    p = this.body[0];
    x = p.x;
    y = p.y;

    ctx.fillStyle = this.headcolor;
    ctx.fillRect(x * GRID_SCALE, y * GRID_SCALE, GRID_SCALE, GRID_SCALE);

    // if wraparound, draw again
    wrap = false;
    if (x > GRID_WIDTH - 1) {
      x -= GRID_WIDTH;
      wrap = true;
    }
    if (y > GRID_HEIGHT - 1) {
      y -= GRID_HEIGHT;
      wrap = true;
    }
    if (wrap) {
      ctx.fillRect(x * GRID_SCALE, y * GRID_SCALE, GRID_SCALE, GRID_SCALE);
    }

  }

}


// Food item class

class Food {

  constructor(x=-1, y=-1, type=null) {
    this.birth = Date.now();
    this.status = ALIVE;

    // set the food type, or select one at random if not specified
    if (!(type in FOOD_MENU)) {
      let menukeys = Object.keys(FOOD_MENU);
      type = menukeys[Math.floor(Math.random() * menukeys.length)];
//      console.log(type);
    }
    this.type = type;

    // load image for the food type
    this.image = new Image();
    this.image.src = 'assets/' + this.type + '.png';

    // use x, y (grid coordinates) if specified, otherwise random position
    if (x >= 0 && y >= 0) {
      this.pos = new Point(x);
    } else {
      // calculate random position
      x = Math.floor(1 + Math.random()*(GRID_WIDTH/FOOD_GRID_SPACING));
      y = Math.floor(1 + Math.random()*(GRID_HEIGHT/FOOD_GRID_SPACING));
      this.pos = new Point(x * FOOD_GRID_SPACING, y * FOOD_GRID_SPACING);    // position of item
    }
    this.pos.wrapToGrid();        // wraparound

    // make sure it isn't too close to the Snake
    // TODO

  }

  // update the food item
  update() {
    // move its position
    // etc.
  }

  // food item gets eaten
  // return points
  eat() {
    let foodprops = FOOD_MENU[this.type];

    this.status = EATEN;
    gotItemSound.play();

    return foodprops.points;
  }

  // draw the food item on the global game canvas
  // only draw active items
  draw() {
    let p;
    let x, y;
    let wrap;

    // don't draw things that have been eaten
    if (this.status == EATEN) {
      return;
    }
    // get the canvas context
    let ctx = gameCanvas.context;

    // draw it
    p = this.pos;
    x = p.x;
    y = p.y;
    ctx.drawImage(this.image, x*GRID_SCALE, y*GRID_SCALE, GRID_SCALE, GRID_SCALE);

    // if wraparound, draw again
    wrap = false;
    if (x > GRID_WIDTH - 1) {
      x -= GRID_WIDTH;
      wrap = true;
    }
    if (y > GRID_HEIGHT - 1) {
      y -= GRID_HEIGHT;
      wrap = true;
    }
    if (wrap) {
      ctx.drawImage(this.image, x*GRID_SCALE, y*GRID_SCALE, GRID_SCALE, GRID_SCALE);
    }

  }

}


// Player score class

class Score {

    constructor () {
      this.score = 0;
      this.pos = new Point(25, 35);
    }

    add (points) {
      this.score += points;
    }

    draw () {

      // get the canvas context
      let ctx = gameCanvas.context;

      ctx.font = SCORE_FONT;
      ctx.fillStyle = SCORE_COLOR;
      ctx.fillText( 'Score: ' + this.score, this.pos.x, this.pos.y);
    }
}




// GameGrid class for the game board
// not being used

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
    // load background image
    this.backgroundimage = new Image();
    this.backgroundimage.src = "assets/background.png"

  }

  // erase the canvas and draw background
  clear() {
    this.context.fillStyle = "white";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.backgroundimage, 0, 0, this.canvas.width, this.canvas.height);
  }

}

// Game controller input class

class Controller {

  // initial game controls
  constructor() {
    this.key = [];
    this.lastkey = null;
    this.prevkey = null;

  }

  direction () {
    switch (this.lastkey) {
      case 'ArrowUp':
        return UP;
        break;
      case 'ArrowDown':
        return DOWN;
        break;
      case 'ArrowLeft':
        return LEFT;
        break;
      case 'ArrowRight':
        return RIGHT;
        break;
      default:
        return null;
    }
  }

}



// called every interval to move snake and redraw canvas

function gameTick () {
  let points;

  // Update existing food items
  for (let i=0; i<foodItems.length; i++) {
    foodItems[i].update();
  }

  // Add some new food items randomly
  if (Math.random() < 0.10 ) {
    foodItems.push(new Food());
  }

  // Use controller input to change snake direction
  playerSnake.steer(gameController.direction());

  // Update snake position
  playerSnake.update();

  // check for snake collisions with items in foodItems
  for (let i=0; i<foodItems.length; i++) {
    if (playerSnake.collision(foodItems[i])) {
      points = foodItems[i].eat();
      playerScore.add(points);
      playerSnake.growthenergy += points/10;

      // remove the eaten item from foodItems array
      foodItems.splice(i,1);

      console.log(playerScore, playerSnake.growthenergy);
    }
  }

  // Refresh canvas
  gameCanvas.clear();
  for (let i=0; i<foodItems.length; i++) {
    foodItems[i].draw();
  }
  playerSnake.draw();
  playerScore.draw();

}




// This is called by the browser to start the game

function startGame() {

  // create game canvas
  console.log("Creating game canvas...")
  gameCanvas = new Canvas();
  gameCanvas.clear();

  // Create game controller object
  gameController = new Controller();

  // Add event listeners for key presses
  window.addEventListener('keydown', function (e) {
    gameController.key[e.keyCode] = true;
    gameController.prevkey = gameController.lastkey;
    gameController.lastkey = e.key;
  })
  window.addEventListener('keyup', function (e) {
    gameController.key[e.keyCode] = false;
  })

  // load sounds
  gotItemSound = new Sound('gotitem', 'assets/eat.wav');

  // Create score Object
  playerScore = new Score();

  // Create player snake of appropriate length
  console.log("Creating player snake...")
  let startpos = new Point(GRID_WIDTH/2, GRID_HEIGHT/2);
  playerSnake = new Snake(startpos);    // head segment created by constructor

  // Create global foodItems array
  foodItems = [];

  // Start game loop
  gameCanvas.interval = setInterval(gameTick, UPDATE_INTERVAL);

  return;
}
