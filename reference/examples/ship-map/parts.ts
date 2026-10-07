import { type TopicPayload, type WireOf } from "@ksp-gonogo/sitrep-sdk";

/** The `vessel.parts` value every Ship Map example draws, as the Gonogo mod sends it. */
export const vesselParts: WireOf<TopicPayload<"vessel.parts">> = {
  parts: [
    {
      id: "1",
      name: "mk1pod.v2",
      title: "Mk1 Command Pod",
      position: {
        x: 0,
        y: 0,
        z: 0
      },
      up: {
        x: 0,
        y: 1,
        z: 0
      },
      bounds: {
        size: {
          x: 1.25,
          y: 1.14,
          z: 1.25
        }
      },
      dryMass: 0.8,
      inverseStage: -1,
      maxTemp: 1200,
      category: "Pods",
      categoryOrdinal: 6,
      modules: [
        "ModuleCommand"
      ],
      isRobotics: false,
      isPowerRelated: false,
      resources: {},
      moduleStates: [],
      actionBindings: []
    },
    {
      id: "2",
      parentId: "1",
      name: "fuelTankSmallFlat",
      title: "FL-T400 Fuel Tank",
      position: {
        x: 0,
        y: -1.145,
        z: 0
      },
      up: {
        x: 0,
        y: 1,
        z: 0
      },
      bounds: {
        size: {
          x: 1.25,
          y: 1.85,
          z: 1.25
        }
      },
      dryMass: 0.25,
      inverseStage: 1,
      maxTemp: 2000,
      category: "FuelTank",
      categoryOrdinal: 7,
      modules: [],
      isRobotics: false,
      isPowerRelated: false,
      resources: {
        LiquidFuel: {
          amount: 90,
          maxAmount: 180
        },
        Oxidizer: {
          amount: 100,
          maxAmount: 220
        }
      },
      moduleStates: [],
      actionBindings: []
    },
    {
      id: "4",
      parentId: "2",
      name: "oreTankSmall",
      title: "Small Ore Tank",
      position: {
        x: 0,
        y: -2.1,
        z: 0
      },
      up: {
        x: 0,
        y: 1,
        z: 0
      },
      bounds: {
        size: {
          x: 1.25,
          y: 1.85,
          z: 1.25
        }
      },
      dryMass: 0.25,
      inverseStage: 1,
      maxTemp: 2000,
      category: "FuelTank",
      categoryOrdinal: 7,
      modules: [],
      isRobotics: false,
      isPowerRelated: false,
      resources: {
        Ore: {
          amount: 30,
          maxAmount: 300
        }
      },
      moduleStates: [],
      actionBindings: []
    },
    {
      id: "3",
      parentId: "4",
      name: "liquidEngine3",
      title: "LV-T30 \"Reliant\" Liquid Fuel Engine",
      position: {
        x: 0,
        y: -3.3,
        z: 0
      },
      up: {
        x: 0,
        y: 1,
        z: 0
      },
      bounds: {
        size: {
          x: 1.25,
          y: 1,
          z: 1.25
        }
      },
      dryMass: 1.25,
      inverseStage: 1,
      maxTemp: 2000,
      category: "Engine",
      categoryOrdinal: 8,
      modules: [
        "ModuleEngines"
      ],
      isRobotics: false,
      isPowerRelated: false,
      resources: {},
      moduleStates: [
        {
          type: "engine",
          state: "active",
          flameout: true
        }
      ],
      actionBindings: []
    }
  ],
  meta: {
    source: "vessel:kerbal-x"
  }
};
