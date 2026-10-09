---
layout: home
hero:
  name: Gonogo Uplink Docs
  text: Build an Uplink that connects part of KSP to Gonogo
  actions:
    - theme: brand
      text: Start the guide
      link: /guide/
    - theme: alt
      text: Reference
      link: /reference/
features:
  - title: The plugin
    details: A .NET assembly KSP loads beside the Gonogo mod. It reads the game or another mod, publishes Topics and accepts commands.
    link: /guide/plugin
  - title: The client
    details: A React bundle the Gonogo app loads. It registers widgets that read those Topics and send those commands, and adds to the app's own widgets.
    link: /guide/client-widget
  - title: The tools
    details: "@ksp-gonogo/uplink-tools scaffolds, generates, builds and releases an Uplink. @ksp-gonogo/sitrep-sdk and @ksp-gonogo/ui-kit are what the client imports."
    link: /guide/first-uplink
---
