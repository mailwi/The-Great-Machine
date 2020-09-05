/* Render class */

const displayWidth = 1280
const displayHeight = 720
const rc = displayHeight / displayWidth

const layersNeedLogic = true
const collisionsNeedLogic = true
const is2D = true

class Render {
  constructor () {
    this.seeCollisions = false
    this.sc = 1
    this.layers = []
    this.layerIndex = 0
    this.collisionShapes = []
    this.canvas = null
    this.prerenderCanvas = null

    this.strokeStyle = '#000'
    this.fillStyle = '#000'

    this.delay = null
    this.oldTimeStamp = null
    this.fps = null

    this.gameLoopFunc = null

    this.engine = null

    this.init()
  }

  init () {
    document.documentElement.style.height = '100%'
    document.body.style.height = '100%'
    document.body.style.backgroundColor = 'black'
    document.body.style.margin = '0px'
    document.body.style.display = 'grid'
    document.body.style.placeItems = 'center'

    this.canvas = document.createElement('canvas')
    this.canvas.style.backgroundColor = 'white'
    this.canvas.style.imageRendering = 'auto'
    this.context = this.canvas.getContext('2d')
    this.context.imageSmoothingEnabled = true
    this.context.imageSmoothingQuality = 'high'
    document.body.append(this.canvas)

    this.prerenderCanvas = document.createElement('canvas')
    this.prerenderCanvas.style.backgroundColor = 'white'
    this.prerenderCanvas.style.imageRendering = 'auto'
    this.prerenderContext = this.prerenderCanvas.getContext('2d')
    this.prerenderContext.imageSmoothingEnabled = true
    this.prerenderContext.imageSmoothingQuality = 'high'

    window.onresize = () => {
      this.resize()
    }

    window.addEventListener('load', () => {
      this.resize()
    })
  }

  engineInit (engine) {
    this.engine = engine

    window.onresize = () => {
      this.resize()
    }

    this.canvas.addEventListener('mousedown', e => {
      engine.mouseDown = true
      engine.mouseX = Math.round(e.offsetX / this.sc)
      engine.mouseY = Math.round(e.offsetY / this.sc)
    })

    this.canvas.addEventListener('mousemove', e => {
      engine.mouseX = Math.round(e.offsetX / this.sc)
      engine.mouseY = Math.round(e.offsetY / this.sc)
    })

    this.canvas.addEventListener('mouseup', e => {
      engine.mouseDown = false
      engine.mouseX = Math.round(e.offsetX / this.sc)
      engine.mouseY = Math.round(e.offsetY / this.sc)
    })

    this.oldTimeStamp = Date.now()
    this.gameLoopFunc = () => {
      this.gameLoop()
    }
    window.requestAnimationFrame(this.gameLoopFunc)
  }

  resize () {
    // const dpi = window.devicePixelRatio

    const height = window.innerWidth * rc
    if (height > window.innerHeight) {
      const w = Math.floor(window.innerHeight / rc)

      this.canvas.width = w
      this.canvas.height = Math.floor(window.innerHeight)
      this.sc = w / displayWidth
    } else {
      const w = Math.floor(window.innerWidth)

      this.canvas.width = w
      this.canvas.height = Math.floor(height)
      this.sc = w / displayWidth
    }

    this.oldTimeStamp = Date.now() - 1000
  }

  gameLoop () {
    const timeStamp = Date.now()

    const delay = (timeStamp - this.oldTimeStamp) / 1000
    const fps = Math.round(1 / delay)

    if (fps < 31) {
      this.delay = delay
      this.oldTimeStamp = timeStamp

      this.fps = Math.round(1 / this.delay)

      if (this.engine.countToTrash > 50) {
        this.layersToTrash()
        this.collisionsToTrash()
      }

      this.collisionsLoop()

      this.engine.gameLoop()

      this.clear()
      this.layersLoop()
      this.drawCollisions()
    }

    window.requestAnimationFrame(this.gameLoopFunc)
  }

  /* draw functions */

  clear () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.lineWidth = this.sc
  }

  fill (color) {
    this.context.fillStyle = color
    this.fillStyle = color
  }

  stroke (color) {
    this.context.strokeStyle = color
    this.strokeStyle = color
  }

  noFill () {
    this.fillStyle = ''
  }

  noStroke () {
    this.strokeStyle = ''
  }

  push () {
    this.context.save()
  }

  pop () {
    this.context.restore()
  }

  translate (x, y) {
    this.context.translate(x * this.sc, y * this.sc)
  }

  rotate (radians) {
    this.context.rotate(radians)
  }

  rotateDegree (degree) {
    this.context.rotate(degree * Math.PI / 180)
  }

  rect (x, y, w, h = w) {
    if (this.fillStyle !== '') {
      this.context.fillRect(x * this.sc, y * this.sc, w * this.sc, h * this.sc)
    }

    if (this.strokeStyle !== '') {
      this.context.strokeRect(x * this.sc, y * this.sc, w * this.sc, h * this.sc)
    }
  }

  font (size, font) {
    this.context.font = `${size * this.sc}px ${font}`
  }

  text (text, x, y) {
    if (this.fillStyle !== '') {
      this.context.fillText(text, x * this.sc, y * this.sc)
    }

    if (this.strokeStyle !== '') {
      this.context.strokeText(text, x * this.sc, y * this.sc)
    }
  }

  /* costume functions */

  async _addCostumes (sprite, images) {
    function getImage (data) {
      return new Promise((resolve) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.src = data
      })
    }

    for (let i = 0; i < images.length; i++) {
      const costume = images[i]
      const image = await getImage(costume.data)
      sprite.costumes[costume.name] = {
        data: image,
        index: i,
        offsetX: costume.offsetX || 0,
        offsetY: costume.offsetY || 0
      }
      sprite.costumesOrder.push(costume.name)

      if (sprite.currentCostumeData === null) {
        sprite.currentCostume = costume.name
        sprite.currentCostumeNumber = i + 1
        sprite.currentCostumeData = image
      }
    }
  }

  addCostumes (sprite, costumesData) {
    if (!sprite.clone) {
      sprite.costumesLoaded = this._addCostumes(sprite, costumesData)
    }
  }

  drawCostume (sprite) {
    if (!sprite.visible) return

    let costume
    if (sprite.currentCostume) {
      costume = sprite.costumes[sprite.currentCostume]
    } else {
      costume = { offsetX: 0, offsetY: 0 }
    }

    const width = Math.round(sprite.currentCostumeData.width * sprite.size * this.sc + 0.5)
    const height = Math.round(sprite.currentCostumeData.height * sprite.size * this.sc + 0.5)

    this.prerenderCanvas.width = width
    this.prerenderCanvas.height = height

    this.prerenderContext.clearRect(0, 0, this.prerenderCanvas.width, this.prerenderCanvas.height)

    if (sprite.costumeMirror) {
      this.prerenderContext.translate(width, 0)
      this.prerenderContext.scale(-1, 1)
    }

    this.prerenderContext.drawImage(sprite.currentCostumeData, 0, 0, width, height)

    const x = Math.round((sprite.x + sprite.drawX + costume.offsetX) * this.sc)
    const y = Math.round((sprite.y + sprite.drawY + costume.offsetY) * this.sc)

    this.context.drawImage(this.prerenderCanvas, x, y)
  }

  /* layer functions */

  layersToTrash () {
    this.layers = this.layers.filter(sprite => sprite !== null)
  }

  layersAdd (sprite) {
    this.layers.push(sprite)
    sprite.layer = this.layerIndex
    this.layerIndex++
  }

  layersOnlyAdd (sprite) {
    this.layers.push(sprite)
  }

  goToBackLayer (sprite) {
    if (sprite.layer !== 0) {
      sprite.layer = 0
    }
  }

  goToFrontLayer (sprite) {
    if (sprite.layer !== this.layerIndex - 1) {
      sprite.layer = this.layerIndex
      this.layerIndex++
    }
  }

  goBackwardLayers (sprite, goIndex) {
    sprite.layer -= goIndex
    if (sprite.layer < 0) sprite.layer = 0
  }

  goForwardLayers (sprite, goIndex) {
    sprite.layer += goIndex
    if (sprite.layer >= this.layerIndex) this.layerIndex = sprite.layer + 1
  }

  setLayer (sprite, index) {
    sprite.layer = index
  }

  deleteFromLayers (sprite) {
    const indexLayer = this.layers.indexOf(sprite)
    this.layers[indexLayer] = null
  }

  layersLoop () {
    this.layers.sort((a, b) => {
      if (a === null) return 1
      if (b === null) return -1
      return a.layer - b.layer
    })

    for (let i = 0; i < this.layers.length; i++) {
      const sprite = this.layers[i]
      if (sprite && sprite.drawSprite && sprite.visible) {
        sprite.drawSprite()
      }
    }
  }

  /* collision functions */

  collisionPoint (sprite, x, y) {
    sprite.collisionShape = new CollisionPoint(sprite, x, y)
    this.collisionShapes.push(sprite.collisionShape)
  }

  collisionRect (sprite, x, y, w, h) {
    sprite.collisionShape = new CollisionRect(sprite, x, y, w, h)
    this.collisionShapes.push(sprite.collisionShape)
  }

  collisionsToTrash () {
    this.collisionShapes = this.collisionShapes.filter(collisionShape => collisionShape !== null)
  }

  deleteFromCollisions (sprite) {
    if (sprite.collisionShape) {
      sprite.collisionShape.sprite = null
      const indexShape = this.collisionShapes.indexOf(sprite.collisionShape)
      this.collisionShapes[indexShape] = null
      sprite.collisionShape = null
    }
  }

  collisionsLoop () {
    for (let i = 0; i < this.collisionShapes.length; i++) {
      if (this.collisionShapes[i]) this.collisionShapes[i].reset()
    }

    for (let i = 0; i < this.collisionShapes.length; i++) {
      const collisionShape = this.collisionShapes[i]
      for (let j = i + 1; j < this.collisionShapes.length; j++) {
        const otherCollisionShape = this.collisionShapes[j]
        if (collisionShape && collisionShape.sprite.visible &&
          otherCollisionShape && otherCollisionShape.sprite.visible) {
          collisionShape.eval(otherCollisionShape)
        }
      }
    }
  }

  drawCollisions () {
    if (this.seeCollisions) {
      for (let i = 0; i < this.collisionShapes.length; i++) {
        this.stroke('black')
        this.fill('rgba(255, 0, 0, 0.25)')

        const collisionShape = this.collisionShapes[i]
        if (collisionShape instanceof CollisionRect) {
          this.rect(collisionShape.sprite.x + collisionShape.sprite.drawX + collisionShape.x, collisionShape.sprite.y + collisionShape.sprite.drawY + collisionShape.y, collisionShape.w, collisionShape.h)
        } else if (collisionShape instanceof CollisionPoint) {
          this.rect(collisionShape.sprite.x + collisionShape.sprite.drawX + collisionShape.x - 2, collisionShape.sprite.y + collisionShape.sprite.drawY + collisionShape.y - 2, 4, 4)
        }

        font(12, 'Arial')
        if (collisionShape) text(collisionShape.sprite.name, collisionShape.sprite.x + collisionShape.sprite.drawX + collisionShape.x - 2, collisionShape.sprite.y + collisionShape.sprite.drawY + collisionShape.y - 10)
      }
    }
  }

  touching (sprite, name) {
    if (sprite.collisionShape && sprite.collisionShape.colliding() && name in sprite.collisionShape.collidingShapes) {
      return true
    }
    return false
  }

  /* mouse */

  mouseLogic () {
    R.collisionPoint(this, 0, 0)

    E.whenGameStart(this, () => {
      R.canvas.addEventListener('mouseup', _ => {
        if (this.collisionShape.colliding()) {
          const collidingShapes = this.collisionShape.collidingShapes
          for (const name in collidingShapes) {
            const shapes = collidingShapes[name]
            for (let i = 0; i < shapes.length; i++) {
              const sprite = shapes[i].sprite
              if (sprite.whenThisSpriteClickedEvent) {
                sprite.whenThisSpriteClickedEvent()
              }
            }
          }
        }
      })

      E.forever(this, () => {
        this.goto(E.mouseX, E.mouseY)
      })
    })
  }
}

/* Collision classes */

class CollisionShape {
  constructor () {
    this.collidingShapes = {}
  }

  reset () {
    this.collidingShapes = {}
  }

  addCollidingShape (name, shape) {
    if (name in this.collidingShapes) {
      this.collidingShapes[name].push(shape)
    } else {
      this.collidingShapes[name] = [shape]
    }
  }

  colliding () {
    if (Object.keys(this.collidingShapes).length > 0) {
      return true
    }
    return false
  }

  pointRect (px, py, rx, ry, rw, rh) {
    if (px >= rx && px <= rx + rw && py >= ry && py <= ry + rh) {
      return true
    }
    return false
  }

  rectRect (r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h) {
    if (r1x + r1w >= r2x && r1x <= r2x + r2w && r1y + r1h >= r2y && r1y <= r2y + r2h) {
      return true
    }
    return false
  }
}

class CollisionPoint extends CollisionShape {
  constructor (sprite, x, y) {
    super()
    this.sprite = sprite
    this.x = x
    this.y = y
  }

  eval (collisionShape) {
    if (collisionShape instanceof CollisionRect) {
      if (this.pointRect(this.sprite.x + this.sprite.drawX + this.x, this.sprite.y + this.sprite.drawY + this.y,
        collisionShape.sprite.x + collisionShape.sprite.drawX + collisionShape.x,
        collisionShape.sprite.y + collisionShape.sprite.drawY + collisionShape.y,
        collisionShape.w, collisionShape.h)) {
        this.addCollidingShape(collisionShape.sprite.name, collisionShape)
        collisionShape.addCollidingShape(this.sprite.name, this)
      }
    }
  }
}

class CollisionRect extends CollisionShape {
  constructor (sprite, x, y, w, h) {
    super()
    this.sprite = sprite
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  eval (collisionShape) {
    if (collisionShape instanceof CollisionPoint) {
      if (this.pointRect(collisionShape.sprite.x + collisionShape.sprite.drawX + collisionShape.x,
        collisionShape.sprite.y + collisionShape.sprite.drawY + collisionShape.y,
        this.sprite.x + this.sprite.drawX + this.x,
        this.sprite.y + this.sprite.drawY + this.y,
        this.w, this.h)) {
        this.addCollidingShape(collisionShape.sprite.name, collisionShape)
        collisionShape.addCollidingShape(this.sprite.name, this)
      }
    } else if (collisionShape instanceof CollisionRect) {
      if (this.rectRect(this.sprite.x + this.sprite.drawX + this.x, this.sprite.y + this.sprite.drawY + this.y, this.w, this.h,
        collisionShape.sprite.x + collisionShape.sprite.drawX + collisionShape.x,
        collisionShape.sprite.y + collisionShape.sprite.drawY + collisionShape.y,
        collisionShape.w, collisionShape.h)) {
        this.addCollidingShape(collisionShape.sprite.name, collisionShape)
        collisionShape.addCollidingShape(this.sprite.name, this)
      }
    }
  }
}

const R = new Render()
