# The plugin class

A plugin is one class that implements `ISitrepUplink` and carries a `[SitrepUplink]` attribute. Complete, this is the whole of it:

<<< ../../template/mod/ExampleUplink/MinimalUplink.cs#minimal{cs}

That compiles, loads, and publishes the game clock once a second. The rest of this page turns it into the example Uplink, whose pieces are shown one at a time; [the whole file](#the-whole-file) is at the bottom.

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#declaration{cs}

The attribute is how Gonogo finds you: at load it scans every assembly that references `Sitrep.Contract` for types carrying it. Its argument is your Uplink's id, unique across every Uplink installed. **Your class needs a public parameterless constructor**: Gonogo instantiates it directly.

The interface is three members:

```csharp
UplinkManifest Manifest { get; }
void Register(IUplinkHost host);
UplinkHealth Health();
```

## The manifest

`Manifest` declares everything you publish and everything you accept, before any of it runs. Gonogo validates the declarations at startup and refuses handlers for commands you did not declare.

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

`Id` must match the attribute. `Channels` and `Commands` are covered on the next two pages.

## Register

`Register` is called once, on the main thread, at load. Wire your sources and handlers here and return.

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#register{cs}

If the mod you integrate is not installed, say so and return. `SetAvailability` marks the Uplink unavailable with a reason the operator can read; it does not stop the rest of Gonogo loading.

An exception thrown out of `Register` takes down your Uplink and nothing else.

There is no matching teardown. An Uplink lives as long as the game session, so anything you install in `Register`, a Harmony patch included, stays installed. Write it to be safe to leave in place.

## Health

`Health` is polled. Return one of three states, with an optional detail string.

<<< ../../template/mod/ExampleUplink/ExampleUplink.cs#health{cs}

`UplinkHealth.Healthy` is the floor for an Uplink with nothing to report.

## Reaching the mod you integrate

Reflection, not a reference:

<<< ../../template/mod/ExampleUplink/ExampleModAccess.cs#reflection{cs}

Referencing the other mod's assembly is possible, and sometimes unavoidable. It costs you two things: your plugin fails to load when that mod is absent, rather than reporting itself unavailable, and its licence terms reach your combined work.

### Reading a field is safe. Calling a method is safe once you have read its body

A parameterless getter looks harmless, and is not necessarily. Mods reach fatal-log helpers that abort the process from the default branch of an ordinary switch, and nothing in the signature says so. Before you invoke anything on another mod's object, decompile it and check what it can reach. If you cannot, derive the value from fields: a label you format yourself is safer than the mod's own formatter.

### A field you can read is not necessarily true

Ask what writes it:

| The field is | Read it |
| --- | --- |
| Operator state, or restored from the save | Whenever you like |
| Recomputed by the mod's UI on each repaint | Only from a hook on that repaint, stamped with the UT you saw it at |
| Written only while one of its windows is open | The same, and treat "never seen" as a state of its own |

The last two are the trap. An unwritten field is not empty, it holds whatever its constructor set, which usually looks like a plausible value. For those, patch the render with a Harmony postfix, latch the value with `Planetarium.GetUniversalTime()` beside it, and publish it at that UT.

Never publish absence from a source that cannot tell "none" from "not looked yet". Publish nothing, and the client shows the Topic as still waiting rather than empty.

## The whole file

::: details ExampleUplink.cs
<<< ../../template/mod/ExampleUplink/ExampleUplink.cs{cs}
:::

Next: [Publishing a Topic](/guide/topics).
