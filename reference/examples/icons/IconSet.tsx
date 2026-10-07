import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BellIcon,
  BroadcastIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  ComputerIcon,
  DatabaseIcon,
  DiagnosticsIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  HeartIcon,
  HistoryIcon,
  HomeIcon,
  InfoIcon,
  JoystickIcon,
  LayersIcon,
  LockIcon,
  MARKER_ICONS,
  MARKER_IDS,
  MicroscopeIcon,
  MutedIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SatelliteIcon,
  SendIcon,
  SettingsIcon,
  SpeakerIcon,
  StarIcon,
  StopIcon,
  Stack,
  Text,
  Cluster,
  Box,
} from "@ksp-gonogo/ui-kit";

const general = {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BellIcon,
  BroadcastIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  ComputerIcon,
  DatabaseIcon,
  DiagnosticsIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  HeartIcon,
  HistoryIcon,
  HomeIcon,
  InfoIcon,
  JoystickIcon,
  LayersIcon,
  LockIcon,
  MicroscopeIcon,
  MutedIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SatelliteIcon,
  SendIcon,
  SettingsIcon,
  SpeakerIcon,
  StarIcon,
  StopIcon,
};

export function IconSet() {
  return (
    <Stack gap="section">
      <Cluster gap="section">
        {Object.entries(general).map(([name, Icon]) => (
          <Box key={name} surface="sunken" pad="surface" radius="regular" bordered>
            <Icon label={name.replace("Icon", "")} />
          </Box>
        ))}
      </Cluster>
      <Text level="muted">Navball markers</Text>
      <Cluster gap="section">
        {MARKER_IDS.map((id) => {
          const Marker = MARKER_ICONS[id];
          return <Marker key={id} label={id} size={28} />;
        })}
      </Cluster>
    </Stack>
  );
}
