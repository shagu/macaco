class Queue {
  promises = {}
  tasks = {}

  async worker (name) {
    while (this.tasks[name][0]) {
      await this.tasks[name][0]()
      this.tasks[name].shift()
    }

    this.promises[name] = false
  }

  async add (name, task) {
    this.tasks[name] = this.tasks[name] || []
    this.tasks[name].push(task)

    if (!this.promises[name]) {
      this.promises[name] = this.worker(name)
    }

    return this.promises[name]
  }
}

module.exports = new Queue()
