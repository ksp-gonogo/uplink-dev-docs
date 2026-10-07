import "@testing-library/jest-dom/vitest";
import { PerfBudget } from "@ksp-gonogo/sitrep-sdk";
import {
  installDomStubs,
  installRealTestHost,
} from "@ksp-gonogo/sitrep-sdk/testing";
import {
  AugmentSlot,
  clearAugments,
  getAugmentsForSlot,
  registerAugment,
  setQuantityLocale,
} from "@ksp-gonogo/ui-kit";

installDomStubs();
PerfBudget.installTestGate();

// Installed here and not in a beforeEach: registerComponent runs at module scope, which is before any hook.
installRealTestHost({
  AugmentSlot,
  clearAugments,
  getAugmentsForSlot,
  registerAugment,
});

setQuantityLocale("en-GB");
