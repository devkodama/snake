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
const UPDATE_INTERVAL = 100;      // in milliseconds

// Canvas is in screen pixels
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 480;

// Game is played on a grid
const GRID_SCALE = 30;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SCALE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SCALE;

// Scoreboard constants
const SCORE_FONT = '30px Consolas';
const SCORE_COLOR = 'black';

// Snake constants
const SNAKE_HEAD_COLOR = 'blue';
const SNAKE_BODY_COLOR = 'green';
const SNAKE_LENGTH = 9;
const SNAKE_VELOCITY_SCALE = 0.5;

// Food constants
const FOOD_MENU = {
  "donut_blueberry_polka_dot": { points: 20 },
  "donut_chocolate_confetti": { points: 10 },
  "donut_chocolate_sprinkle": { points: 10 },
  "donut_frosted_vanilla": { points: 10 },
  "donut_glazed": { points: 10 },
  "donut_lemon_sprinkle": { points: 20 },
  "donut_pistachio": { points: 30 },
  "donut_strawberry_chocolate_striped": { points: 20 },
  "donut_strawberry_coconut": { points: 10 },
};


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
  add(p) {
    return new Point(this.x + p.x, this.y + p.y);
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
        console.log('Error in setting initial direction')
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

    // snake automatically grows if it has positive growthenergy
    // if not allowing the snake to grow, remove tail position to keep snake the same length
    if (this.growthenergy > 0) {
      this.growthenergy -= 1;
    } else if (!grow) {
      this.body.pop();
    }
  }

  // check for collisions with position pos
  collision(item) {
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
  draw() {
    let p;

    // get the canvas context
    let ctx = gameCanvas.context;

    // draw body then head segments
    ctx.fillStyle = this.bodycolor;
    for (let i=1; i<this.body.length; i++) {
      p = this.body[i];
      ctx.fillRect(p.x*GRID_SCALE, p.y*GRID_SCALE, GRID_SCALE, GRID_SCALE);
    }
    ctx.fillStyle = this.headcolor;
    p = this.body[0];
    ctx.fillRect(p.x*GRID_SCALE, p.y*GRID_SCALE, GRID_SCALE, GRID_SCALE);
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
      console.log(type);
    }
    this.type = type;


    // load image for the food type
    this.image = new Image();
    this.image.src = 'assets/' + this.type + '.png';

    // use x, y if specified and in bounds, otherwise random position
    if (x<0 || y<0 || x>GRID_WIDTH || y>GRID_HEIGHT) {
      // calculate random position
      x = Math.floor(1 + Math.random()*GRID_WIDTH);
      y = Math.floor(1 + Math.random()*GRID_HEIGHT);
    }
    this.pos = new Point(x, y);    // position of item

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

    // don't draw things that have been eaten
    if (this.status == EATEN) {
      return;
    }
    // get the canvas context
    let ctx = gameCanvas.context;

    // draw it
    p = this.pos;
    ctx.drawImage(this.image, p.x*GRID_SCALE, p.y*GRID_SCALE, GRID_SCALE, GRID_SCALE);

  }

}


// Player score class

class Score {

    constructor () {
      this.score = 0;
      this.pos = new Point(25, 25);
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
      playerScore.add(foodItems[i].eat());
      playerSnake.growthenergy += 1;
      // reupdate the eaten item from foodItems array
      foodItems.splice(i,1);

      console.log(playerScore);
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
