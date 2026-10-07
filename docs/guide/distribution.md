# Distribution

An Uplink ships like any other KSP mod. Nothing about it is special, so this page links out rather than repeating what those projects document better.

## What to ship

```
GameData/ExampleUplink/
├── Plugins/
│   └── ExampleUplink.dll
├── ExampleUplink.version
├── LICENSE
└── README.md
```

Zip so it extracts into `GameData/`. Record in your README which Gonogo mod version you built against: nothing in the package can express that.

The client bundle and `gonogo-uplink.json` that `uplink-tools bundle` writes ship wherever your `uplink.json`'s `client.url` points. Keep the sidecar beside the bundle under exactly the name `gonogo-uplink.json`: the app finds it from the bundle's own URL.

## Version file

`ExampleUplink.version` is the KSP-AVC format: mod name, version, and the KSP versions you support. It is what tells a player their Uplink is out of date, and CKAN reads it.

- [KSP-AVC `.version` format](https://github.com/linuxgurugamer/KSPAddonVersionChecker/blob/master/README.md)

## SpaceDock

Free, no approval queue, and CKAN can index from it directly.

- [SpaceDock](https://spacedock.info/)

## CKAN

Indexing requires a `.netkan` file in the CKAN metadata repository. Declare the mod you integrate as a dependency, or a recommendation if your Uplink is useful without it.

You will also want to depend on the Gonogo mod, so a player cannot install your Uplink without the assembly it needs. **That is not possible yet**: the Gonogo mod is not indexed on CKAN, so there is no identifier to depend on. Until it is, say so in your description.

- [CKAN mod-author guide](https://github.com/KSP-CKAN/CKAN/wiki/Adding-a-mod-to-the-CKAN)
- [netkan specification](https://github.com/KSP-CKAN/CKAN/blob/master/Spec.md)

## Licensing

If you reference another mod's assembly, its licence may reach your combined work. Several popular KSP mods are non-commercial or share-alike. Reaching that mod by reflection, as the template does, avoids the question.

Next: [Known limits](/guide/limits).
