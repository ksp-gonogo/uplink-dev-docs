import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `system.vessels` value every Fleet Roster example draws, as the Gonogo mod sends it. */
export const systemVessels: WireOf<TopicPayload<"system.vessels">> = {
  vessels: [
    {
      vesselId: "v-station-1",
      name: "Kerbin Station Alpha",
      vesselType: 1,
      situation: 3,
      bodyIndex: 0,
      crewCount: 6,
      crewCapacity: 6,
      commsConnected: true,
      commsControlSource: 2,
    },
    {
      vesselId: "v-probe-mun",
      name: "Munar Relay Probe",
      vesselType: 3,
      situation: 3,
      bodyIndex: 1,
      crewCount: 0,
      crewCapacity: 0,
      commsConnected: true,
      commsControlSource: 1,
    },
    {
      vesselId: "v-lander-duna",
      name: "Duna Lander Bravo",
      vesselType: 2,
      situation: 0,
      bodyIndex: 2,
      crewCount: 2,
      crewCapacity: 3,
      commsConnected: true,
      commsControlSource: 1,
    },
    {
      vesselId: "v-orbiter-eve",
      name: "Eve Orbiter Charlie",
      vesselType: 0,
      situation: 3,
      bodyIndex: 3,
      crewCount: 1,
      crewCapacity: 1,
      commsConnected: false,
      commsControlSource: 0,
    },
  ],
};

/** The `fleet.silence` value the Fleet Roster updates example reads: Eve Orbiter Charlie has stopped answering. */
export const fleetSilence: WireOf<TopicPayload<"fleet.silence">> = {
  vessels: [
    { vesselId: "v-station-1", state: "Nominal" },
    { vesselId: "v-probe-mun", state: "Nominal" },
    { vesselId: "v-lander-duna", state: "Nominal" },
    {
      vesselId: "v-orbiter-eve",
      state: "Silent",
      silenceSinceUt: 3_000_000,
      deadlineUt: 3_400_000,
      deadlineBasis: "orbital-period",
    },
  ],
};
