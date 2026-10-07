# Accepting a command

A command is a named request from the app to the plugin, with typed arguments and a typed reply. This page adds one to the example: `example.reset`, which starts the heartbeat's count again.

## The arguments type

In `mod-contract/ExamplePayloads.cs`, beside the payload types:

<<< ../../example/mod-contract/ExamplePayloads.cs#reset{cs}

A command's arguments are a class in the contract slice, carrying `SitrepCommandAttribute` with the command's name. A command with no arguments still needs the class, empty, to carry the attribute. Add it to the wire types in `mod-contract/ExampleRtConfig.cs`, as on [Publishing a Topic](/guide/topics#generating-the-client-s-types), and run `npm run codegen` so the client gets its TypeScript interface.

The attribute is where a command's delay is declared. Its `Delay` defaults to `DelayRole.Delayed`: an order to a craft takes as long to arrive as the craft's telemetry does, and runs when it gets there. `TrueNow` runs it on arrival, for a command about the ground or about the plugin itself, like this reset.

Arguments arrive as JSON and are matched to the class's properties by name, ignoring case. A property the app did not send keeps its default, so an absent nullable stays `null`. An enum accepts its number or its member's name. A `string` accepts only a string and a `bool` only a boolean.

## Declaring it

The manifest's `Commands` list declares each command with a `CommandDeclaration`:

<<< ../../example/mod/ExampleUplink.cs#commands{cs}

## The handler

<<< ../../example/mod/ExampleUplink.cs#register{cs}

<<< ../../example/mod/ExampleUplink.cs#command{cs}

`IUplinkHost.AddCommandHandler` registers the handler for a declared command. It returns `CommandResult.Ok()`, or `CommandResult.Fail` with a [`CommandErrorCode`](/reference/mod/stream-messages#CommandErrorCode) and a sentence the operator reads, such as `CommandErrorCode.Range` for an argument out of bounds. Check arguments and state here and refuse with the code that fits: the app shows it.

The Gonogo mod runs every handler on the game's main thread, so a handler may call the game. The thread waits for the handler, so return promptly and never wait on anything inside one. (`Sitrep.Contract` itself does not promise the main thread; [Known limits](/guide/limits#the-plugin) says what to do if you need to be safe without it.)

The count is shared between this handler, on the main thread, and the sample, on the Courier thread, so both change it through `Interlocked`, never with a plain `+=`.

## A command to a craft, with a reply

A delayed command about a craft names a `Subject` in its declaration: the Topic that describes the craft, so the command travels with that Topic's delay and is held while the craft is out of contact. A handler that replies with data returns `CommandResult<T>`, and its arguments' attribute names `T` as its `Payload`:

<<< ../../reference/examples/mod/Payloads.cs#args{cs}

<<< ../../reference/examples/mod/GuideExamples.cs#subject{cs}

The client reads the data from the reply's `payload`. `T` is written like a Topic's payload: a dictionary, a list or a plain value.

## Testing it

In `mod-tests/ExampleUplinkTests.cs`:

<<< ../../example/mod-tests/ExampleUplinkTests.cs#reset{cs}

The handler is `internal` and the test project compiles the plugin's sources, so a test calls it directly with no game running. Run them with `dotnet test ../mod-tests` from `client/`.

Next: [A widget](/guide/client-widget).
