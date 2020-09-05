setup(function () {
  R.seeCollisions = true

  const team = new BasicNode('team')

  const camera = new Camera(team, 330, 525)
  camera.add(team)

  const teamObj = [
    {
      name: 'The BigHealther',
      hp: 250,
      maxHP: 250,
      baseDamage: 30,
      damage: 30,
      damageAbsorption: 25
    },
    {
      name: 'The Attacker',
      hp: 100,
      maxHP: 100,
      baseDamage: 50,
      damage: 50
    },
    {
      name: 'The Girl',
      hp: 175,
      maxHP: 175,
      baseDamage: 10,
      damage: 10
    }
  ]

  let enemiesNode = null

  const enemiesObj = {
    engineer: {
      name: 'Engineer',
      type: 'engineer',
      hp: 100,
      maxHP: 100,
      damage: 25
    }
  }

  let fight = false

  let charQueue = 0
  let enemyQueue = 0
  let enemyTarget = 0
  let charTurn = true

  const char = new SpriteNode({
    name: 'Char',
    layer: 1,
    costumes: [
      { name: 'char1_idle', data: 'images/chars/char1_idle.png', offsetX: 0, offsetY: -225 },
      { name: 'char1_walk1', data: 'images/chars/char1_walk1.png', offsetX: 0, offsetY: -225 },
      { name: 'char1_walk2', data: 'images/chars/char1_walk2.png', offsetX: 0, offsetY: -225 },
      { name: 'char2_idle', data: 'images/chars/char2_idle.png', offsetX: 0, offsetY: -190 },
      { name: 'char2_walk1', data: 'images/chars/char2_walk1.png', offsetX: 0, offsetY: -190 },
      { name: 'char2_walk2', data: 'images/chars/char2_walk2.png', offsetX: 0, offsetY: -190 },
      { name: 'char3_idle', data: 'images/chars/char3_idle.png', offsetX: 0, offsetY: -160 },
      { name: 'char3_walk1', data: 'images/chars/char3_walk1.png', offsetX: 0, offsetY: -160 },
      { name: 'char3_walk2', data: 'images/chars/char3_walk2.png', offsetX: 0, offsetY: -160 }
    ],
    sounds: {
      shoot: 'sounds/bow.ogg'
    },
    collision () {
      switch (team.local.index) {
        case 1:
          collisionRect(this, 0, -225, 96, 225)
          this.local.halfWidth = 48
          break
        case 2:
          collisionRect(this, 0, -192, 64, 192)
          this.local.halfWidth = 32
          break
        case 3:
          collisionRect(this, 0, -160, 100, 160)
          this.local.halfWidth = 50
          break
      }
    },
    // collision: [72, -128, 64, 64],
    start () {
      team.local.index = 1
      team.addChild(char.clone())
      team.local.index = 2
      team.addChild(char.clone())
      team.local.index = 3
      team.addChild(char.clone())
      team.forEach((char, index) => { char.x -= index * 150 })
      team.goto(0, 560)

      camera.update()

      const moveSpeed = 100

      forever(this, () => {
        if (E.mouseDown && !fight) {
          if (E.mouseX > team.x + camera.offsetX) {
            team.x += R.delay * moveSpeed
            team.local.teamMove = true
          } else {
            team.x -= R.delay * moveSpeed
            team.local.teamMove = true
          }
          camera.update()
        } else {
          team.local.teamMove = false
        }
      })
    },
    async wait () {
      const prefix = 'char' + this.local.index
      let animation = 0

      if (team.local.teamMove) animation = 1

      if (this.local.attack) animation = 2

      switch (animation) {
        case 0:
          this.switchCostumeTo(prefix + '_idle')
          break
        case 1:
          this.switchCostumeTo(prefix + '_walk1')
          await repeatUntil(() => team.local.teamMove === false, async () => {
            await waitSeconds(0.25)
            if (this.currentCostume !== prefix + '_walk2') {
              this.nextCostume()
            } else {
              this.switchCostumeTo(prefix + '_walk1')
            }
          })
          break
        case 2: {
          this.switchCostumeTo(prefix + '_walk1')
          await waitSeconds(0.25)
          const oldX = this.x
          this.x = 640
          const targetObj = enemiesNode.local.stats[enemyTarget]
          targetObj.hp -= Math.round(teamObj[charQueue].damage * (1.15 - Math.random() * 0.3))
          if (targetObj.hp < 0) targetObj.hp = 0
          await waitSeconds(0.25)
          this.switchCostumeTo(prefix + '_idle')
          await waitSeconds(0.25)
          this.x = oldX
          this.local.attack = false
          if (charQueue < team.getChildCount()) {
            charQueue++
          } else {
            broadcast('enemyTurn')
          }
          break
        }
      }
    },
    clone () {
      camera.add(this)
      this.local.index = team.local.index
      whenIReceive(this, 'char_attack', () => {
        if (this.local.index === charQueue + 1) {
          this.local.attack = true
        }
      })
    }
  })

  const enemy = new SpriteNode({
    name: 'Enemy',
    layer: 1,
    costumes: [
      { name: 'engineer_idle', data: 'images/enemies/engineer_idle.png', offsetX: 48, offsetY: -192 },
      { name: 'engineer_walk1', data: 'images/enemies/engineer_walk1.png', offsetX: 48, offsetY: -192 },
      { name: 'engineer_walk2', data: 'images/enemies/engineer_walk2.png', offsetX: 48, offsetY: -192 }
    ],
    sounds: {
      shoot: 'sounds/bow.ogg'
    },
    collision: [36, -128, 64, 64],
    async wait () {
      const prefix = this.local.type
      const enemies = this.node.parent

      let animation = 0

      if (enemies.local.move) animation = 1

      switch (animation) {
        case 0:
          this.switchCostumeTo(prefix + '_idle')
          break
        case 1:
          this.switchCostumeTo(prefix + '_walk1')
          await repeatUntil(() => enemies.local.move === false, async () => {
            await waitSeconds(0.25)
            if (this.currentCostume !== prefix + '_walk2') {
              this.nextCostume()
            } else {
              this.switchCostumeTo(prefix + '_walk1')
            }
          })
          break
      }
    },
    clone () {
      camera.add(this)
      this.whenThisSpriteClicked(() => {
        if (fight) {
          enemyTarget = this.local.index
        }
      })
    }
  })

  const background = new SpriteNode({
    name: 'Background',
    layer: 0,
    start () {
      this.show()
    },
    draw () {
      noStroke()
      fill('#eee')
      rect(0, 0, 1280, 500)
      fill('#777')
      rect(0, 500, 1280, 720)
      fill('#333')
      rect(0, 550, 1280, 720)
    }
  })

  const icon = new SpriteNode({
    name: 'Icon',
    layer: 1000,
    costumes: [
      { name: 'attack', data: 'images/gui/icon_attack.png' }
    ],
    collision: [0, 0, 64, 64],
    clone () {
      this.switchCostumeTo(this.local.type)
      this.whenThisSpriteClicked(this.local.f)
    }
  })

  const fightInterface = new SpriteNode({
    name: 'FightInterface',
    layer: 999,
    start () {
      const icons = new BasicNode('icons')
      this.local.icons = icons
      whenIReceive(this, 'fight', () => {
        charQueue = 0
        enemyQueue = 0
        charTurn = true
        fight = true
        icon.clone(icons, {
          type: 'attack',
          f: () => {
            if (charTurn) {
              broadcast('char_attack')
            }
          }
        })
        icons.goto(500, 565)
        this.show()
      })
    },
    draw () {
      if (fight) {
        const char = team.getChild(charQueue)
        const charObj = teamObj[charQueue]
        const enemy = enemiesNode.getChild(enemyQueue)
        const enemyObj = enemiesNode.local.stats[enemyQueue]
        const targetObj = enemiesNode.local.stats[enemyTarget]

        fill('white')
        font(24, 'Arial')
        text(charObj.name, 60, 600)
        if (charTurn) {
          text(targetObj.name, 900, 600)
        } else {
          text(enemyObj.name, 900, 600)
        }
        font(21, 'Arial')
        text('Damage: ' + charObj.damage, 60, 675)
        if (charTurn) {
          text('Damage: ' + targetObj.damage, 900, 675)
        } else {
          text('Damage: ' + enemyObj.damage, 900, 675)
        }
        noStroke()
        rect(60, 615, 300, 25)
        rect(900, 615, 300, 25)
        fill('red')
        rect(60, 615, 300 * (charObj.hp / charObj.maxHP), 25)
        if (charTurn) {
          rect(900, 615, 300 * (targetObj.hp / targetObj.maxHP), 25)
        } else {
          rect(900, 615, 300 * (enemyObj.hp / enemyObj.maxHP), 25)
        }
        fill('black')
        font(16, 'Arial')
        text(charObj.hp + ' / ' + charObj.maxHP, 90, 632)
        if (charTurn) {
          text(targetObj.hp + ' / ' + targetObj.maxHP, 930, 632)
        } else {
          text(enemyObj.hp + ' / ' + enemyObj.maxHP, 930, 632)
        }
        if (charTurn) {
          fill('blue')
          text('TURN', char.x + camera.offsetX - 25 + char.sprite.local.halfWidth, 545)
          fill('red')
          const target = enemiesNode.getChild(enemyTarget)
          text('Target', target.x + camera.offsetX - 25, 545)
        } else {
          fill('red')
          text('TURN', enemy.x + camera.offsetX - 25, 545)
        }
      }
    }
  })

  const rooms = {
    start: {
      teamX: 0,
      teamY: 560,
      data: [
        { name: 'enemy', type: ['engineer', 'engineer', 'engineer'], x: 950, y: 560 }
      ]
    },
    two: {
      teamX: 0,
      teamY: 560,
      data: [
        { name: 'Decoration', type: 'grass', x: 250, y: 500 },
        { name: 'Door', x: 25, y: 560, room: 'start', closed: true }
      ]
    }
  }

  const room = new BasicNode('room')
  room.local.name = 'start'

  function loadCurrentRoom () {
    const roomInfo = rooms[room.local.name]

    team.goto(roomInfo.teamX || 0, roomInfo.teamY || 560)

    const data = roomInfo.data
    for (let i = 0; i < data.length; i++) {
      switch (data[i].name) {
        case 'enemy': {
          const enemies = new BasicNode('enemies')
          enemies.local.move = false
          room.addChild(enemies)

          enemies.local.stats = []

          const enemyTypes = data[i].type
          for (let i = 0; i < enemyTypes.length; i++) {
            enemies.local.stats.push(Object.assign({}, enemiesObj[enemyTypes[i]]))
            enemy.clone(enemies, {
              type: enemyTypes[i],
              index: i
            })
          }

          enemies.forEach((enemy, index) => { enemy.x += index * 150 })

          enemies.goto(data[i].x, data[i].y)
          forever(enemies, () => {
            if (team.x > enemies.x - 700) {
              enemies.local.move = true
              enemies.x -= R.delay * 75
              if (team.x > enemies.x - 500) {
                enemies.local.move = false
                unsubscribe('forever', enemies)
                enemiesNode = enemies
                broadcast('fight')
              }
            }
          })
          break
        }
      }
    }

    camera.update()
  }

  beforeInit(() => {
    loadCurrentRoom()
  })
})
