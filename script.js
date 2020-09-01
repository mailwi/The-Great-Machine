setup(function () {
  R.seeCollisions = true

  let teamX = 500
  let teamY = 64 * 7 + 32
  let teamMove = false

  const team = []

  createSprite('Char', function () {
    addCostumes(this, [
      { name: 'idle', data: 'images/platformChar_idle.png' },
      { name: 'walk1', data: 'images/platformChar_walk1.png' },
      { name: 'walk2', data: 'images/platformChar_walk2.png' }
    ])

    addSounds(this, {
      shoot: 'sounds/bow.ogg'
    })

    collisionRect(this, 25, 32, 50, 50)

    whenGameStart(this, async () => {
      // this.goto(500, 64 * 7 + 32)
      await this.costumesLoaded
      await this.soundsLoaded

      this.hide()

      this.set('moveSpeed', 100)

      forever(this, () => {
        if (E.mouseDown) {
          if (E.mouseX > teamX + 48) {
            teamX += R.delay * this.get('moveSpeed')
          } else {
            teamX -= R.delay * this.get('moveSpeed')
          }
          teamMove = true
        } else {
          teamMove = false
        }
      })

      createCloneOfMySelf(this)
      createCloneOfMySelf(this)
      createCloneOfMySelf(this)
      createCloneOfMySelf(this)
    })

    this.whenIStartAsAClone(() => {
      this.set('order', team.length)
      team.push({})

      this.show()

      this.set('animation', 0)

      forever(this, () => {
        this.goto(teamX - 100 * this.get('order'), teamY)
      })

      foreverWait(this, async () => {
        let animation = this.get('animation')

        if (teamMove) animation = 1

        switch (animation) {
          case 0:
            this.switchCostumeTo('idle')
            break
          case 1:
            this.switchCostumeTo('walk1')
            await repeatUntil(() => teamMove === false, async () => {
              await waitSeconds(0.25)
              if (this.currentCostume !== 'walk2') {
                this.nextCostume()
              } else {
                this.switchCostumeTo('walk1')
              }
            })
            break
        }

        goToFrontLayer(this)
      })
    })

    this.draw(() => {
      drawCostume(this)
    })
  })

  let groundType = 'grass'
  let groundX = 0
  let groundY = 576

  createSprite('Ground', function () {
    addCostumes(this, [
      { name: 'grass', data: 'images/platformPack_tile001.png' },
      { name: 'ground', data: 'images/platformPack_tile004.png' }
    ])

    collisionRect(this, 0, 0, 64, 64)

    whenGameStart(this, async () => {
      this.hide()
      await this.costumesLoaded

      let i = 0
      groundType = 'grass'
      while (i < 20) {
        groundX = i * 64
        createCloneOfMySelf(this)
        i++
      }

      groundType = 'ground'
      let j = 10
      while (j < 12) {
        i = 0
        while (i < 20) {
          groundX = i * 64
          groundY = j * 64
          createCloneOfMySelf(this)
          i++
        }
        j++
      }
    })

    this.whenIStartAsAClone(() => {
      this.show()
      this.switchCostumeTo(groundType)
      noStroke()
      this.goto(groundX, groundY)
    })

    this.draw(() => {
      drawCostume(this)
    })
  })
})
