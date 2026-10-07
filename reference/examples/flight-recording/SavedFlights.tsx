import { type FlightRecord, MemoryStore } from "@ksp-gonogo/sitrep-sdk";
import { Stack, Stat, Text } from "@ksp-gonogo/ui-kit";
import { useEffect, useState } from "react";

const store = new MemoryStore();

const launch: FlightRecord = {
  id: "kerbal-x-1",
  vesselName: "Kerbal X",
  launchedAt: Date.UTC(2026, 9, 7, 9, 30),
  lastSampleAt: Date.UTC(2026, 9, 7, 9, 41),
  lastMissionTime: 660,
  sampleCount: 480,
};

export function SavedFlights() {
  const [flights, setFlights] = useState<FlightRecord[]>([]);
  useEffect(() => {
    store
      .upsertFlight(launch)
      .then(() => store.listFlights())
      .then(setFlights);
  }, []);
  if (flights.length === 0) return <Text>No flights saved</Text>;
  return (
    <Stack gap="related-compact">
      {flights.map((flight) => (
        <Stat key={flight.id} label={flight.vesselName}>
          {flight.sampleCount} samples
        </Stat>
      ))}
    </Stack>
  );
}
