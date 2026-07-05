class ObjectPool {
  constructor(factory, reset, maxSize = 200) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
    this.pool = [];
    this.active = [];
  }

  get() {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
    } else {
      obj = this.factory();
    }
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx >= 0) this.active.splice(idx, 1);
    if (this.reset) this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  releaseAll() {
    while (this.active.length > 0) {
      const obj = this.active.pop();
      if (this.reset) this.reset(obj);
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
  }

  get activeCount() { return this.active.length; }
  get poolSize() { return this.pool.length; }

  disposeAll(disposeFn) {
    this.releaseAll();
    this.pool.forEach(obj => { if (disposeFn) disposeFn(obj); });
    this.pool = [];
  }
}
