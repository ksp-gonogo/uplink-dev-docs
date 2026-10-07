import { useState } from "react";
import { ComposerBar, Console } from "@ksp-gonogo/ui-kit";

export function ShellConsole() {
  const [line, setLine] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const send = () => {
    setSent((all) => [...all, line]);
    setLine("");
  };
  return (
    <Console
      oneWaySeconds={4.2}
      canQueue
      composer={
        <ComposerBar prompt=">" onSend={send} sendDisabled={line === ""}>
          <input
            aria-label="Command line"
            value={line}
            onChange={(e) => setLine(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && line !== "" && send()}
          />
        </ComposerBar>
      }
    >
      {sent.map((text, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: an append-only scrollback
        <div key={i}>{`> ${text}`}</div>
      ))}
    </Console>
  );
}
