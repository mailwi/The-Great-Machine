setup(function () {
  R.seeCollisions = false

  const obj = {
  }

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

    this.set('animation', 0)
    this.set('move', false)
    this.set('moveSpeed', 100)

    whenGameStart(this, async () => {
      this.goto(500, 64 * 7 + 32)

      await this.costumesLoaded
      await this.soundsLoaded

      forever(this, () => {
        if (E.mouseDown) {
          if (E.mouseX > this.x + 48) {
            this.x += R.delay * this.get('moveSpeed')
            this.mirror(false)
          } else {
            this.x -= R.delay * this.get('moveSpeed')
            this.mirror(true)
          }
          this.set('animation', 1)
        } else {
          this.set('animation', 0)
        }
      })

      foreverWait(this, async () => {
        const animation = this.get('animation')
        switch (animation) {
          case 0:
            this.switchCostumeTo('idle')
            break
          case 1:
            this.switchCostumeTo('walk1')
            await repeatUntil(() => this.get('animation') !== 1, async () => {
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
      i = 0
      while (i < 20) {
        groundX = i * 64
        groundY = j * 64
        createCloneOfMySelf(this)
        i++
      }
      j++
    })

    this.draw(() => {
      drawCostume(this)
    })

    whenKeyPressed(this, 'KeyS', () => {
      console.log('new')
      createCloneOfMySelf(this)
    })

    this.whenIStartAsAClone(() => {
      this.switchCostumeTo(groundType)
      noStroke()
      this.goto(groundX, groundY)
    })
  })

  createSprite('OpenObject', function () {
    addCostumes(this, [
      {name: 'chest', data: 'images/shoot.png'},
      {name: 'chest1', data: 'images/platformPack_tile004.png'}
    ])

    collisionRect(this, 0, 0, 64, 64)

    this.set('collect', 0)

    whenGameStart(this, async () => {
      await this.costumesLoaded
      this.goto(704, 512)
    })

    this.whenThisSpriteClicked(()  => {
      if (touching(this, 'Char')){
        this.set('collect', 1)
      }
    })
    
    foreverWait(this, async () => {
      const collect = this.get('collect')
      switch(collect) {
        case 0:
          this.switchCostumeTo('chest')
          break
        case 1:
          this.switchCostumeTo('chest1')
      }
    })

    this.draw(() => {
      drawCostume(this)
    })
  })

})