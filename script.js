setup(function () {
  R.seeCollisions = false

  const team = new BasicNode('team')

  const camera = new Camera(team, 330, 525)
  camera.add(team)

  const teamObj = [
    {
      name: 'Daddy',
      hp: 250,
      maxHP: 250,
      baseDamage: 30,
      damage: 30,
      damageAbsorption: 25
    },
    {
      name: 'Atreus',
      hp: 100,
      maxHP: 100,
      baseDamage: 50,
      damage: 50
    },
    {
      name: 'Scylla',
      hp: 175,
      maxHP: 175,
      baseDamage: 10,
      damage: 10
    }
  ]

  let enemiesNode = null

  const enemiesObj = {
    meat: {
      name: 'Meat',
      type: 'meat',
      hp: 50,
      maxHP: 50,
      damage: 15
    },
    ghost: {
      name: 'Ghost',
      type: 'ghost',
      hp: 65,
      maxHP: 65,
      damage: 30
    },
    spider: {
      name: 'Spider',
      type: 'spider',
      hp: 200,
      maxHP: 200,
      damage: 15,
      damageAbsorption: 10
    },
    turret: {
      name: 'Turret',
      type: 'turret',
      hp: 40,
      maxHP: 40,
      damage: 55
    },
    umbrella: {
      name: 'Umbrella',
      type: 'umbrella',
      hp: 250,
      maxHP: 250,
      damage: 30,
      damageAbsorption: 25
    }
  }

  let fight = false

  let selectedChar = 0

  let charQueue = 0
  let charTarget = 0
  let charKilledCount = 0
  let enemyQueue = 0
  let enemyTarget = 0
  let enemyKilledCount = 0
  let charTurn = true

  let lose = false

  let upgrading = false

  let spares = 0

  const char = new SpriteNode({
    name: 'Char',
    layer: 3,
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

      let moveDelay = false

      foreverWait(this, async () => {
        if (E.mouseDown) {
          if (moveDelay && !fight && !lose && !upgrading) {
            if (E.mouseX > team.x + camera.offsetX) {
              if (team.x < (room.local.max || 99999)) {
                team.x += R.delay * moveSpeed
                team.local.teamMove = true
              } else {
                room.local.name = room.local.maxGoto
                loadCurrentRoom()
              }
            } else if (team.x > 0) {
              team.x -= R.delay * moveSpeed
              team.local.teamMove = true
            }
            camera.update()
          }
          if (!moveDelay) {
            await waitSeconds(0.1)
            moveDelay = true
          }
        } else {
          moveDelay = false
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
          this.x = team.x + Math.round(Math.abs(team.x - enemiesNode.x) / 2)

          const targetObj = enemiesNode.local.stats[enemyTarget]
          const fullDamage = Math.round(teamObj[charQueue].damage * (1.15 - Math.random() * 0.3))
          let damage = fullDamage

          const stats = enemiesNode.local.stats
          for (let i = 0; i < stats.length; i++) {
            if (stats[i].damageAbsorption && stats[i] !== targetObj) {
              const absorbedDamage = Math.round(fullDamage * (stats[i].damageAbsorption / 100))
              if (stats[i].hp - absorbedDamage > 0) {
                damage -= absorbedDamage
                stats[i].hp -= absorbedDamage
              }
            }
          }

          targetObj.hp -= damage

          const enemiesLength = enemiesNode.getChildCount()
          if (targetObj.hp <= 0) {
            targetObj.hp = 0
            enemiesNode.getChild(enemyTarget).sprite.hide()
            enemyKilledCount++
            if (enemyKilledCount < enemiesLength) {
              enemyTarget = 0
              while (enemiesNode.local.stats[enemyTarget].hp <= 0) {
                enemyTarget++
              }
            }
          }
          await waitSeconds(0.25)
          this.switchCostumeTo(prefix + '_idle')
          await waitSeconds(0.25)
          this.x = oldX
          this.local.attack = false
          if (enemyKilledCount < enemiesLength) {
            if (charQueue < team.getChildCount() - 1) {
              charQueue++
              while (charQueue < team.getChildCount() - 1 && teamObj[charQueue].hp <= 0) {
                charQueue++
              }
              if (teamObj[charQueue].hp <= 0) {
                charQueue = 0
                charTurn = false
                broadcast('enemy_attack')
              }
            } else {
              charQueue = 0
              charTurn = false
              broadcast('enemy_attack')
            }
          } else {
            broadcast('win')
            enemiesNode.local.data.killed = true
            enemiesNode.deleteThis()
          }
          break
        }
      }
    },
    clone () {
      camera.add(this)
      this.local.index = team.local.index

      this.whenThisSpriteClicked(() => {
        if (!fight) {
          selectedChar = this.local.index - 1
        }
      })

      whenIReceive(this, 'char_attack', () => {
        if (teamObj[charQueue].hp > 0) {
          if (this.local.index === charQueue + 1) {
            this.local.attack = true
          }
        } else if (charQueue < team.getChildCount() - 1) {
          charQueue++
        } else {
          charQueue = 0
          charTurn = false
          broadcast('enemy_attack')
        }
      })
    }
  })

  const enemy = new SpriteNode({
    name: 'Enemy',
    layer: 3,
    costumes: [
      { name: 'meat_idle', data: 'images/enemies/meat_idle.png', offsetX: 0, offsetY: -175 },
      { name: 'meat_walk1', data: 'images/enemies/meat_walk1.png', offsetX: 0, offsetY: -175 },
      { name: 'meat_walk2', data: 'images/enemies/meat_walk2.png', offsetX: 0, offsetY: -175 },
      { name: 'ghost_idle', data: 'images/enemies/ghost_idle.png', offsetX: -65, offsetY: -190 },
      { name: 'ghost_walk1', data: 'images/enemies/ghost_walk1.png', offsetX: -65, offsetY: -190 },
      { name: 'ghost_walk2', data: 'images/enemies/ghost_walk2.png', offsetX: -65, offsetY: -190 },
      { name: 'spider_idle', data: 'images/enemies/spider_idle.png', offsetX: -10, offsetY: -145 },
      { name: 'spider_walk1', data: 'images/enemies/spider_walk1.png', offsetX: -10, offsetY: -145 },
      { name: 'spider_walk2', data: 'images/enemies/spider_walk2.png', offsetX: -10, offsetY: -145 },
      { name: 'turret_idle', data: 'images/enemies/turret_idle.png', offsetX: -65, offsetY: -192 },
      { name: 'turret_walk1', data: 'images/enemies/turret_walk1.png', offsetX: -65, offsetY: -192 },
      { name: 'turret_walk2', data: 'images/enemies/turret_walk2.png', offsetX: -65, offsetY: -192 },
      { name: 'umbrella_idle', data: 'images/enemies/umbrella_idle.png', offsetX: -65, offsetY: -198 },
      { name: 'umbrella_walk1', data: 'images/enemies/umbrella_walk1.png', offsetX: -65, offsetY: -198 },
      { name: 'umbrella_walk2', data: 'images/enemies/umbrella_walk2.png', offsetX: -65, offsetY: -198 }
    ],
    sounds: {
      shoot: 'sounds/bow.ogg'
    },
    collision () {
      switch (this.local.type) {
        case 'meat':
          collisionRect(this, 0, -175, 64, 175)
          this.local.halfWidth = 32
          break
        case 'ghost':
          collisionRect(this, -50, -190, 150, 160)
          this.local.halfWidth = 32
          break
        case 'spider':
          collisionRect(this, -15, -150, 95, 160)
          this.local.halfWidth = 36
          break
        case 'turret':
          collisionRect(this, -70, -190, 165, 160)
          this.local.halfWidth = 18
          break
        case 'umbrella':
          collisionRect(this, -70, -195, 170, 195)
          this.local.halfWidth = 20
          break
      }
    },
    async wait () {
      const prefix = this.local.type
      const enemies = this.node.parent

      let animation = 0

      if (enemies.local.move) animation = 1

      if (this.local.attack) animation = 2

      switch (animation) {
        case 0:
          this.switchCostumeTo(prefix + '_idle')
          break
        case 1:
          this.switchCostumeTo(prefix + '_walk1')
          await repeatUntil(() => enemies.local.move === false, async () => {
            await waitSeconds(0.25)
            if (!upgrading) {
              if (this.currentCostume !== prefix + '_walk2') {
                this.nextCostume()
              } else {
                this.switchCostumeTo(prefix + '_walk1')
              }
            }
          })
          break
        case 2: {
          this.switchCostumeTo(prefix + '_walk1')
          await waitSeconds(0.25)
          const oldX = this.x
          this.x = enemiesNode.x - Math.round(Math.abs(team.x - enemiesNode.x) / 2)
          const targetObj = teamObj[charTarget]
          const damage = Math.round(enemiesNode.local.stats[enemyQueue].damage * (1.15 - Math.random() * 0.3))
          const absorbedDamage = Math.round(damage * (teamObj[0].damageAbsorption / 100))
          if (teamObj[0].hp - absorbedDamage > 0) {
            targetObj.hp -= Math.round(damage * ((100 - teamObj[0].damageAbsorption) / 100))
            teamObj[0].hp -= absorbedDamage
          } else {
            targetObj.hp -= damage
          }

          if (targetObj.hp <= 0) {
            targetObj.hp = 0
            team.getChild(charTarget).sprite.hide()
            charKilledCount++
          }
          await waitSeconds(1)
          this.switchCostumeTo(prefix + '_idle')
          await waitSeconds(0.25)
          this.x = oldX
          this.local.attack = false
          if (charKilledCount < team.getChildCount()) {
            if (enemyQueue < enemiesNode.getChildCount() - 1) {
              enemyQueue++
              broadcast('enemy_attack')
            } else {
              enemyQueue = 0

              charQueue = 0
              while (teamObj[charQueue].hp <= 0) {
                charQueue++
              }

              charTurn = true
            }
          } else {
            broadcast('lose')
          }
          break
        }
      }
    },
    clone () {
      camera.add(this)

      this.whenThisSpriteClicked(() => {
        if (fight && charTurn) {
          enemyTarget = this.local.index - 1
        }
      })

      whenIReceive(this, 'enemy_attack', () => {
        if (enemiesNode === this.node.parent) {
          if (this.local.index === enemyQueue + 1) {
            if (enemiesNode.local.stats[enemyQueue].hp > 0) {
              charTarget = Math.round(Math.random() * (team.getChildCount() - 1))
              while (teamObj[charTarget].hp <= 0) {
                charTarget = Math.round(Math.random() * (team.getChildCount() - 1))
              }
              this.local.attack = true
            } else if (enemyQueue < enemiesNode.getChildCount() - 1) {
              enemyQueue++
              broadcast('enemy_attack')
            } else {
              enemyQueue = 0
              charTurn = true
            }
          }
        }
      })
    }
  })

  const background = new SpriteNode({
    name: 'Background',
    layer: 0,
    costumes: [
      { name: 'lvl1', data: 'images/map/lvl1.png' },
      { name: 'lvl2', data: 'images/map/lvl2.png' },
      { name: 'lvl3', data: 'images/map/lvl3.png' },
      { name: 'lvl4', data: 'images/map/lvl4.png' }
    ],
    start () {
      this.show()
      whenIReceive(this, 'new_room', () => {
        if (room.local.name.indexOf('lvl') !== -1) {
          this.switchCostumeTo(room.local.name)
        }
      })
    },
    draw () {
      if (room.local.name.indexOf('lvl') === -1) {
        noStroke()
        fill('black')
        rect(0, 0, 1280, 200)
        fill('#999')
        rect(0, 200, 1280, 300)
      }
      if (room.local.name !== 'lvl3' && room.local.name !== 'lvl4') {
        fill('#777')
        rect(0, 500, 1280, 720)
        fill('#333')
        rect(0, 550, 1280, 720)
      }
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

  const infoInterface = new SpriteNode({
    name: 'InfoInterface',
    layer: 999,
    start () {
      this.show()
    },
    draw () {
      if (!fight && !lose) {
        const charObj = teamObj[selectedChar]

        noStroke()
        fill('white')
        font(24, 'Arial')
        text(charObj.name, 60, 600)
        font(21, 'Arial')
        text('Damage: ' + charObj.damage, 60, 675)
        if (charObj.damageAbsorption) {
          text('Damage absorption: ' + charObj.damageAbsorption, 210, 675)
        }
        noStroke()
        rect(60, 615, 300, 25)
        fill('red')
        rect(60, 615, 300 * (charObj.hp / charObj.maxHP), 25)
        fill('#fff')
        text('Spares: ' + spares, 255, 600)
        fill('black')
        font(16, 'Arial')
        text(charObj.hp + ' / ' + charObj.maxHP, 90, 632)
      }
    }
  })

  const fightInterface = new SpriteNode({
    name: 'FightInterface',
    layer: 999,
    start () {
      const icons = new BasicNode('icons')
      this.local.icons = icons
      icon.clone(icons, {
        type: 'attack',
        f: () => {
          if (charTurn) {
            broadcast('char_attack')
          }
        }
      })
      icons.goto(500, 565)
      icons.getChild(0).sprite.hide()

      this.local.win = false

      whenIReceive(this, 'fight', () => {
        charQueue = 0
        charTarget = 0
        charKilledCount = 0
        enemyQueue = 0
        enemyTarget = 0
        enemyKilledCount = 0
        charQueue = 0
        enemyQueue = 0
        charTurn = true
        fight = true
        icons.getChild(0).sprite.show()
        infoInterface.sprite.hide()
        this.show()
      })

      whenIReceive(this, 'win', async () => {
        fight = false
        icons.getChild(0).sprite.hide()
        infoInterface.sprite.show()
        spares += enemiesNode.local.spares
        this.local.i = 0
        this.local.win = true
        await repeatUntil(() => this.local.i === 500, async () => {
          this.local.i++
        })
        delete this.local.i
        this.local.win = false
        this.hide()
      })

      whenIReceive(this, 'lose', () => {
        fight = false
        lose = true
        icons.getChild(0).sprite.hide()
        infoInterface.sprite.hide()
      })
    },
    draw () {
      if (fight) {
        const char = team.getChild(charQueue)
        const charObj = teamObj[charQueue]
        const targetCharObj = teamObj[charTarget]
        const enemy = enemiesNode.getChild(enemyQueue)
        const enemyObj = enemiesNode.local.stats[enemyQueue]
        const targetEnemyObj = enemiesNode.local.stats[enemyTarget]

        noStroke()
        fill('white')
        font(24, 'Arial')
        if (charTurn) {
          text(charObj.name, 60, 600)
          text(targetEnemyObj.name, 900, 600)
        } else {
          text(targetCharObj.name, 60, 600)
          text(enemyObj.name, 900, 600)
        }
        font(21, 'Arial')
        if (charTurn) {
          text('Damage: ' + charObj.damage, 60, 675)
          text('Damage: ' + targetEnemyObj.damage, 900, 675)
        } else {
          text('Damage: ' + targetCharObj.damage, 60, 675)
          text('Damage: ' + enemyObj.damage, 900, 675)
        }
        noStroke()
        rect(60, 615, 300, 25)
        rect(900, 615, 300, 25)
        fill('red')
        if (charTurn) {
          rect(60, 615, 300 * (charObj.hp / charObj.maxHP), 25)
          rect(900, 615, 300 * (targetEnemyObj.hp / targetEnemyObj.maxHP), 25)
        } else {
          rect(60, 615, 300 * (targetCharObj.hp / targetCharObj.maxHP), 25)
          rect(900, 615, 300 * (enemyObj.hp / enemyObj.maxHP), 25)
        }
        fill('black')
        font(16, 'Arial')
        if (charTurn) {
          text(charObj.hp + ' / ' + charObj.maxHP, 90, 632)
          text(targetEnemyObj.hp + ' / ' + targetEnemyObj.maxHP, 930, 632)
        } else {
          text(targetCharObj.hp + ' / ' + targetCharObj.maxHP, 90, 632)
          text(enemyObj.hp + ' / ' + enemyObj.maxHP, 930, 632)
        }
        if (charTurn) {
          fill('blue')
          text('TURN', char.x + camera.offsetX - 25 + char.sprite.local.halfWidth, 545)
          fill('red')
          const target = enemiesNode.getChild(enemyTarget)
          text('Target', target.x + camera.offsetX - 25 + target.sprite.local.halfWidth, 545)
        } else {
          fill('red')
          text('TURN', enemy.x + camera.offsetX - 25 + enemy.sprite.local.halfWidth, 545)
          fill('blue')
          const target = team.getChild(charTarget)
          text('Target', target.x + camera.offsetX - 25 + target.sprite.local.halfWidth, 545)
        }
      }

      if (this.local.win) {
        fill('green')
        font(32, 'Arial')
        text('+' + enemiesNode.local.spares + ' spares', 610, 360 - this.local.i / 10)
      }

      if (lose) {
        fill('red')
        font(64, 'Arial')
        text('ROBOTS WERE DESTROYED!', 165, 100)
      }
    }
  })

  const door = new SpriteNode({
    name: 'Door',
    layer: 1,
    costumes: [
      { name: 'door', data: 'images/interact/door.png', offsetX: 0, offsetY: -192 },
      { name: 'door_open', data: 'images/interact/door_open.png', offsetX: 0, offsetY: -192 },
      { name: 'door_close', data: 'images/interact/door_close.png', offsetX: 0, offsetY: -192 }
    ],
    collision: [0, -192, 128, 192],
    async wait () {
      let animation = 0

      if (touching(this, 'Char') && !fight) animation = 1

      if (this.local.closed) animation = 2

      switch (animation) {
        case 0:
          this.switchCostumeTo('door')
          break
        case 1:
          this.switchCostumeTo('door_open')
          break
        case 2:
          this.switchCostumeTo('door_close')
          break
      }
    },
    clone () {
      camera.add(this)
      this.whenThisSpriteClicked(() => {
        if (touching(this, 'Char') && !fight) {
          room.local.name = this.local.data.room
          loadCurrentRoom()
        }
      })
    }
  })

  const repair = new SpriteNode({
    name: 'RepairStation',
    layer: 1,
    costumes: [
      { name: 'repair_off', data: 'images/interact/repair_station.png', offsetX: 0, offsetY: -83 },
      { name: 'repair_on', data: 'images/interact/repair_station_on.png', offsetX: 0, offsetY: -83 }
    ],
    collision: [0, -83, 125, 83],
    async wait () {
      let animation = 0

      if (touching(this, 'Char') && !fight && spares > 0) animation = 1

      switch (animation) {
        case 0:
          this.switchCostumeTo('repair_off')
          break
        case 1:
          this.switchCostumeTo('repair_on')
          break
      }
    },
    clone () {
      camera.add(this)
      this.whenThisSpriteClicked(() => {
        if (touching(this, 'Char') && !fight && spares > 0) {
          const char = teamObj[selectedChar]
          if (char.hp < char.maxHP) {
            const needHP = Math.floor(char.maxHP - char.hp)
            if (spares >= needHP) {
              char.hp = char.maxHP
              spares -= needHP
            } else {
              char.hp += Math.floor(spares)
              spares = 0
            }
          }
        }
      })
    },
    draw () {
      if (touching(this, 'Char') && !fight && spares > 0) {
        const char = teamObj[selectedChar]
        if (char.hp < char.maxHP) {
          fill('red')
        } else {
          fill('#00ff00')
        }
        font(12, 'Arial')
        text(char.name, this.x + camera.offsetX + 45, this.y + camera.offsetY - 5)
      }
    }
  })

  const btn = new SpriteNode({
    name: 'btn',
    layer: 1000,
    collision () {
      collisionRect(this, 0, 0, this.local.width || 96, this.local.height || 36)
    },
    clone () {
      this.whenThisSpriteClicked(this.local.f)
    },
    draw () {
      fill('#333')
      rect(this.x, this.y, this.local.width || 96, this.local.height || 36)
      fill('white')
      font(18, 'Arial')
      text(this.local.text, this.x + 5, this.y + (this.local.height || 36) / 2 + 5)
    }
  })

  const upgrade = new SpriteNode({
    name: 'UpgradeStation',
    layer: 2,
    costumes: [
      { name: 'upgrade_off', data: 'images/interact/upgrade_station.png', offsetX: 0, offsetY: -83 },
      { name: 'upgrade_on', data: 'images/interact/upgrade_station_on.png', offsetX: 0, offsetY: -83 }
    ],
    collision: [0, -83, 138, 83],
    async wait () {
      let animation = 0

      if (touching(this, 'Char') && !fight && spares >= 0) animation = 1

      switch (animation) {
        case 0:
          this.switchCostumeTo('upgrade_off')
          break
        case 1:
          this.switchCostumeTo('upgrade_on')
          break
      }
    },
    start () {
      const upgradeGUI = new BasicNode('upgradeGUI')
      btn.clone(upgradeGUI, {
        text: 'UPGRADE',
        width: 100,
        f () {
          const selectedObj = teamObj[selectedChar]
          const cost = Math.round(selectedObj.maxHP / 2)
          if (spares >= cost) {
            spares -= cost
            selectedObj.hp += 50
            selectedObj.maxHP += 50
          }
        }
      })
      btn.clone(upgradeGUI, {
        text: 'UPGRADE',
        width: 100,
        f () {
          const selectedObj = teamObj[selectedChar]
          const cost = Math.round(selectedObj.damage * 2)
          if (spares >= cost) {
            spares -= cost
            selectedObj.damage += 5
          }
        }
      })
      this.local.absorptionBtn = btn.clone(upgradeGUI, {
        text: 'UPGRADE',
        width: 100,
        f () {
          const selectedObj = teamObj[selectedChar]
          const cost = Math.round(selectedObj.damageAbsorption * 4)
          if (spares >= cost) {
            spares -= cost
            selectedObj.damageAbsorption += 5
          }
        }
      })
      btn.clone(upgradeGUI, {
        text: 'Close',
        width: 90,
        f: () => {
          upgrading = false
          upgradeGUI.forEach(node => node.sprite.hide())
        }
      }).goto(15, -200)
      upgradeGUI.forEach((node, index) => {
        node.sprite.hide()
        node.y += index * 45
      })
      upgradeGUI.goto(800, 95)
      this.local.upgradeGUI = upgradeGUI
    },
    clone () {
      camera.add(this)
      upgrading = false
      this.whenThisSpriteClicked(() => {
        if (touching(this, 'Char') && !fight && spares >= 0) {
          upgrading = true
          this.local.upgradeGUI.forEach(node => node.sprite.show())
        }
      })
    },
    draw () {
      if (upgrading) {
        fill('#444')
        stroke('black')
        rect(350, 15, 570, 225)
        fill('white')
        noStroke()
        font(32, 'Arial')
        const selectedObj = teamObj[selectedChar]
        text(selectedObj.name, 375, 75)
        font(24, 'Arial')
        text('MAX HP: ' + selectedObj.maxHP + '   Cost: ' + Math.round(selectedObj.maxHP / 2), 375, 125)
        text('DAMAGE: ' + selectedObj.damage + '    Cost: ' + Math.round(selectedObj.damage * 2), 375, 170)
        if (selectedObj.damageAbsorption) {
          if (selectedObj.damageAbsorption < 50) {
            this.local.absorptionBtn.sprite.show()
          } else {
            this.local.absorptionBtn.sprite.hide()
          }
          text('ABSORPTION: ' + selectedObj.damageAbsorption + '   Cost: ' + Math.round(selectedObj.damageAbsorption * 4), 375, 215)
        } else {
          this.local.absorptionBtn.sprite.hide()
        }
      }
    }
  })

  const decoration = new SpriteNode({
    name: 'Decoration',
    layer: 1,
    costumes: [
      { name: 'bank1', data: 'images/map/bank1.png', offsetX: 0, offsetY: 0 },
      { name: 'bank2', data: 'images/map/bank2.png', offsetX: 0, offsetY: 0 },
      { name: 'bank3', data: 'images/map/bank3.png', offsetX: 0, offsetY: 0 }
    ],
    clone () {
      camera.add(this)
      this.switchCostumeTo(this.local.type)
    }
  })

  // meat, ghost, spider, turret, umbrella
  const rooms = {
    lvl1: {
      teamX: 0,
      teamY: 560,
      data: [
        // { name: 'upgrade', x: 250, y: 500 },
        // { name: 'door', x: 100, y: 535, room: 'two' },
        { name: 'decoration', type: 'bank1', x: 250, y: 360 },
        // { name: 'repair', x: 250, y: 500 },
        // { name: 'enemy', type: ['meat'], x: 950, y: 560 },
        // { name: 'enemy', type: ['meat', 'meat'], x: 1250, y: 560 },
        { name: 'enemy', type: ['meat', 'spider'], x: 550, y: 560 },
        { name: 'enemy', type: ['meat', 'meat'], x: 1250, y: 560 }
        // { name: 'enemy', type: ['ghost', 'ghost'], x: 2650, y: 560 }
      ],
      max: 2100,
      maxGoto: 'two'
    },
    two: {
      teamX: 0,
      teamY: 560,
      data: [
        { name: 'door', x: 10, y: 535, room: 'lvl1' },
        { name: 'enemy', type: ['meat'], x: 300, y: 560 }
      ],
      max: 300
    }
  }

  const room = new BasicNode('room')
  room.local.name = 'lvl1'

  function loadCurrentRoom () {
    room.removeDeepSprites()
    const roomInfo = rooms[room.local.name]

    room.local.max = roomInfo.max
    room.local.maxGoto = roomInfo.maxGoto

    team.goto(roomInfo.teamX || 0, roomInfo.teamY || 560)

    const data = roomInfo.data
    for (let i = 0; i < data.length; i++) {
      switch (data[i].name) {
        case 'decoration': {
          const decorationClone = decoration.clone(room, {
            data: data[i],
            type: data[i].type
          })
          decorationClone.goto(data[i].x, data[i].y)
          room.addChild(decorationClone)
          break
        }
        case 'repair': {
          const repairClone = repair.clone(room, {
            data: data[i]
          })
          repairClone.goto(data[i].x, data[i].y)
          room.addChild(repairClone)
          break
        }
        case 'upgrade': {
          const upgradeClone = upgrade.clone(room, {
            data: data[i]
          })
          upgradeClone.goto(data[i].x, data[i].y)
          room.addChild(upgradeClone)
          break
        }
        case 'door': {
          const doorClone = door.clone(room, {
            data: data[i],
            open: false,
            closed: data[i].closed
          })
          doorClone.goto(data[i].x, data[i].y)
          room.addChild(doorClone)
          break
        }
        case 'enemy': {
          if (!data[i].killed) {
            const enemies = new BasicNode('enemies')
            enemies.local.move = false
            room.addChild(enemies)

            enemies.local.data = data[i]
            enemies.local.stats = []
            enemies.local.spares = 0

            const enemyTypes = data[i].type
            for (let i = 0; i < enemyTypes.length; i++) {
              enemies.local.stats.push(Object.assign({}, enemiesObj[enemyTypes[i]]))
              enemy.clone(enemies, {
                type: enemyTypes[i],
                index: i + 1
              })
              const obj = enemiesObj[enemyTypes[i]]
              enemies.local.spares += Math.round((obj.maxHP + obj.damage * 2.5 + (obj.damageAbsorption ? obj.damageAbsorption * 3 : 0)) / 5)
            }

            enemies.forEach((enemy, index) => { enemy.x += index * 150 })

            enemies.goto(data[i].x, data[i].y)
            forever(enemies, () => {
              if (team.x > enemies.x - 700 && !fight && !upgrading) {
                enemies.local.move = true
                enemies.x -= R.delay * 150
                if (team.x > enemies.x - 450 && !fight && !upgrading) {
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
    }

    broadcast('new_room')

    camera.update()
  }

  beforeInit(() => {
    loadCurrentRoom()
  })
})
