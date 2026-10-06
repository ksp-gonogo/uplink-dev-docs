/**
 * Two broken examples the demo check must catch before it grades the real
 * ones. They are wired under ids no page names, so no reader reaches them.
 */

/** Throws while React renders it, after the mount has already returned. */
export function ThrowsOnRender(): never {
  throw new Error("planted: this example throws while rendering");
}

/** Mounts cleanly and draws nothing. */
export function RendersNothing(): null {
  return null;
}
