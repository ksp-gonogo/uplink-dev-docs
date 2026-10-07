import { render, screen, setupStreamFixture } from "@ksp-gonogo/sitrep-sdk/testing";
import { act } from "react";
import { describe, expect, it } from "vitest";
import "../index.js";
import { HeartbeatWidget } from "./index.js";

describe("HeartbeatWidget", () => {
  it("says it is waiting rather than rendering a zero", () => {
    render(<HeartbeatWidget />);

    expect(screen.getByText(/waiting for the example uplink/i)).toBeVisible();
  });

  // #region reckoned
  it("counts on between samples at the rate the samples advanced", async () => {
    const stream = setupStreamFixture({ pinnedUt: 115 });
    render(
      <stream.Provider>
        <HeartbeatWidget />
      </stream.Provider>,
    );

    await act(async () => {
      stream.emit("example.heartbeat", { ut: 100, ticks: 10 }, { validAt: 100 });
      stream.emit("example.heartbeat", { ut: 110, ticks: 20 }, { validAt: 110 });
      stream.store.beginFrame();
    });

    expect(await screen.findByText(/Ticks/)).toHaveTextContent("25");
  });
  // #endregion reckoned
});
