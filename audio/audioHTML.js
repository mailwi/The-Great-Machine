class AudioEngine {
  async addSounds (sprite, sounds) {
    function getSound (data) {
      return new Promise((resolve) => {
        const sound = new Audio(data)
        sound.addEventListener('canplaythrough', () => resolve(sound))
      })
    }

    for (const name in sounds) {
      sprite.sounds[name] = await getSound(sounds[name])
    }
  }

  async playSoundUntilDone (sprite, name, instanceSound = false) {
    function soundEnded (sound) {
      return new Promise((resolve) => {
        const soundFunc = () => {
          sound.removeEventListener('ended', soundFunc)
          resolve()
        }
        sound.addEventListener('ended', soundFunc)
      })
    }

    let sound
    if (!instanceSound) {
      sound = sprite.sounds[name]
    } else {
      sound = new Audio(sprite.sounds[name].src)
    }

    sound.play()
    await soundEnded(sound)
  }

  startSound (sprite, name, instanceSound = false) {
    let sound
    if (!instanceSound) {
      sound = sprite.sounds[name]
    } else {
      sound = new Audio(sprite.sounds[name].src)
    }

    sound.play()
  }

  pauseSound (sprite, name) {
    sprite.sounds[name].pause()
  }

  stopSound (sprite, name) {
    sprite.sounds[name].pause()
    sprite.sounds[name].currentTime = 0
  }

  changeVolumeBy (sprite, name, value) {
    sprite.sounds[name].volume += value
  }

  setVolumeTo (sprite, name, value) {
    sprite.sounds[name].volume = value
  }

  getVolume (sprite, name) {
    return sprite.sounds[name].volume
  }

  getSound (sprite, name) {
    return sprite.sounds[name]
  }
}

const A = new AudioEngine()
