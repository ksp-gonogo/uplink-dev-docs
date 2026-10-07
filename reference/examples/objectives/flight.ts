import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `vessel.flight` value the Objectives example reads: a craft climbing through the upper atmosphere. */
export const vesselFlight: WireOf<TopicPayload<"vessel.flight">> = {
  latitude: -0.1,
  longitude: -74.6,
  altitudeAsl: 41800,
  altitudeTerrain: 41800,
  verticalSpeed: 410,
  surfaceSpeed: 1250,
  orbitalSpeed: 1480,
  gForce: 1.2,
  dynamicPressureKPa: 0.9,
  mach: 3.6,
  atmDensity: 0.004,
  externalTemperature: 210,
  atmosphericTemperature: 210,
  meta: { source: "vessel:kerbal-x" },
};
