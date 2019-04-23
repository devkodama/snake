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
var playerDeadSound;


//
const UPDATE_INTERVAL = 2;      // in milliseconds

// Canvas is in screen pixels
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 720;

// Game is played on a grid
const GRID_SCALE = 50;
const GRID_WIDTH = CANVAS_WIDTH / GRID_SCALE;
const GRID_HEIGHT = CANVAS_HEIGHT / GRID_SCALE;

// Snake constants
const SNAKE_COLOR = 'green';
const SNAKE_HEAD_COLOR = 'blue';
const SNAKE_BODY_COLOR = 'green';
const SNAKE_TAIL_COLOR = "red";
const SNAKE_HEAD_WIDTH = 0.7;   // in grid units
const SNAKE_BODY_WIDTH = 0.6;   // in grid units
const SNAKE_TAIL_WIDTH = 0.2    // in grid units
const SNAKE_LENGTH = 6;         // in grid units
const SNAKE_TAIL_LENGTH = 4     // in grid units
const SNAKE_TURNING_RADIUS = 0.2; // in grid units
const SNAKE_VELOCITY_SCALE = 0.12;   // in grid units
const SNAKE_RADIUS_OVERLAP = 0.8;   // in grid units
const SNAKE_SPEED_INITIAL = 5;   // in arbitray units
const SNAKE_SPEED_MAX = 1;        // in arbitray units
const SNAKE_ANGULAR_VELOCITY = 10;    // in degrees
const SNAKE_GROWTH_FACTOR = 3;    // how many growthenergy units needed to grow one body segment

// Scoreboard constants
const SCORE_FONT = '20px Arial Black';
const SCORE_COLOR = 'black';
const SCORE_MULTIPLIER = [ 0, 10, 5, 3, 2, 1 ];   // indexed by snake speed (1-5)

// Food constants
//   width and height are dimensions of food item in grid units
//   points is score value of food item
//   speedup is speedup additive when food is eaten
//   speedup duration is how long in milliseconds the speedup lasts
const FOOD_MENU = {
  "donut_blueberry_polka_dot": { width: 1, height: 1, points: 20, energy: 20, speedup: 0, speedupduration: 0 },
  "donut_chocolate_confetti": { width: 1, height: 1, points: 10, energy: 10, speedup: 0, speedupduration: 0 },
  "donut_chocolate_sprinkle": { width: 1, height: 1, points: 10, energy: 10, speedup: 0, speedupduration: 0 },
  "donut_frosted_vanilla": { width: 1, height: 1, points: 10, energy: 10, speedup: 0, speedupduration: 0 },
  "donut_glazed": { width: 1, height: 1, points: 10, energy: 10, speedup: 0, speedupduration: 0 },
  "donut_lemon_sprinkle": { width: 1, height: 1, points: 20, energy: 20, speedup: 0, speedupduration: 0 },
  "donut_pistachio": { width: 1, height: 1, points: 30, energy: 30, speedup: 0, speedupduration: 0 },
  "donut_strawberry_chocolate_striped": { width: 1, height: 1, points: 20, energy: 20, speedup: 0, speedupduration: 0 },
  "donut_strawberry_coconut": { width: 1, height: 1, points: 10, energy: 10, speedup: 0, speedupduration: 0 },
  "kk_coffee_cup": { width: 1, height: 1.5, points: 50, energy: 0, speedup: 1, speedupduration: 10000 },
};
const FOOD_GRID_SPACING = 0.2;    // in grid units
const FOOD_OVERLAP = 0.9;     // in grid units
const FOOD_RATE = 0.005;       // percentage chance of a new food item each game tick

// Snake and food statuses
const DEAD = 0;
const ALIVE = 1;
const EATEN = 2;

// game status modes
const ATTRACT = 0;
const PLAY = 1;

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
    let audio;

    audio = document.getElementById(this.name);
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
    startlen /= SNAKE_VELOCITY_SCALE;

    this.pos = new Point(startpos.x, startpos.y);    // position of snake head
    this.color = SNAKE_COLOR;
    this.headcolor = SNAKE_HEAD_COLOR;
    this.bodycolor = SNAKE_BODY_COLOR;
    this.tailcolor = SNAKE_TAIL_COLOR;
    this.headwidth = SNAKE_HEAD_WIDTH;
    this.bodywidth = SNAKE_BODY_WIDTH;
    this.status = ALIVE;
    this.justturned = false;
    this.turndelay = 0;   // countdown number of steps until next turn can be made
    this.growthenergy = 0;
    this.speed = SNAKE_SPEED_INITIAL;
    this.movedelay = this.speed;   // countdown number of steps until next snake step can be made

    // array of Points representing the coordinates of each body segment
    // body[0] is the snake head position
    this.body = [ this.pos ];

    // array of booleans representing the turning points of the snake
    // indices align with body array
    this.corner = [ false ];

    // now add on body segments and set initial velocity and heading
    // dx and dy are OPPOSITE to the heading vector
    // heading is the degrees from the positive x-axis to the velocity vector
    //   E = 0 deg,  S = 90 deg,  W = 180 deg,  N = -90 deg
    let direction = Math.floor(Math.random() * 4);
    let dx, dy;
    switch (direction) {
      case 0:
        // heading SOUTH
        dx = 0;  dy = -SNAKE_VELOCITY_SCALE;
        this.vel = new Point(0, 1 * SNAKE_VELOCITY_SCALE);
        this.heading = 90;
        break;
      case 1:
        // heading WEST
        dx = SNAKE_VELOCITY_SCALE;  dy = 0;
        this.vel = new Point(-1 * SNAKE_VELOCITY_SCALE, 0);
        this.heading = 180;
        break;
      case 2:
        // heading NORTH
        dx = 0;  dy = SNAKE_VELOCITY_SCALE;
        this.vel = new Point(0, -1 * SNAKE_VELOCITY_SCALE);
        this.heading = -90;
        break;
      case 3:
        // heading EAST
        dx = -SNAKE_VELOCITY_SCALE;  dy = 0;
        this.vel = new Point(1 * SNAKE_VELOCITY_SCALE, 0);
        this.heading = 0;
        break;
      default:
        // should never get here
        console.log('error: Error in setting initial direction')
    }
  console.log(this.heading);
    let nextseg = this.pos;
    for (let i=1; i<startlen; i++) {
      nextseg = nextseg.add(new Point(dx,dy));
      this.body[i] = nextseg;
      this.corner[i] = false;
    }
  }

  // change the snake velocity based on the specified direction
  // snake velocity changes in increments until it matches the desired direction
  // the turning radius sets how tightly the snake is allowed to turn
  steer(direction) {
    let heading;

    // exit if no direction specified
    if (direction == null) {
      return false;
    }

    // make sure we are allowed to turn
    if (this.turndelay > 0) {
      this.turndelay--;
      return false;
    }

    // change snake heading/veolicy towards desired direction
    //   E = 0 deg,  S = 90 deg,  W = 180 deg,  N = -90 deg
    heading = Math.round(playerSnake.heading);

    switch (direction) {
      case UP:
        // make sure we are not heading due south or due north
        if (heading != 90 && heading != -90) {
          // change heading towards NORTH direction
          if (playerSnake.vel.x > 0) {
            heading -= SNAKE_ANGULAR_VELOCITY;
          } else {
            heading += SNAKE_ANGULAR_VELOCITY;
          }
          if (heading <= -180) {
            heading += 360;
          } else if (heading > 180) {
            heading -= 360;
          }
          heading = Math.round(heading);
          playerSnake.heading = heading;

          console.log("UP: vx=" , playerSnake.vel.x, ", heading=", heading);

          playerSnake.vel.x = Math.cos(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          playerSnake.vel.y = Math.sin(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          this.justturned = true;
          this.turndelay = Math.round(SNAKE_TURNING_RADIUS/SNAKE_VELOCITY_SCALE);
        }
        break;
      case DOWN:
        // make sure we are not heading due north or due south
        if (heading != -90 && heading != 90) {
          // change heading towards NORTH direction
          if (playerSnake.vel.x > 0) {
            heading += SNAKE_ANGULAR_VELOCITY;
          } else {
            heading -= SNAKE_ANGULAR_VELOCITY;
          }
          if (heading <= -180) {
            heading += 360;
          } else if (heading > 180) {
            heading -= 360;
          }
          heading = Math.round(heading);
          playerSnake.heading = heading;

          console.log("DOWN:" , heading);

          playerSnake.vel.x = Math.cos(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          playerSnake.vel.y = Math.sin(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          this.justturned = true;
          this.turndelay = Math.round(SNAKE_TURNING_RADIUS/SNAKE_VELOCITY_SCALE);
        }
        break;
      case LEFT:
        // make sure we are not heading due west or due east
        if (heading != 180 && heading != 0) {
          // change heading towards NORTH direction
          if (playerSnake.vel.y > 0) {
            heading += SNAKE_ANGULAR_VELOCITY;
          } else {
            heading -= SNAKE_ANGULAR_VELOCITY;
          }
          if (heading <= -180) {
            heading += 360;
          } else if (heading > 180) {
            heading -= 360;
          }
          heading = Math.round(heading);
          playerSnake.heading = heading;

          console.log("RIGHT:" , heading);

          playerSnake.vel.x = Math.cos(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          playerSnake.vel.y = Math.sin(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          this.justturned = true;
          this.turndelay = Math.round(SNAKE_TURNING_RADIUS/SNAKE_VELOCITY_SCALE);
          }
        break;
      case RIGHT:
        // make sure we are not heading due east or due west
        if (heading != 0 && heading != 180) {
          // change heading towards NORTH direction
          if (playerSnake.vel.y > 0) {
            heading -= SNAKE_ANGULAR_VELOCITY;
          } else {
            heading += SNAKE_ANGULAR_VELOCITY;
          }
          if (heading <= -180) {
            heading += 360;
          } else if (heading > 180) {
            heading -= 360;
          }
          heading = Math.round(heading);
          playerSnake.heading = heading;

          console.log("RIGHT:" , heading);

          playerSnake.vel.x = Math.cos(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          playerSnake.vel.y = Math.sin(heading * Math.PI / 180) * SNAKE_VELOCITY_SCALE;
          this.justturned = true;
          this.turndelay = Math.round(SNAKE_TURNING_RADIUS/SNAKE_VELOCITY_SCALE);
          }
        break;
      default:
        // no valid direction, maintain previous heading/velocity
        break;
    }

    return true;
  }


  // update the snake position based on its velocity
  update() {
    let newPoint;

    // only allow move when movedelay counter reaches zero
    if (this.movedelay > 0) {
      this.movedelay--;
      return;
    }

    // restart move delay counter
    this.movedelay = this.speed;

    // if we just turned, flag the turn point
    if (this.justturned) {
      this.justturned = false;
      this.corner[0] = true;
    }

    // calculate a new position for the snake head
    newPoint = this.body[0].add(this.vel);

    // handle wrap around
    newPoint.wrapToGrid();

    // add new head position to front of body coordinates array
    this.body.unshift(newPoint);
    this.corner.unshift(false);   // set corner flag of new position to false

    // snake grows if it has positive growthenergy
    // growthenergy decreases by 1 each time
    // only grow when growthenergy is odd (so every other turn) so the snake tail doesn't pause
    // if not growing this turn, remove tail position to keep snake the same length
    if (this.growthenergy > 0) {
      this.growthenergy -= 1;
    }
    if (this.growthenergy <=0 || (this.growthenergy % SNAKE_GROWTH_FACTOR == 0)) {
      this.body.pop();
      this.corner.pop();
    }
  }


  // check for collision of snake head with food item at position pos
  collideWithFood(item) {
    let head;
    let itemprops;
    let hx, hy;
    let hr;
    let fx, fy;
    let frw, frh;
    let dx, dy;

    if (item.status == EATEN) {
      console.log('warning: checking for collision with already eaten item')
      return false;
    }

    head = this.body[0];
    hx = head.x;
    hy = head.y;
    hr = SNAKE_RADIUS_OVERLAP * this.headwidth / 2;

    itemprops = FOOD_MENU[item.type];
    fx = item.pos.x;
    fy = item.pos.y;
    frw = FOOD_OVERLAP * itemprops.width / 2;
    frh = FOOD_OVERLAP * itemprops.height / 2;

    if (hx < hr && fx >= GRID_WIDTH - (frw + hr)) {
      fx -= GRID_WIDTH;
    }
    if (hx >= GRID_WIDTH - (hr + frw) && fx < frw) {
      fx += GRID_WIDTH;
    }
    if (hy < hr && fy >= GRID_HEIGHT - (frh + hr)) {
      fy -= GRID_HEIGHT;
    }
    if (hy >= GRID_HEIGHT - (hr + frh) && fy < frh) {
      fy += GRID_HEIGHT;
    }

    dx = Math.abs(fx - hx);
    dy = Math.abs(fy - hy);

    if (dx < (hr + frw) && dy < (hr + frh)) {
      return true;
    }

    // No collision detected, return false
    return false;
  }


  // check for collision of snake head with snake body
  // allow overlap of SNAKE_RADIUS_OVERLAP percentage before calling it a collision
  collideWithSelf() {
    let head;
    let body;
    let necksteps;

    let hx, hy;
    let hr;
    let bx, by;
    let br;
    let dx, dy;

    // "neck" is the number of body segments behind the head to start checking for collisions
    // (otherwise head would always collide with the first body segment)
    necksteps = (SNAKE_BODY_WIDTH + 1) / SNAKE_VELOCITY_SCALE + 1;
    if (necksteps > this.length) {
      console.log("error: neck is longer than snake length");
    }

    // (posx0, posy0) and (posx1, posy1) define a bounding box within which the
    // body segment location must fall to collide
    // don't check the last half of the tail, allow head to pass over it
    head = this.body[0];
    hx = head.x;
    hy = head.y;
    hr = SNAKE_RADIUS_OVERLAP * this.headwidth / 2;

    for (let i = Math.floor(necksteps); i < this.body.length - (SNAKE_TAIL_LENGTH / SNAKE_VELOCITY_SCALE) / 2; i++) {

      body = this.body[i];
      bx = body.x;
      by = body.y;
      br = SNAKE_RADIUS_OVERLAP * SNAKE_BODY_WIDTH / 2;

      if (hx < hr && bx >= GRID_WIDTH - (br + hr)) {
        bx -= GRID_WIDTH;
      }
      if (hx >= GRID_WIDTH - (hr + br) && bx < br) {
        bx += GRID_WIDTH;
      }
      if (hy < hr && by >= GRID_HEIGHT - (br + hr)) {
        by -= GRID_HEIGHT;
      }
      if (hy >= GRID_HEIGHT - (hr + br) && by < br) {
        by += GRID_HEIGHT;
      }

      dx = Math.abs(bx - hx);
      dy = Math.abs(by - hy);

      if (dx < (hr + br) && dy < (hr + br)) {
        return true;
      }

    }

    // No collision detected, return false
    return false;
  }


  // draw the snake on the global game canvas
  // if the snake extends past the last row or column, need to also draw the part that wraps around
  //
  draw() {
    let pos;
    let x, y;
    let ctx;
    let widthtotalsteps;
    let widthcurrentstep;
    let tailwidthdiff;

    function _drawWithWrap(pos, diameter, color) {
      let x, y;
      let r;
      let wrapdx, wrapdy;

      ctx.fillStyle = color;

      x = pos.x;
      y = pos.y;
      r = diameter / 2;
      ctx.beginPath();
      ctx.arc(x * GRID_SCALE, y * GRID_SCALE, r * GRID_SCALE, 0, Math.PI * 2);
      ctx.fill();

      // if wraparound, draw again
      wrapdx = 0;
      wrapdy = 0;
      if (x + r >= GRID_WIDTH) {
        wrapdx = -GRID_WIDTH * GRID_SCALE;
      } else if (x - r < 0) {
        wrapdx = GRID_WIDTH * GRID_SCALE;
      }
      if (y + r >= GRID_HEIGHT) {
        wrapdy = -GRID_HEIGHT * GRID_SCALE;
      } else if (y - r < 0) {
        wrapdy = GRID_HEIGHT * GRID_SCALE;
      }
      if (wrapdx) {
        ctx.translate(wrapdx, 0);
        ctx.beginPath();
        ctx.arc(x * GRID_SCALE, y * GRID_SCALE, r * GRID_SCALE, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(-wrapdx, 0);
      }
      if (wrapdy) {
        ctx.translate(0, wrapdy);
        ctx.beginPath();
        ctx.arc(x * GRID_SCALE, y * GRID_SCALE, r * GRID_SCALE, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(0, -wrapdy);
      }
      if (wrapdx && wrapdy) {
        ctx.translate(wrapdx, wrapdy);
        ctx.beginPath();
        ctx.arc(x * GRID_SCALE, y * GRID_SCALE, r * GRID_SCALE, 0, Math.PI * 2);
        ctx.fill();
        ctx.translate(-wrapdx, -wrapdy);
      }
    }

    // get the canvas context
    ctx = gameCanvas.context;

    // draw snake from tail to head
    // drawn as a series of circles with tapered tail
    widthtotalsteps = SNAKE_TAIL_LENGTH / SNAKE_VELOCITY_SCALE;
    widthcurrentstep = SNAKE_TAIL_LENGTH / SNAKE_VELOCITY_SCALE;
    tailwidthdiff = this.bodywidth - SNAKE_TAIL_WIDTH;

    for (let i = this.body.length - 1; i > 0; i--) {
      pos = this.body[i];
      if (widthcurrentstep > 0) {
        widthcurrentstep -= 1;
        if (widthcurrentstep > widthtotalsteps * 2 / 3) {
          _drawWithWrap(pos, this.bodywidth - tailwidthdiff * (widthcurrentstep / widthtotalsteps), this.tailcolor);
        } else {
          _drawWithWrap(pos, this.bodywidth - tailwidthdiff * (widthcurrentstep / widthtotalsteps), this.bodycolor);
        }
      } else {
        _drawWithWrap(pos, this.bodywidth, this.bodycolor);
      }
    }
    _drawWithWrap(this.body[0], this.headwidth, this.headcolor);

  }

}


// Food item class

class Food {

  constructor(x=-1, y=-1, type=null) {
    let foodprops;

    // set the food type, or select one at random if not specified
    if (!(type in FOOD_MENU)) {
      let menukeys = Object.keys(FOOD_MENU);
      type = menukeys[Math.floor(Math.random() * menukeys.length)];
//      console.log(type);
    }
    foodprops = FOOD_MENU[type];

    // set properties for this object
    this.birth = Date.now();
    this.status = ALIVE;
    this.type = type;
    this.width = foodprops.width;
    this.height = foodprops.height;
    this.energy = foodprops.energy;
    this.speedup = foodprops.speedup;
    this.speedupduration = foodprops.speedupduration;

    // load image for the food type
    this.image = new Image();
    this.image.src = 'assets/' + this.type + '.png';

    // use x, y (grid coordinates) if specified, otherwise random position
    if (x >= 0 && y >= 0) {
      this.pos = new Point(x, y);
    } else {
      // calculate random position
      x = Math.floor(1 + Math.random()*(GRID_WIDTH/FOOD_GRID_SPACING));
      y = Math.floor(1 + Math.random()*(GRID_HEIGHT/FOOD_GRID_SPACING));
      this.pos = new Point(x * FOOD_GRID_SPACING, y * FOOD_GRID_SPACING);    // grid position of item
    }
    this.pos.wrapToGrid();        // handle position wraparound

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
  // item is centered at x, y position
  draw() {
    let p;
    let x, y;
    let w, h;
    let wrapdx, wrapdy;

    // don't draw things that have been eaten
    if (this.status == EATEN) {
      return;
    }

    // get the canvas context
    let ctx = gameCanvas.context;

    // draw it
    let foodprops = FOOD_MENU[this.type];

    p = this.pos;
    w = foodprops.width;
    h = foodprops.height;
    // x, y here is the upper left corner, not the center, in grid coordinates, of the sprite to be drawn
    x = p.x - w / 2;
    y = p.y - h / 2;
    ctx.drawImage(this.image, x * GRID_SCALE, y * GRID_SCALE, foodprops.width * GRID_SCALE, foodprops.height * GRID_SCALE);

    // if wraparound, draw again
    wrapdx = 0;
    wrapdy = 0;
    if (x + w >= GRID_WIDTH) {
      wrapdx = -GRID_WIDTH * GRID_SCALE;
    } else if (x < 0) {
      wrapdx = GRID_WIDTH * GRID_SCALE;
    }
    if (y + h >= GRID_HEIGHT) {
      wrapdy = -GRID_HEIGHT * GRID_SCALE;
    } else if (y < 0) {
      wrapdy = GRID_HEIGHT * GRID_SCALE;
    }
    if (wrapdx) {
      ctx.translate(wrapdx, 0);
      ctx.drawImage(this.image, x * GRID_SCALE, y * GRID_SCALE, foodprops.width * GRID_SCALE, foodprops.height * GRID_SCALE);
      ctx.translate(-wrapdx, 0);
    }
    if (wrapdy) {
      ctx.translate(0, wrapdy);
      ctx.drawImage(this.image, x * GRID_SCALE, y * GRID_SCALE, foodprops.width * GRID_SCALE, foodprops.height * GRID_SCALE);
      ctx.translate(0, -wrapdy);
    }
    if (wrapdx && wrapdy) {
      ctx.translate(wrapdx, wrapdy);
      ctx.drawImage(this.image, x * GRID_SCALE, y * GRID_SCALE, foodprops.width * GRID_SCALE, foodprops.height * GRID_SCALE);
      ctx.translate(-wrapdx, -wrapdy);
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

    this.status = ATTRACT;
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
    this.touchx = -1;
    this.touchy = -1;
  }

  direction () {
    if (this.lastkey) {

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

    } else if (this.touchx >= 0 && this.touchy >= 0) {
      console.log(this.touchx, this.touchy);

      // calculate direction based on vector from snake's head
      dx = playerSnake.body[0].pos.x - this.touchx / GRID_SCALE;
      dy = playerSnake.body[0].pos.y - this.touchy / GRID_SCALE;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          return RIGHT;
        } else {
          return LEFT;
        }
      } else {
        if (dy > 0) {
          return DOWN;
        } else {
          return UP;
        }
      }

    }
  }

}



// called every interval to move snake and redraw canvas

function gameTick () {
  let points;

  switch (gameCanvas.status ) {

    case PLAY:
      // game in play

      if (playerSnake.status != DEAD) {

        // Update existing food items
        for (let i=0; i<foodItems.length; i++) {
          foodItems[i].update();
        }

        // Add some new food items randomly
        if (Math.random() < FOOD_RATE ) {
          foodItems.push(new Food());
        }

        // Use controller input to change snake direction
        playerSnake.steer(gameController.direction());

        // Update snake position
        playerSnake.update();

        // check for snake collision with self
        if (playerSnake.collideWithSelf()) {
          playerDeadSound.play();
          playerSnake.status = DEAD;
        }

        // check for snake collisions with items in foodItems
        for (let i = 0; i < foodItems.length; i++) {
          if (playerSnake.collideWithFood(foodItems[i])) {
            points = foodItems[i].eat();
            playerScore.add(points * SCORE_MULTIPLIER[playerSnake.speed]);
            playerSnake.growthenergy += foodItems[i].energy;

            // handle speedup
            let speedup = foodItems[i].speedup;
            let duration = foodItems[i].speedupduration;
            if (speedup > 0) {
              if (playerSnake.speed > speedup) {
                playerSnake.speed -= speedup;
                setTimeout( () => { playerSnake.speed += speedup; }, duration);
              }
            }

            // remove the eaten item from foodItems array -  this has to be done last
            foodItems.splice(i,1);
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

      break;

    case ATTRACT:
    default:
      // game in attract mode

      break;

  }

}



// This is called by the browser when START button is pressed down
function startPressed() {

  // initialize audio for mobile browsers
  console.log("Start pressed down...")
  document.getElementById('eat').play();
  document.getElementById('eat').pause();

}


// This is called by the browser when START button is released
function startGame() {

  console.log("Game started...")

  // put game in attract mode
  gameCanvas.status = PLAY;

}




// This is called by the browser when the html is loaded
function initializeGame() {

  // create game canvas
  console.log("Creating game canvas...")
  gameCanvas = new Canvas();
  gameCanvas.clear();

  // Create game controller object
  gameController = new Controller();

  // Add event listeners for key presses and screen touches
  window.addEventListener('keydown', function (e) {
    gameController.key[e.keyCode] = true;
    gameController.prevkey = gameController.lastkey;
    gameController.lastkey = e.key;
    gameController.touchx = -1;
    gameController.touchy = -1;
  })
  window.addEventListener('keyup', function (e) {
    gameController.key[e.keyCode] = false;
    gameController.touchx = -1;
    gameController.touchy = -1;
  })
  window.addEventListener('touchstart', function (e) {
    gameController.prevkey = gameController.lastkey;
    gameController.lastkey = null;
    gameController.touchx = e.touches[0].pageX - canvas.offsetLeft;
    gameController.touchy = e.touches[0].pageY - canvas.offsetTop;
    e.preventDefault();
    {

      // get the canvas context
      let ctx = gameCanvas.context;

      ctx.font = "12 pt Arial";
      ctx.fillStyle = "blue";
      ctx.fillText( 'touchx ' + this.touchx + 'touchy ' + this.touchy, CANVAS_WIDTH / 2 - 20, CANVAS_HEIGHT / 2);
    }

  })
  window.addEventListener('touchmove', function (e) {
    gameController.prevkey = gameController.lastkey;
    gameController.lastkey = null;
    gameController.touchx = e.touches[0].pageX - canvas.offsetLeft;
    gameController.touchy = e.touches[0].pageY - canvas.offsetTop;
    e.preventDefault();
  })


  // load sounds
  gotItemSound = new Sound('eat', 'assets/eat.wav');
  playerDeadSound = new Sound('die', 'assets/die.wav');

  // Create score Object
  playerScore = new Score();

  // Create player snake of appropriate length
  console.log("Creating player snake...")
  let startpos = new Point(GRID_WIDTH/2, GRID_HEIGHT/2);
  playerSnake = new Snake(startpos);    // head segment created by constructor

  // Create global foodItems array
  foodItems = [];

  // put game in attract mode
  gameCanvas.status = ATTRACT;

  // Start game loop
  gameCanvas.interval = setInterval(gameTick, UPDATE_INTERVAL);

  return;
}
