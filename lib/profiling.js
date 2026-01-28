export class SimpleProfiler {
  constructor() {
    this.memory = {};
    this.starts = {};
  }
  
  start(category) {
    if (!this.memory.hasOwnProperty(category))
      this.memory[category] = 0;
    this.starts[category] = Date.now();
  }

  stop(category, callback = () => {}) {
    if (!this.memory.hasOwnProperty(category))
      this.memory[category] = 0;
    const stopTime = Date.now();
    const duration = stopTime - this.starts[category];
    this.memory[category] += duration;
    if (callback) callback(this.memory[category]);
  }

  getTime(category) {
    if (!this.memory.hasOwnProperty(category))
      return null;
    return this.memory[category];
  }

  dump() {
    const lines = Object.entries(this.memory).map(([category, duration]) => `${category}: ${duration / 1000} sec`);
    console.log(lines.join("\n"));
  }
}
