class Engine {
  constructor (render, audioEngine) {
    this.render = render
    this.audioEngine = audioEngine

    this.mouseDown = null
    this.mouseX = null
    this.mouseY = null

    this.keyCodes = {}

    this.countToTrash = 0

    this.events = {}

    this.sprites = {}
    this.clones = {}

    this.setupFunc = null

    this.beforeInit = null

    this.init()
  }

  init () {
    window.onload = () => {
      this.load()
    }
  }

  setup (f) {
    this.setupFunc = f
  }

  async load () {
    this.mouseDown = false

    document.addEventListener('keydown', e => {
      this.keyCodes[e.code] = true
    })

    document.addEventListener('keyup', e => {
      this.keyCodes[e.code] = false

      if ('whenKeyPressed' in this.events) {
        const whenKeyPressedEvent = this.events.whenKeyPressed
        for (let i = 0; i < whenKeyPressedEvent.length; i++) {
          if (whenKeyPressedEvent[i] && whenKeyPressedEvent[i].data === e.code) whenKeyPressedEvent[i].code()
        }
      }
    })

    this.createSprite('mouse-pointer', this.render.mouseLogic)

    this.setupFunc()

    for (const spriteName in this.sprites) {
      this.sprites[spriteName].setup()
    }

    if ('whenGameStart' in this.events) {
      const whenGameStartEvent = this.events.whenGameStart
      for (let i = 0; i < whenGameStartEvent.length; i++) {
        if (whenGameStartEvent[i]) await whenGameStartEvent[i].code()
      }
    }

    if (this.beforeInit) this.beforeInit()

    this.render.engineInit(this)
  }

  gameLoop () {
    if (this.countToTrash > 50) {
      for (const name in this.events) {
        const event = this.events[name]
        this.events[name] = event.filter(sprite => sprite !== null)
      }

      for (const name in this.clones) {
        const sprites = this.clones[name]
        this.clones[name] = sprites.filter(sprite => sprite !== null)
      }

      this.countToTrash = 0
    }

    if ('forever' in this.events) {
      const foreverEvent = this.events.forever
      for (let i = 0; i < foreverEvent.length; i++) {
        if (foreverEvent[i]) foreverEvent[i].code()
      }
    }

    if ('foreverWait' in this.events) {
      const foreverWaitEvent = this.events.foreverWait
      for (let i = 0; i < foreverWaitEvent.length; i++) {
        if (foreverWaitEvent[i] && !foreverWaitEvent[i].wait) {
          foreverWaitEvent[i].wait = true
          foreverWaitEvent[i].code().then(() => {
            if (foreverWaitEvent[i]) foreverWaitEvent[i].wait = false
            return true
          })
        }
      }
    }
  }

  createSprite (name, code) {
    const sprite = new Sprite(name, code)
    this.sprites[name] = sprite
    this.render.layersAdd(sprite)
  }

  /* event functions */

  unsubscribe (name, sprite, index = null) {
    if (name in this.events) {
      if (index) {
        this.events[name][index] = null
        this.countToTrash++
      } else {
        index = this.events[name].findIndex((spriteData) => spriteData && spriteData.sprite === sprite)
        this.events[name][index] = null
        this.countToTrash++
      }
    }
  }

  subscribe (name, code, sprite, data) {
    if (name in this.events) {
      this.events[name].push({ sprite: sprite, code: code, data: data })
    } else {
      this.events[name] = [{ sprite: sprite, code: code, data: data }]
    }
  }

  /* sprite functions */

  waitSeconds (seconds) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), seconds * 1000)
    })
  }

  keyPressed (keyCode) {
    if (this.keyCodes[keyCode]) {
      return true
    }
    return false
  }

  /* clone functions */

  createCloneOf (caller, name) {
    if (caller.clone && caller.name === name) return
    const sprite = this.sprites[name]
    const clone = new Sprite(name, sprite.code)
    clone.x = sprite.x
    clone.y = sprite.y
    clone.size = sprite.size
    clone.layer = sprite.layer
    clone.local = Object.assign({}, sprite.local)
    clone.costumes = Object.assign({}, sprite.costumes)
    clone.costumesOrder = Object.assign([], sprite.costumesOrder)
    clone.currentCostume = sprite.currentCostume
    clone.currentCostumeNumber = sprite.currentCostumeNumber
    clone.currentCostumeData = sprite.currentCostumeData
    clone.visible = sprite.visible
    clone.costumesLoaded = true
    clone.costumeMirror = sprite.costumeMirror

    this.render.layersOnlyAdd(clone)

    if (name in this.clones) {
      this.clones[name].push(clone)
    } else {
      this.clones[name] = [clone]
    }

    clone.clone = true
    clone.setup()
    clone.whenIStartAsACloneEvent()
  }

  createCloneOfMySelf (sprite) {
    this.createCloneOf(sprite, sprite.name)
  }

  deleteThisClone (sprite) {
    if (sprite.clone) {
      const spriteClones = this.clones[sprite.name]
      const index = spriteClones.indexOf(this)
      spriteClones[index] = null

      for (const key in this.events) {
        const sprites = this.events[key]
        const index = sprites.findIndex((spriteData) => spriteData && spriteData.sprite === sprite)
        if (index !== -1) {
          sprites[index] = null
        }
      }

      if (layersNeedLogic) this.render.deleteFromLayers(sprite)
      if (collisionsNeedLogic) this.render.deleteFromCollisions(sprite)

      this.countToTrash++
    }
  }

  /* event functions */

  whenGameStart (sprite, code) {
    if (!sprite.clone) {
      this.subscribe('whenGameStart', code, sprite)
    }
  }

  forever (sprite, code) {
    this.subscribe('forever', code, sprite)
  }

  foreverWait (sprite, code) {
    this.subscribe('foreverWait', code, sprite)
  }

  repeatUntil (condition, code) {
    const repeatFunc = async (resolve) => {
      if (!condition()) {
        await code()
        setTimeout(() => repeatFunc(resolve), 1)
      } else {
        resolve()
      }
    }

    return new Promise(repeatFunc)
  }

  whenKeyPressed (sprite, keyCode, code) {
    this.subscribe('whenKeyPressed', code, sprite, keyCode)
  }

  broadcast (message) {
    if (message in this.events) {
      const messageEvent = this.events[message]
      for (let i = 0; i < messageEvent.length; i++) {
        if (messageEvent[i]) messageEvent[i].code()
      }
    }
  }

  async broadcastAndWait (message) {
    if (message in this.events) {
      const messageEvent = this.events[message]
      for (let i = 0; i < messageEvent.length; i++) {
        if (messageEvent[i]) await messageEvent[i].code()
      }
    }
  }

  whenIReceive (sprite, message, code) {
    this.subscribe(message, code, sprite)
  }
}

/* Sprite system */

class Sprite {
  constructor (name, code) {
    this.name = name
    this.code = code
    this.x = 0
    this.y = 0
    this.drawX = 0
    this.drawY = 0
    this.size = 1
    this.direction = 0
    this.layer = null
    this.drawSprite = null
    this.local = {}

    this.costumes = {}
    this.costumesOrder = []
    this.currentCostume = ''
    this.currentCostumeNumber = 0
    this.currentCostumeData = null
    this.visible = true
    this.costumesLoaded = null
    this.costumeMirror = false

    this.sounds = {}
    this.soundsLoaded = null

    this.collisionShape = null
    this.whenThisSpriteClickedEvent = null
    this.whenIStartAsACloneEvent = null

    this.clone = false
  }

  goto (x, y) {
    this.x = x
    this.y = y
  }

  whenThisSpriteClicked (code) {
    this.whenThisSpriteClickedEvent = code
  }

  whenIStartAsAClone (code) {
    this.whenIStartAsACloneEvent = code
  }

  set (name, value) {
    this.local[name] = value
  }

  get (name) {
    return this.local[name]
  }

  /* costume functions */

  nextCostume () {
    this.currentCostumeNumber++
    if (this.currentCostumeNumber > this.costumesOrder.length) {
      this.currentCostumeNumber = 1
    }

    const index = this.currentCostumeNumber - 1
    this.currentCostume = this.costumesOrder[index]
    this.currentCostumeData = this.costumes[this.currentCostume].data
  }

  switchCostumeTo (name) {
    if (name !== this.currentCostume) {
      this.currentCostume = name
      this.currentCostumeNumber = this.costumes[name].index + 1
      this.currentCostumeData = this.costumes[name].data
    }
  }

  mirror (value) {
    if (value !== undefined) {
      this.costumeMirror = value
    } else {
      this.costumeMirror = !this.costumeMirror
    }
  }

  show () {
    this.visible = true
  }

  hide () {
    this.visible = false
  }

  draw (code) {
    this.drawSprite = code
  }

  setup () {
    this.code()
  }
}

const E = new Engine(R, A)
