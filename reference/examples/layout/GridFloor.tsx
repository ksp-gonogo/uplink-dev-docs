import { Box, Stack, Text } from "@ksp-gonogo/ui-kit";
import { gridToPixels } from "@ksp-gonogo/ui-kit/grid";

export function GridFloor() {
  const { pxW, pxH } = gridToPixels(6, 4);
  return (
    <Box surface="sunken" pad="surface" radius="regular" bordered>
      <Stack gap="caption">
        <Text>A 6 by 4 tile</Text>
        <Text level="muted">
          {pxW} by {pxH} px
        </Text>
      </Stack>
    </Box>
  );
}
