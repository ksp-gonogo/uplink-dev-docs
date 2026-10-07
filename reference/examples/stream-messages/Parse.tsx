import { parseServerMessage, type ServerMessage } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";

const FRAMES = [
  '{"type":"event","topic":"vessel.flight","name":"subscribed","meta":{"source":"core","validAt":41823.5,"seq":1,"deliveredAt":41823.5,"vantage":"home","quality":1,"active":true,"staleness":0,"timelineEpoch":3}}',
  '{"type":"command-accepted","requestId":"c-17","oneWaySeconds":4.2}',
  '{"type":"error","requestId":"c-18","code":"unknownVantage","message":"No such command centre"}',
];

function describe(message: ServerMessage): string {
  switch (message.type) {
    case "event":
      return `${message.name} on ${message.topic}`;
    case "command-accepted":
      return `${message.requestId} arrives in ${message.oneWaySeconds} s`;
    case "error":
      return `${message.code}: ${message.message}`;
    default:
      return message.type;
  }
}

export function Parse() {
  return (
    <Stack gap="related-compact">
      {FRAMES.map((raw) => {
        const message = parseServerMessage(raw);
        return (
          <Text key={raw}>
            {message.type}: {describe(message)}
          </Text>
        );
      })}
    </Stack>
  );
}
