// #region imports
import {
  parseServerMessage,
  type ClientMessage,
  type ServerMessage,
  type StreamData,
} from "@ksp-gonogo/sitrep-sdk";
import { readFrame } from "./binaryFrame";
// #endregion imports

// #region types
type Listener = (frame: StreamData<unknown>) => void;
type EventListener = (name: string) => void;
type ErrorListener = (code: string, message: string) => void;

/** Resolves when the mod answers, or rejects if the request cannot be answered. */
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
  private readonly eventListeners = new Map<string, Set<EventListener>>();
  private readonly errorListeners = new Map<string, Set<ErrorListener>>();
  private readonly pending = new Map<string, Pending>();
  private readonly backlog: ClientMessage[] = [];
  private nextRequestId = 0;

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.binaryType = "arraybuffer";
    this.socket.addEventListener("open", () => this.flush());
    this.socket.addEventListener("message", (event) => {
      const frame = readFrame(event.data as ArrayBuffer | string);
      if (frame.lane === "json") this.dispatch(parseServerMessage(frame.text));
    });
    this.socket.addEventListener("close", () => this.failPending("stream closed"));
    this.socket.addEventListener("error", () => this.failPending("stream error"));
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

  /** Named occurrences on a Topic. `subscribed` acknowledges a subscribe. */
  onEvent(topic: string, listener: EventListener): () => void {
    const listeners = this.eventListeners.get(topic) ?? new Set<EventListener>();
    this.eventListeners.set(topic, listeners);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /**
   * Refusals on a Topic: `unknown-topic` for a name the mod does not declare,
   * `payload-serialization-error` for a frame it could not write.
   */
  onError(topic: string, listener: ErrorListener): () => void {
    const listeners = this.errorListeners.get(topic) ?? new Set<ErrorListener>();
    this.errorListeners.set(topic, listeners);
    listeners.add(listener);
    return () => listeners.delete(listener);
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
        sentAt: 0,
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
        this.settle(message.requestId, (p) => p.resolve(message.result));
        return;
      case "error":
        if (message.requestId) {
          this.settle(message.requestId, (p) => p.reject(new Error(message.message)));
        } else if (message.topic) {
          for (const listener of this.errorListeners.get(message.topic) ?? []) {
            listener(message.code, message.message);
          }
        }
        return;
      case "event":
        for (const listener of this.eventListeners.get(message.topic) ?? []) {
          listener(message.name);
        }
        return;
    }
  }
  // #endregion dispatch

  // #region send
  /**
   * A socket that is still CONNECTING throws on `send`, so anything written
   * before the handshake completes waits in a backlog.
   */
  private send(message: ClientMessage): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      this.backlog.push(message);
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  private flush(): void {
    while (this.backlog.length > 0) {
      this.socket.send(JSON.stringify(this.backlog.shift()));
    }
  }
  // #endregion send

  // #region settle
  private settle(requestId: string, act: (pending: Pending) => void): void {
    const pending = this.pending.get(requestId);
    if (pending) {
      this.pending.delete(requestId);
      act(pending);
    }
  }

  /** A command in flight can outlive the socket. Never leave one unsettled. */
  private failPending(reason: string): void {
    for (const [requestId, pending] of this.pending) {
      this.pending.delete(requestId);
      pending.reject(new Error(reason));
    }
  }
  // #endregion settle
}
