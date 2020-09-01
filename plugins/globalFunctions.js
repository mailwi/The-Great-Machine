/* collision functions */

function collisionPoint (sprite, x, y) {
  R.collisionPoint(sprite, x, y)
}

function collisionRect (sprite, x, y, w, h) {
  R.collisionRect(sprite, x, y, w, h)
}

function touching (sprite, name) {
  return R.touching(sprite, name)
}

/* costume functions */

function addCostumes (sprite, costumesData) {
  R.addCostumes(sprite, costumesData)
}

function drawCostume (sprite) {
  R.drawCostume(sprite)
}

/* layer functions */

function goToFrontLayer (sprite) {
  R.goToFrontLayer(sprite)
}

/* audio functions */

function addSounds (sprite, sounds) {
  A.addSounds(sprite, sounds)
}

function startSound (sprite, name, instanceSound) {
  A.startSound(sprite, name, instanceSound)
}

/* engine functions */

function setup (f) {
  E.setup(f)
}

function createSprite (name, code) {
  E.createSprite(name, code)
}

function createCloneOf (sprite, name) {
  E.createCloneOf(sprite, name)
}

function createCloneOfMySelf (sprite) {
  E.createCloneOfMySelf(sprite)
}

function deleteThisClone (sprite) {
  E.deleteThisClone(sprite)
}

/* event functions */

function whenGameStart (sprite, code) {
  E.whenGameStart(sprite, code)
}

function forever (sprite, code) {
  E.forever(sprite, code)
}

function foreverWait (sprite, code) {
  E.foreverWait(sprite, code)
}

function repeatUntil (condition, code) {
  return E.repeatUntil(condition, code)
}

function waitSeconds (seconds) {
  return E.waitSeconds(seconds)
}

function keyPressed (keyCode) {
  return E.keyPressed(keyCode)
}

function whenKeyPressed (sprite, keyCode, code) {
  E.whenKeyPressed(sprite, keyCode, code)
}

/* draw functions */

function translate (x, y) {
  R.translate(x, y)
}

function rotate (radians) {
  R.rotate(radians)
}

function fill (color) {
  R.fill(color)
}

function stroke (color) {
  R.stroke(color)
}

function noFill () {
  R.noFill()
}

function noStroke () {
  R.noStroke()
}

function rect (x, y, w, h) {
  R.rect(x, y, w, h)
}

function font (size, font) {
  R.font(size, font)
}

function text (text, x, y) {
  R.text(text, x, y)
}
