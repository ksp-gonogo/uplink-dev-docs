// #region example
import { Box, Text } from "@ksp-gonogo/ui-kit";

export function ReadoutTile({ label, value }: { label: string; value: string }) {
  return (
    <Box surface="sunken" pad={["sm", "md"]} radius="sm" bordered>
      {label} <Text spaced>{value}</Text>
    </Box>
  );
}
// #endregion example
