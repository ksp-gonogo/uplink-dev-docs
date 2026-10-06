/**
 * Hands out turns to load an example's frame, a few at a time across the page.
 * Every frame pulls the whole example graph, and a page of them loading at once
 * exhausts the browser's request pool so that none of them finishes.
 */
const CONCURRENT = 2;

let running = 0;
const waiting: (() => void)[] = [];

function next(): void {
  if (running >= CONCURRENT) return;
  const start = waiting.shift();
  if (!start) return;
  running++;
  start();
}

/** Resolves when this frame may load, with the release to call once it has. */
export function takeTurn(): Promise<() => void> {
  return new Promise((resolve) => {
    waiting.push(() => {
      let released = false;
      resolve(() => {
        if (released) return;
        released = true;
        running--;
        next();
      });
    });
    next();
  });
}
