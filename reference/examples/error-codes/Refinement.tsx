import { describeErrorCode, type ErrorCodeDeclaration, registerErrorCodes } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";

/**
 * An Uplink's refinements, as `codegen` writes them into its generated
 * `error-codes.ts` from the plugin's refusals. Registering the table once,
 * where the client loads, lets `describeErrorCode` read them like a core code.
 */
const EXAMPLE_ERROR_CODES: readonly ErrorCodeDeclaration[] = [
  {
    id: "example.countFrozen",
    kind: "refusal",
    refines: "modeUnavailable",
    origin: null,
    sentence: "the count is frozen while the game is paused",
    meaning: "The heartbeat does not count while the game is paused, so a reset has nothing to start again.",
  },
];

registerErrorCodes(EXAMPLE_ERROR_CODES);

export function Refinement() {
  const code = describeErrorCode("example.countFrozen");
  if (!code) return null;
  return (
    <Stack gap="related-compact">
      <Text>
        {code.id} refines {code.refines}: {code.sentence}
      </Text>
      <Text>{code.meaning}</Text>
    </Stack>
  );
}
