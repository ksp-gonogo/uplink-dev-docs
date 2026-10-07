import { Disclosure, Stack, Text } from "@ksp-gonogo/ui-kit";

export function Detail() {
  return (
    <Disclosure
      variant="inline"
      chevron={false}
      label={(open) => (open ? "Hide detail" : "Show detail")}
    >
      <Stack gap="rows">
        <Text>Stage 2: 360 units</Text>
        <Text>Stage 1: 900 units</Text>
      </Stack>
    </Disclosure>
  );
}
