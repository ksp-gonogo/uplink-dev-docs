import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `vessel.flight` value every Action Group example reads, as the Gonogo mod sends it: a capsule under way in thick air. */
export const vesselFlight: WireOf<TopicPayload<"vessel.flight">> = {
  latitude: -0.1,
  longitude: -74.5,
  altitudeAsl: 5400,
  altitudeTerrain: 5300,
  verticalSpeed: -118,
  surfaceSpeed: 142,
  orbitalSpeed: 210,
  gForce: 1.1,
  dynamicPressureKPa: 21,
  mach: 0.42,
  atmDensity: 0.7,
  externalTemperature: 280,
  atmosphericTemperature: 275,
  meta: { source: "vessel:kerbal-x" },
};
