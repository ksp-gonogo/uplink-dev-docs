// #region imports
import {
  parseServerMessage,
  type ClientMessage,
  type ServerMessage,
  type StreamData,
} from "@ksp-gonogo/sitrep-sdk";
// #endregion imports

// #region types
type Listener = (frame: StreamData<unknown>) => void;

/** Resolves when the mod answers, or rejects if the request errors out. */
type Pending = {
  resolve: (result: unknown) => void;
  reject: (reason: Error) => void;
};
// #endregion types

// #region class
/**
 * A minimal client for the mod's telemetry socket: subscribe to Topics, read
 * frames, send commands.
 */
export class SitrepStream {
  private readonly socket: WebSocket;
  private readonly listeners = new Map<string, Set<Listener>>();
  private readonly pending = new Map<string, Pending>();
  private nextRequestId = 0;

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.addEventListener("message", (event) => {
      this.dispatch(parseServerMessage(event.data as string));
    });
  }

  /** Subscribes to `topic` and returns an unsubscribe function. */
  subscribe(topic: string, listener: Listener): () => void {
    let listeners = this.listeners.get(topic);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(topic, listeners);
      this.send({ type: "subscribe", topic });
    }
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(topic);
        this.send({ type: "unsubscribe", topic });
      }
    };
  }

  /** Sends a command and resolves with the mod's result. */
  command<TArgs>(command: string, args: TArgs): Promise<unknown> {
    const requestId = `req-${this.nextRequestId++}`;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.send({
        type: "command-request",
        requestId,
        command,
        args,
        sentAt: Date.now(),
      });
    });
  }

  close(): void {
    this.socket.close();
  }
  // #endregion class

  // #region dispatch
  private dispatch(message: ServerMessage): void {
    switch (message.type) {
      case "stream-data":
        for (const listener of this.listeners.get(message.topic) ?? []) {
          listener(message);
        }
        return;
      case "command-response":
        this.pending.get(message.requestId)?.resolve(message.result);
        this.pending.delete(message.requestId);
        return;
      case "error":
        if (message.requestId) {
          this.pending.get(message.requestId)?.reject(new Error(message.message));
          this.pending.delete(message.requestId);
        }
        return;
      case "event":
        return;
    }
  }
  // #endregion dispatch

  private send(message: ClientMessage): void {
    this.socket.send(JSON.stringify(message));
  }
}
