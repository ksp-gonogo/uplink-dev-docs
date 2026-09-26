import type { Meta } from "@ksp-gonogo/sitrep-sdk";

// #region types
/** One WebSocket message from the mod, sorted by lane. */
export type Frame =
  | { lane: "json"; text: string }
  | { lane: "binary"; topic: string; meta: Meta; segments: Uint8Array[] };
// #endregion types

// #region read
const JSON_FIRST_BYTE = 0x7b; // "{"
const BINARY_MAGIC = 0x9e;
const LANE_STREAM_BINARY = 0x01;

/**
 * Sorts one message by its first byte. Throws on anything it cannot read
 * whole, so a truncated frame is never mistaken for an empty one.
 */
export function readFrame(data: ArrayBuffer | string): Frame {
  if (typeof data === "string") return { lane: "json", text: data };

  const bytes = new Uint8Array(data);
  if (bytes[0] === JSON_FIRST_BYTE) {
    return { lane: "json", text: new TextDecoder().decode(bytes) };
  }
  if (bytes[0] !== BINARY_MAGIC) {
    throw new Error(`unrecognised frame, first byte 0x${bytes[0]?.toString(16)}`);
  }
  if (bytes[1] !== LANE_STREAM_BINARY) {
    throw new Error(`unknown binary lane 0x${bytes[1]?.toString(16)}`);
  }

  const headerLength = (bytes[2] << 8) | bytes[3];
  const header = JSON.parse(
    new TextDecoder().decode(bytes.subarray(4, 4 + headerLength)),
  ) as { topic: string; meta: Meta; segments: number[] };

  let cursor = 4 + headerLength;
  const total = header.segments.reduce((sum, length) => sum + length, 0);
  if (cursor + total !== bytes.length) {
    throw new Error(
      `segment table for ${header.topic} covers ${total} bytes, frame carries ${bytes.length - cursor}`,
    );
  }

  const segments = header.segments.map((length) => {
    const segment = bytes.subarray(cursor, cursor + length);
    cursor += length;
    return segment;
  });
  return { lane: "binary", topic: header.topic, meta: header.meta, segments };
}
// #endregion read
