import { CommandErrorCode, describeErrorCode } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";

const CODES = [
  CommandErrorCode.InsufficientFunds,
  CommandErrorCode.InsufficientScience,
  CommandErrorCode.InsufficientResource,
];

export function Refusal() {
  return (
    <Stack gap="related-compact">
      {CODES.map((code) => (
        <Text key={code}>
          {code}: {describeErrorCode(code)?.sentence ?? "unknown code"}
        </Text>
      ))}
    </Stack>
  );
}
