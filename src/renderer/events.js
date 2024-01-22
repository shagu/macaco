class Events {
  on = {}

  register (ev, callback) {
    this.on[ev] = this.on[ev] || []
    this.on[ev].push(callback)
  }

  invoke (ev, ...args) {
    this.on[ev] = this.on[ev] || []
    for (const callback of this.on[ev]) {
      callback(ev, ...args)
    }
  }

  bind (source, target) {
    this.register(source, (ev, ...args) => {
      this.invoke(target, ...args)
    })
  }
}

module.exports = new Events()
