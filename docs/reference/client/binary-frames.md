# Binary frames

Most of the stream is JSON. A channel declared with [`OpaquePayload`](/reference/mod/channels#opaquepayload) goes out on the binary lane instead: its payload is raw byte segments, because a JSON number array costs about seven times what the bytes do. Audio is the obvious use. The mod never looks inside the segments.

The format is small enough to decode with anything that opens a WebSocket, in any language.

## Every frame is a binary message

The mod sends **every** frame as a binary WebSocket message, JSON included. The message type tells you nothing, so set `binaryType` and read the first byte:

| First byte | Frame |
| --- | --- |
| `0x7B` (`{`) | JSON. Decode as UTF-8 and parse |
| `0x9E` | Binary lane, laid out as below |
| anything else | Refuse it and say so |

`0x9E` cannot start a JSON frame: every envelope opens with `{`, and `0x80`-`0xBF` is the UTF-8 continuation range, which can never lead a UTF-8 document.

## Layout

```
offset  size            field
0       1               magic, always 0x9E
1       1               lane, 0x01 = stream-binary
2       2               header length H, unsigned 16-bit, big-endian
4       H               header, UTF-8 JSON
4+H     sum(segments)   the segments, concatenated in order
```

The header:

```json
{
  "type": "stream-binary",
  "topic": "radio.rx.vessel-3f2a",
  "segments": [87, 91, 88, 90, 87],
  "meta": {
    "source": "radio",
    "validAt": 41823.5,
    "seq": 1204,
    "deliveredAt": 41853.5,
    "vantage": "ground:Kerbal Space Center",
    "quality": 1,
    "active": true,
    "staleness": 0,
    "timelineEpoch": 3
  }
}
```

`segments` is a table of byte lengths. The first 87 bytes after the header are segment 0, the next 91 are segment 1, and so on, with no delimiter and no padding. A segment can contain any byte, `0x9E` and `{` included.

`meta` is the same [`Meta`](/reference/client/messages#meta) a `stream-data` frame carries. A binary frame is delayed like everything else, so `validAt` is when it was true and `deliveredAt` is when your vantage was allowed to hear it.

## Reading one

<<< ../../../template/client/src/binaryFrame.ts#types

<<< ../../../template/client/src/binaryFrame.ts#read

The [template's stream client](/guide/client-stream) runs every message through `readFrame` before parsing, which is what lets it read the JSON lane at all.

## Rules for a decoder

- **Trust the table.** There is no delimiter to scan for, and a segment full of `0x9E` bytes is an ordinary segment
- **A frame that does not add up is dropped whole.** The lengths must sum to exactly the bytes after the header. Short means truncated, long means the header and the buffer disagree. Do not deliver the segments that happen to line up: a listener handed a fragment cannot know it is one
- **Zero segments is a delivery.** It means the producer had nothing this tick. That is why a broken frame must never be reported as an empty one
- **Refuse an unknown lane byte by name.** Never fall back to decoding the bytes as text. Compressed audio decoded as UTF-8 fails somewhere else entirely, and the useful fact, that your decoder is older than the mod, is lost

## Server to client only

A binary message sent up the socket is refused with an `error` frame, code `binary-frame-not-accepted`. Bytes going the other way travel as a command's arguments, which also gives them the uplink delay every other command gets.

## Publishing on the binary lane

Set `OpaquePayload` on the declaration:

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#opaque{cs}

Publish a `byte[]` for one segment, or an ordered collection of them for a batch. Nothing infers the lane from the payload's type: without the flag, a `byte[]` goes out as a JSON number array, which is a legitimate thing for a channel to send.

**Batch.** The header is what costs. A 20 ms audio chunk is about 87 bytes and its header around 300, so one chunk per frame spends four times more on description than on content. Each delivery is also scheduled individually on the light-time clock inside the mod, so the cost grows with the number of frames in flight rather than their size. Send 100 to 200 ms of content per frame.

Two things to get right:

- **Stamp each batch with the UT you captured it at**, not the tick's UT. On a `LossyLatest` channel, frames sharing one `validAt` collapse to the last, so a second of content stamped from the tick becomes one frame
- **Never publish null.** It marks your Uplink unavailable. Zero segments already means "nothing this tick"; if you need a real absence, use a JSON channel

The published SDK has no binary decoder and its `ServerMessage` union has no `stream-binary` member. See [Known limits](/guide/limits#binary-frames-are-not-in-the-sdk).
