# ISitrepUplink

`Sitrep.Contract` · `Sitrep.Contract.dll`

The interface every Uplink implements.

```csharp
public interface ISitrepUplink
{
    UplinkManifest Manifest { get; }
    void Register(IUplinkHost host);
    UplinkHealth Health();
}
```

| Member | When it runs |
| --- | --- |
| `Manifest` | Read before `Register`. Must be constant for the lifetime of the Uplink. |
| `Register` | Once, on the main thread, at load. |
| `Health` | Polled. Must not block or touch the game. |

An exception from `Register` disables that Uplink alone.

## SitrepUplinkAttribute

```csharp
[AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
public sealed class SitrepUplinkAttribute : Attribute
{
    public string Id { get; }
    public int ContractMajor { get; }
    public int ContractMinor { get; }

    public SitrepUplinkAttribute(
        string id,
        int contractMajor = ContractVersion.Major,
        int contractMinor = ContractVersion.Minor);
}
```

Discovery scans loaded assemblies that reference `Sitrep.Contract` for classes carrying this attribute and implementing `ISitrepUplink`, then instantiates each through its **public parameterless constructor**.

The two version arguments default to the constants in the `Sitrep.Contract` you compiled against, and are inlined into your assembly at build time. Leave them alone; they are how Gonogo knows which contract your build assumed.

## UplinkManifest

```csharp
public sealed class UplinkManifest
{
    public string Id { get; set; }
    public string Version { get; set; }
    public string Name { get; set; }
    public string Author { get; set; }
    public string Repo { get; set; }
    public string? ExpectedClientHash { get; set; }
    public UplinkClientSource? ClientSource { get; set; }
    public IReadOnlyList<ChannelDeclaration> Channels { get; set; }
    public IReadOnlyList<CommandDeclaration> Commands { get; set; }
}
```

`Id` must equal the attribute's id. `Channels` and `Commands` are validated at startup: a command handler with no matching declaration throws.

<<< ../../../template/mod/ExampleUplink/ExampleUplink.cs#manifest{cs}

## Availability

```csharp
public readonly struct Availability
{
    public bool IsAvailable { get; }
    public string? Reason { get; }

    public static readonly Availability Available;
    public static Availability Unavailable(string reason);
}
```

<<< ../../../template/mod/ExampleUplink/HostSurface.cs#availability{cs}

## UplinkHealth

```csharp
public enum UplinkHealthState { Healthy, Degraded, Unavailable }

public readonly struct UplinkHealthFact
{
    public string Label { get; }
    public string? Value { get; }

    public UplinkHealthFact(string label, string? value);
}

public readonly struct UplinkHealth
{
    public UplinkHealthState State { get; }
    public string? Detail { get; }
    public IReadOnlyList<UplinkHealthFact> Facts { get; }

    public UplinkHealth(UplinkHealthState state, string? detail = null);
    public UplinkHealth(
        UplinkHealthState state,
        string? detail,
        IReadOnlyList<UplinkHealthFact>? facts);

    public static readonly UplinkHealth Healthy;
}
```

`Facts` are label/value pairs shown next to the state. Put a count or a version in them, not a sentence.

<<< ../../../template/mod/ExampleUplink/ExampleUplink.cs#health{cs}

## IUplinkCapabilityDeclarer

```csharp
public interface IUplinkCapabilityDeclarer
{
    void DeclareCapabilities(Kernel kernel);
}
```

Optional second interface. Every implementation runs before any `Register`, so a capability exists before another Uplink tries to provide for it. See [Kernel](/reference/mod/kernel).
