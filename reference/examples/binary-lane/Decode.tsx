import {
  BINARY_LANE_MAGIC,
  BINARY_LANE_STREAM_BINARY,
  decodeBinaryFrame,
  frameBytes,
  isBinaryFrame,
} from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";
import { useEffect, useState } from "react";

/**
 * A binary-lane frame built by hand, the bytes a socket would deliver: the
 * four-byte prefix, the JSON header, then the segments. The page renders it
 * with no socket; `listen` below is the path real bytes take.
 */
function sampleFrame(): Uint8Array {
  const header = new TextEncoder().encode(
    JSON.stringify({
      type: "stream-binary",
      topic: "radio.rx.vessel-3f2a",
      segments: [3, 2],
      // The sample's Meta, as on every stream message: when it was true, when it reached this command centre, and from where it was seen.
      meta: {
        source: "radio",
        validAt: 41823.5,
        seq: 1204,
        deliveredAt: 41853.5,
        vantage: "ground:Kerbal Space Center",
        quality: 1,
        active: true,
        staleness: 0,
        timelineEpoch: 3,
      },
    }),
  );
  const frame = new Uint8Array(4 + header.length + 5);
  frame[0] = BINARY_LANE_MAGIC;
  frame[1] = BINARY_LANE_STREAM_BINARY;
  new DataView(frame.buffer).setUint16(2, header.length);
  frame.set(header, 4);
  frame.set([1, 2, 3, 4, 5], 4 + header.length);
  return frame;
}

interface Decoded {
  topic: string;
  sizes: number[];
}

/** What a socket's message handler makes of one binary message: its Topic and segment sizes, or why it is not a frame. */
function decode(bytes: Uint8Array): Decoded | string {
  if (!isBinaryFrame(bytes)) return "A text frame";
  const result = decodeBinaryFrame(bytes);
  if (!result.ok) return result.reason;
  return { topic: result.message.topic, sizes: result.message.segments.map((segment) => segment.length) };
}

/** How a socket's binary messages reach `decode`: they arrive as an ArrayBuffer once the socket asks for that. */
export function listen(socket: WebSocket, onFrame: (decoded: Decoded | string) => void): void {
  socket.binaryType = "arraybuffer";
  socket.onmessage = (event: MessageEvent<string | ArrayBuffer>) => {
    if (typeof event.data === "string") return;
    onFrame(decode(frameBytes(event.data)));
  };
}

export function Decode() {
  const [decoded, setDecoded] = useState<Decoded | string | null>(null);
  // A frame is decoded once, when it arrives, and the render shows what came of it.
  useEffect(() => setDecoded(decode(sampleFrame())), []);
  if (decoded === null) return null;
  if (typeof decoded === "string") return <Text tone="nogo">{decoded}</Text>;
  return (
    <Stack gap="related-compact">
      <Text>{decoded.topic}</Text>
      <Text>{decoded.sizes.map((size) => `${size} bytes`).join(", ")}</Text>
    </Stack>
  );
}
