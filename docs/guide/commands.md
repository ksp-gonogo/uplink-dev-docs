# Accepting a command

A command is a named request from the app to the plugin, with typed arguments and a typed reply. This page adds one to the example: `example.reset`, which starts the heartbeat's count again.

## The arguments type

In `mod-contract/ExamplePayloads.cs`, beside the payload types:

<<< ../../example/mod-contract/ExamplePayloads.cs#reset{cs}

A command's arguments are a class in the contract slice, carrying `SitrepCommandAttribute` with the command's name. A command with no arguments still needs the class, empty, to carry the attribute. Add it to the wire types in `mod-contract/ExampleRtConfig.cs`, as on [Publishing a Topic](/guide/topics#generating-the-client-s-types), and run `npm run codegen` from `client/` so the client gets its TypeScript interface.

The attribute is where a command's delay is declared. Its `Delay` defaults to `DelayRole.Delayed`: an order to a craft takes as long to arrive as the craft's telemetry does, and runs when it gets there. `TrueNow` runs it on arrival, for a command about the ground or about the plugin itself, like this reset.

Arguments arrive as JSON and are matched to the class's properties by name, ignoring case. A property the app did not send keeps its default, so an absent nullable stays `null`. An enum accepts its number or its member's name in any case: for a property `Delay` of type `DelayRole`, `{ "delay": 1 }` and `{ "delay": "truenow" }` arrive as the same member (`DelayRole.TrueNow` is declared second, so its number is 1). A `string` accepts only a string and a `bool` only a boolean.

## Declaring it

The manifest's `Commands` list declares each command with a `CommandDeclaration`:

<<< ../../example/mod/ExampleUplink.cs#commands{cs}

## The handler

<<< ../../example/mod/ExampleUplink.cs#register{cs}

<<< ../../example/mod/ExampleUplink.cs#command{cs}

`IUplinkHost.AddCommandHandler` registers the handler for a declared command. It returns `CommandResult.Ok()`, or `CommandResult.Fail(code, detail)`, where `code` is a [`RefusalCode`](/reference/mod/stream-messages#RefusalCode), one of the constants of the [`CommandErrorCode`](/reference/mod/stream-messages#CommandErrorCode) class, such as `CommandErrorCode.Range` for an argument out of bounds, and `detail` is a sentence the operator reads. Check arguments and state here and refuse with the code that fits: the app shows it.

The codes are, with what each means:

<!--@include: @/.vitepress/includes/command-error-codes.md-->

### A more specific refusal

The stock codes are the **roots**: a closed set every client can act on. When the app needs to say more than a root does, declare a **refinement** of the root that fits with `RefusalCode.Refine(id, sentence)`. Its id is `<your Uplink's id>.<name>`, both in camel case, and the host drops the whole set of an Uplink that declares under another id. Declare each as a public static field of one class, list them in the manifest's `ErrorCodes` with `ErrorCodeCatalog.Of`, and return one from a handler like any code:

<<< ../../reference/examples/mod/GuideExamples.cs#refine{cs}

The root still travels with the refusal, so a client that knows nothing of your refinement still acts on the root, and one that does can show your sentence. A refinement cannot be refined again. A handler that returns a refinement missing from `ErrorCodes` is sent as its root.

The Gonogo mod runs every handler on the game's main thread, so a handler may read and change the game. The `Sitrep.Contract` package does not promise that, so a handler that needs to be safe on any thread cannot rely on it ([Known limits](/guide/limits#the-plugin) shows how to write one). While the handler runs, the game waits, so return promptly and never wait on anything inside one.

The count is shared between this handler, on the main thread, and the sample, on the Courier thread, so both change it through `Interlocked`, never with a plain `+=`.

## A command about a craft

The two snippets below are sketches compiled against the contract, not part of the worked Uplink. A delayed command about a craft names a `Subject` in its `CommandDeclaration`: the Topic that describes the craft, so the command travels with that Topic's delay and is held while the craft is out of contact (it has no signal path to the command centre). A handler that replies with data returns `CommandResult<T>`, and the `Payload` property of its arguments' `SitrepCommandAttribute` names `T`, the type of the data in the reply:

<<< ../../reference/examples/mod/Payloads.cs#args{cs}

<<< ../../reference/examples/mod/GuideExamples.cs#subject{cs}

The handler reads its arguments from the parameter it is given (`args.Mode` above), already matched to the class's properties as described under [The arguments type](#the-arguments-type). The client supplies them when it sends the command, as [Sending a command](/guide/client-commands#commands-with-arguments) shows, and reads the data from the reply's `payload`. `T` is written like a Topic's payload: a dictionary, a list or a plain value.

## Testing it

In `mod-tests/ExampleUplinkTests.cs`:

<<< ../../example/mod-tests/ExampleUplinkTests.cs#reset{cs}

The handler is `internal` and the test project compiles the plugin's sources, so a test calls it directly with no game running. Run them with `dotnet test ../mod-tests` from `client/`.

Next: [Wrapping a mod](/guide/wrapping-a-mod).
