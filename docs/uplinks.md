---
title: Uplinks
description: Read any Uplink's Topics, commands and widgets from a link to its folder.
---

# Uplinks

Paste a link to an Uplink's folder to read what it publishes, accepts and draws. The page reads the Uplink's `docs/spec.json`, which `uplink-tools page` writes beside its README. When the folder is a release, with `gonogo-uplink.json` beside the client bundle, the page also loads that client the way the app does and draws each widget it registers, as it looks before the first sample arrives.

<ClientOnly>
  <UplinkViewer />
</ClientOnly>
