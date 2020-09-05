class Camera {
  constructor (data, x, y) {
    this.data = data
    this.x = x
    this.y = y

    this.offsetX = this.x - this.data.x
    this.offsetY = this.y - this.data.y
    this.sprites = []
  }

  add (sprite) {
    whenIReceive(sprite, 'camera', () => {
      sprite.drawX = this.offsetX
      sprite.drawY = this.offsetY
    })
  }

  update () {
    this.offsetX = this.x - this.data.x
    this.offsetY = this.y - this.data.y
    broadcast('camera')
  }
}
