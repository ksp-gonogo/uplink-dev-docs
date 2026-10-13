import { describeErrorCode, registerErrorCodes, type UplinkErrorCodeDeclaration } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";

/**
 * An Uplink's refinements: more specific refusals under one of the core codes,
 * each written `owner.name`. `uplink-tools codegen` writes this table into the
 * Uplink's generated `client/src/__generated__/error-codes.ts` from the
 * refusals its C# half declares. Registering it once, where the client loads,
 * lets `describeErrorCode` read them like a core code. The code and the
 * heartbeat counter it mentions are made up for this example.
 */
const EXAMPLE_ERROR_CODES: readonly UplinkErrorCodeDeclaration[] = [
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
