import {
  BINARY_LANE_MAGIC,
  BINARY_LANE_STREAM_BINARY,
  decodeBinaryFrame,
  isBinaryFrame,
} from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";

/** A binary-lane frame as it arrives from the socket: prefix, header, then the segments. */
function frameFromSocket(): Uint8Array {
  const header = new TextEncoder().encode(
    JSON.stringify({
      type: "stream-binary",
      topic: "radio.rx.vessel-3f2a",
      segments: [3, 2],
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

export function Decode() {
  const bytes = frameFromSocket();
  if (!isBinaryFrame(bytes)) return <Text>A text frame</Text>;
  const result = decodeBinaryFrame(bytes);
  if (!result.ok) return <Text tone="nogo">{result.reason}</Text>;
  const { topic, segments } = result.message;
  return (
    <Stack gap="related-compact">
      <Text>{topic}</Text>
      <Text>{segments.map((segment) => `${segment.length} bytes`).join(", ")}</Text>
    </Stack>
  );
}
