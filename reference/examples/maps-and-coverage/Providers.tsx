import {
  getCoverageSources,
  getMapPoiProviders,
  type MapPoi,
  registerCoverageSource,
  registerMapPoiProvider,
  SettingKind,
} from "@ksp-gonogo/sitrep-sdk";
import { Stack, Text } from "@ksp-gonogo/ui-kit";

const SURVEY_POINTS: readonly MapPoi[] = [
  {
    id: "survey-1",
    bodyId: "Mun",
    lat: 1.2,
    lon: 35.6,
    kind: "survey",
    label: "Survey beacon",
    detail: "Placed by the first lander",
  },
];

registerMapPoiProvider({
  id: "example-uplink:survey-beacons",
  usePois: ({ bodyId }) => SURVEY_POINTS.filter((poi) => poi.bodyId === bodyId),
});

registerCoverageSource({
  id: "example-uplink:survey",
  label: "Survey coverage",
  weight: 200,
  settings: [{ key: "show", type: SettingKind.Bool, label: "Show survey coverage", default: true }],
});

export function Providers() {
  return (
    <Stack gap="related-compact">
      <Text>Point providers: {getMapPoiProviders().map((provider) => provider.id).join(", ")}</Text>
      <Text>Coverage sources: {getCoverageSources().map((source) => source.id).join(", ")}</Text>
    </Stack>
  );
}
