/* ============================================================
   NEON ARENA - 汎用オブジェクトプール
   使い捨てオブジェクトの生成・再利用を管理する汎用プール
   ============================================================ */

/**
 * 汎用オブジェクトプールクラス
 * ファクトリ関数とリセット関数を受け取り、オブジェクトの
 * 生成・再利用・解放を管理する。メモリ効率の向上に貢献
 */
class ObjectPool {
  constructor(factory, reset, maxSize = 200) {
    this.factory = factory;   // 新規オブジェクト生成関数
    this.reset = reset;       // オブジェクトリセット関数
    this.maxSize = maxSize;   // プールの最大サイズ
    this.pool = [];           // 未使用オブジェクトのストック
    this.active = [];         // 現在使用中のオブジェクト
  }

  /**
   * プールからオブジェクトを取得
   * ストックがあれば再利用、なければ新規生成
   * @returns {Object} 取得したオブジェクト
   */
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

  /**
   * オブジェクトをプールに戻す
   * リセット関数を実行後、ストックに追加（最大サイズ制限あり）
   * @param {Object} obj - 解放するオブジェクト
   */
  release(obj) {
    const idx = this.active.indexOf(obj);
    if (idx >= 0) this.active.splice(idx, 1);
    if (this.reset) this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /**
   * 全てのアクティブオブジェクトを解放
   */
  releaseAll() {
    while (this.active.length > 0) {
      const obj = this.active.pop();
      if (this.reset) this.reset(obj);
      if (this.pool.length < this.maxSize) {
        this.pool.push(obj);
      }
    }
  }

  /** アクティブなオブジェクト数 */
  get activeCount() { return this.active.length; }
  /** プール内のストック数 */
  get poolSize() { return this.pool.length; }

  /**
   * 全オブジェクトを破棄（解放後、破棄関数を実行）
   * @param {Function} disposeFn - 個別の破棄処理関数
   */
  disposeAll(disposeFn) {
    this.releaseAll();
    this.pool.forEach(obj => { if (disposeFn) disposeFn(obj); });
    this.pool = [];
  }
}
