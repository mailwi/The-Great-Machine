class BasicNode {
  constructor (name) {
    this.name = name
    this.childs = {}
    this.childsOrder = []
    this.index = -1
    this.parent = null
    this._x = 0
    this._y = 0
    this.local = {}
  }

  set x (val) {
    const oldX = this._x
    this._x = val
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].x += val - oldX
    }
  }

  get x () {
    return this._x
  }

  set y (val) {
    const oldY = this._y
    this._y = val
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].y += val - oldY
    }
  }

  get y () {
    return this._y
  }

  goto (x, y) {
    const oldX = this._x
    const oldY = this._y
    this._x = x
    this._y = y
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].goto(children[i].x + (x - oldX), children[i].y + (y - oldY))
    }
  }

  addChild (node, uniqueName = false) {
    if (!uniqueName) {
      if (node.name in this.childs) {
        if (this.childs[node.name] instanceof Array) {
          this.childs[node.name].push(node)
        } else {
          this.childs[node.name] = [this.childs[node.name], node]
        }
      } else {
        this.childs[node.name] = node
      }
    } else {
      if (node.name in this.childs) {
        let i = 0
        while (node.name + i in this.childs) {
          i++
        }
        this.childs[node.name + i] = node
      } else {
        this.childs[node.name] = node
      }
    }
    node.index = this.childsOrder.length
    node.parent = this
    this.childsOrder.push(node)
  }

  getChild (index) {
    return this.childsOrder[index]
  }

  getNode (name) {
    return this.childs[name]
  }

  getChildren () {
    return this.childsOrder
  }

  getChildCount () {
    return this.childsOrder.length
  }

  getIndex () {
    return this.index
  }

  getParent () {
    return this.parent
  }

  hasNode (name) {
    return name in this.childs
  }

  removeChild (node) {
    if (node.name in this.childs) {
      const child = this.childs[node.name]
      if (child instanceof Array) {
        const index = child.findIndex((childNode) => childNode === node)
        if (index > -1) {
          child.splice(index, 1)
        }
        if (child.length === 0) {
          delete this.childs[node.name]
        }
      } else {
        delete this.childs[node.name]
      }
    }
    this.childsOrder.splice(node.index, 1)
    for (let i = 0; i < this.childsOrder.length; i++) {
      this.childsOrder[i].index = i
    }
  }

  removeChildren () {
    for (let i = 0; i < this.childsOrder.length; i++) {
      this.childsOrder[i].index = -1
      this.childsOrder[i].parent = null
    }

    this.childs = {}
    this.childsOrder = []
  }

  removeSprite (spriteNode) {
    this.removeChild(spriteNode)
    spriteNode.deleteClone()
  }

  removeSprites () {
    for (let i = 0; i < this.childsOrder.length; i++) {
      this.childsOrder[i].index = -1
      this.childsOrder[i].parent = null
      this.childsOrder[i].deleteClone()
    }

    this.childs = {}
    this.childsOrder = []
  }

  forEach (f) {
    this.childsOrder.forEach(f)
  }

  printTree (space = '') {
    console.log(space + this.name)
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].printTree(space + i + '|=>')
    }
  }
}

class SpriteNode extends BasicNode {
  constructor (spriteData, clone = false) {
    if (!clone) {
      super(spriteData.name)
      this.spriteData = spriteData
      const collision = spriteData.collision
      const spriteNode = this
      createSprite(spriteData.name, function () {
        this.node = spriteNode

        if (spriteData.costumes) addCostumes(this, spriteData.costumes)
        if (spriteData.sounds) addSounds(this, spriteData.sounds)
        if (this.clone) {
          if (spriteData.data) this.local = spriteData.data

          if (collision) {
            if (collision instanceof Function) {
              this.nodeCollision = collision
              this.nodeCollision()
            } else {
              if (collision.length > 2) {
                collisionRect(this, collision[0], collision[1], collision[2], collision[3])
              } else {
                collisionPoint(this, collision[0], collision[1])
              }
            }
          }
        }

        if (!spriteData.clone && spriteData.layer !== undefined) this.layer = spriteData.layer

        this.hide()

        if (spriteData.start) {
          this.nodeStart = spriteData.start
          whenGameStart(this, async () => {
            await this.costumesLoaded
            await this.soundsLoaded

            if (!spriteData.clone && spriteData.wait) {
              this.nodeWait = spriteData.wait
              foreverWait(this, async () => {
                await this.nodeWait()
              })
            }

            await this.nodeStart()
          })
        }

        if (spriteData.clone) {
          this.whenIStartAsAClone(() => {
            this.node = new SpriteNode({ name: this.name, clone: this }, true)
            if (spriteData.parent) spriteData.parent.addChild(this.node)
            this.show()

            if (spriteData.layer !== undefined) this.layer = spriteData.layer

            this.nodeClone = spriteData.clone
            this.nodeClone()

            if (spriteData.wait) {
              this.nodeWait = spriteData.wait
              foreverWait(this, async () => {
                await this.nodeWait()
              })
            }
          })
        }

        if (spriteData.draw) {
          if (spriteData.costumes) {
            this.nodeDraw = spriteData.draw
            this.draw(() => {
              drawCostume(this)
              this.nodeDraw()
            })
          } else {
            this.draw(spriteData.draw)
          }
        } else if (spriteData.costumes) {
          this.draw(() => {
            drawCostume(this)
          })
        }
      })

      this.sprite = E.sprites[spriteData.name]
      this.clones = []
    } else {
      super(spriteData.name)
      this.sprite = spriteData.clone
      this.sprite.node = this
      this.isClone = true
    }
  }

  set x (val) {
    const oldX = this.sprite.x
    this.sprite.x = val
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].x += val - oldX
    }
  }

  get x () {
    return this.sprite.x
  }

  set y (val) {
    const oldY = this.sprite.y
    this.sprite.y = val
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].y += val - oldY
    }
  }

  get y () {
    return this.sprite.y
  }

  goto (x, y) {
    const oldX = this.sprite.x
    const oldY = this.sprite.y
    this.sprite.x = x
    this.sprite.y = y
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].goto(children[i].x + (x - oldX), children[i].y + (y - oldY))
    }
  }

  clone (parent, data) {
    if (!this.isClone) {
      this.spriteData.parent = parent
      this.spriteData.data = data
      createCloneOf(this.sprite, this.name)
      const clones = E.clones[this.name]
      const clone = clones[clones.length - 1].node
      this.clones.push(clone)
      return clone
    }
  }

  delete () {
    if (this.isClone) {
      deleteThisClone(this.sprite)
    }
  }

  deleteAllClones () {
    for (let i = 0; i < this.clones.length; i++) {
      this.clones[i].delete()
    }
    this.clones = []
  }

  deleteClonesTree () {
    this.deleteAllClones()
    const children = this.childsOrder
    for (let i = 0; i < children.length; i++) {
      children[i].deleteClonesTree()
    }
  }
}

function createNode (name) {
  return new Node(name)
}
