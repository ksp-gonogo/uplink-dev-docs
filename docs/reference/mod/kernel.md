# Kernel

`Sitrep.Contract`

A capability registry. Use it when an Uplink must **call** something another part of the system provides, or **provide** something for others, without either side referencing the other's assembly.

You will not need it for a plugin that only publishes and accepts commands.

```csharp
public sealed class Kernel
{
    public IReadOnlyList<ResolutionNotice> LastNotices { get; }

    public void RegisterCapability(CapabilityDescriptor descriptor);
    public void RegisterProvider(ProviderRegistration registration);
    public ResolveResult Resolve(ResolveOptions opts);
    public IReadOnlyList<object?> Active(string capability);
    public T Query<T>(string capability);
}
```

Reach it through `host.Kernel`.

## Providing

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#kernel{cs}

```csharp
public sealed class ProviderRegistration
{
    public string Capability { get; set; }
    public string Id { get; set; }
    public bool IsDefault { get; set; }
    public double Priority { get; set; }
    public IReadOnlyList<string>? Deps { get; set; }
    public ProviderVersions? Versions { get; set; }
    public Func<bool>? CanServe { get; set; }
    public Func<ProviderContext, object?> Factory { get; set; }
}
```

```csharp
public sealed class ProviderContext
{
    public string KernelVersion { get; }

    public T Query<T>(string capability);
    public T Vanilla<T>(string capability);
}

public sealed class ProviderVersions
{
    public string Self { get; set; }
    public string? MinKernelVersion { get; set; }
    public VersionRange? TargetModVersionRange { get; set; }
}
```

`Factory` is called once, at resolution, and its return value is what callers get. Its `ProviderContext` lets a provider reach other capabilities as it is built, and `Vanilla<T>` reaches the fallback rather than the winning provider. `CanServe` lets you decline at resolution time: return false when the mod you depend on turned out to be absent. `Priority` decides between competing providers for an exclusive capability, highest first.

## Declaring a capability

Only if you own it. Implement `IUplinkCapabilityDeclarer`, which runs before any `Register`, so the capability exists before another Uplink tries to provide for it.

```csharp
public sealed class CapabilityDescriptor
{
    public string Id { get; set; }
    public bool Exclusive { get; set; }
    public bool SpineCritical { get; set; }
    public Func<ProviderContext, object?>? Vanilla { get; set; }
}
```

`Exclusive` means one winner rather than a list. `Vanilla` is the fallback used when no provider serves.

Registering a provider for a capability nobody declared throws.

## Consuming

```csharp
public T Query<T>(string capability);
public IReadOnlyList<object?> Active(string capability);
```

```csharp
public sealed class ResolveOptions
{
    public string KernelVersion { get; set; }
    public string? ModVersion { get; set; }
    public IReadOnlyDictionary<string, string>? Preferences { get; set; }
}

public sealed class ResolveResult
{
    public IReadOnlyList<ResolutionNotice> Notices { get; set; }
}
```

`Resolve` is the host's to call, not yours. An Uplink registers and queries.

**Nothing resolves until every Uplink has registered.** That ordering is what allows an Uplink to provide at all, so you cannot query during your own `Register`. Capture `host.Kernel` there and query at each use.

Both halves of an interface you share this way must live in `Sitrep.Contract`, since that is the only assembly both sides can reference. The same is true of the capability id string: if you cannot put it somewhere both halves see, both halves spell it out and nothing catches a typo.

## Resolution notices

```csharp
public sealed class ResolutionNotice
{
    public string Capability { get; set; }
    public string Kind { get; set; }   // superseded | version-excluded | vanilla-fallback
                                       // | factory-failed | provider-declined
    public string Detail { get; set; }
}
```

`LastNotices` is where a provider that lost, threw, or declined says so. It is the only place that is visible.
