"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const defaultMaxSize = 100;
class Cache {
    // validSpan：超过分钟数，cache自动失效
    constructor(maxSize, validMinute) {
        if (typeof maxSize !== 'number' || maxSize <= 2) {
            this.maxSize = defaultMaxSize;
        }
        else {
            this.maxSize = maxSize;
        }
        if (validMinute !== undefined) {
            this.validSpan = validMinute * 60 * 1000;
        }
        this.count = 0;
        this.map = {};
    }
    removeFromList(node) {
        let { prev, next } = node;
        if (prev === undefined) {
            this.head = next;
        }
        else {
            prev.next = next;
        }
        if (next === undefined) {
            this.tail = prev;
        }
        else {
            next.prev = prev;
        }
    }
    appendToTail(node) {
        node.next = undefined;
        node.prev = this.tail;
        if (this.tail !== undefined) {
            this.tail.next = node;
        }
        this.tail = node;
    }
    get(key) {
        let node = this.map[key];
        if (node === undefined)
            return;
        let { value } = node;
        if (this.validSpan !== undefined) {
            let { tick } = node;
            if (Date.now() > tick + this.validSpan) {
                this.removeFromList(node);
                return;
            }
        }
        if (node === this.tail)
            return value;
        this.removeFromList(node);
        this.appendToTail(node);
        node.tick = Date.now();
    }
    set(key, value) {
        let node = this.map[key];
        let now = Date.now();
        if (node === undefined) {
            node = {
                prev: this.tail,
                next: undefined,
                value,
                tick: now,
            };
            if (this.tail !== undefined) {
                this.tail.next = node;
            }
            this.map[key] = this.tail = node;
            ++this.count;
            return;
        }
        node.tick = now;
        node.value = value;
        this.removeFromList(node);
        this.appendToTail(node);
        ++this.count;
        if (this.count > this.maxSize) {
            let { next } = this.head;
            next.prev = undefined;
            this.head = next;
            --this.count;
            delete this.map[key];
        }
    }
}
exports.Cache = Cache;
//# sourceMappingURL=cache.js.map