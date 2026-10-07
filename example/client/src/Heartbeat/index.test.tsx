// #region reckoned
import { render, screen, setupStreamFixture, stopArriving } from "@ksp-gonogo/sitrep-sdk/testing";
import { act } from "react";
import { describe, expect, it } from "vitest";
import "../index.js";
import { HeartbeatWidget } from "./index.js";

describe("HeartbeatWidget", () => {
  it("says it is waiting rather than rendering a zero", () => {
    render(<HeartbeatWidget />);

    expect(screen.getByText(/waiting for the example uplink/i)).toBeVisible();
  });

  it("draws the modelled count beside the one received", async () => {
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

    const ticks = await screen.findByText(/Ticks/);
    expect(ticks).toHaveTextContent("20");
    expect(ticks).toHaveTextContent("25");
  });
  // #endregion reckoned

  // #region held
  it("keeps the last count when samples stop arriving", async () => {
    const stream = setupStreamFixture({ pinnedUt: 110 });
    render(
      <stream.Provider>
        <HeartbeatWidget />
      </stream.Provider>,
    );

    await act(async () => {
      stream.emit("example.heartbeat", { ut: 110, ticks: 20 }, { validAt: 110 });
      stream.store.beginFrame();
      stopArriving(stream);
    });

    expect(await screen.findByText(/Ticks/)).toHaveTextContent("20");
    expect(screen.queryByText(/waiting/i)).toBeNull();
  });
  // #endregion held
});
