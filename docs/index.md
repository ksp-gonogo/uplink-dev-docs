---
layout: home
hero:
  name: Gonogo Uplink
  text: Integrate a KSP mod with mission control
  tagline: Publish telemetry from your mod, accept commands, and render it on screen.
  actions:
    - theme: brand
      text: Start the guide
      link: /guide/
    - theme: alt
      text: Reference
      link: /reference/
features:
  - title: One assembly to compile against
    details: The plugin half implements one interface from Sitrep.Contract.dll, which the Gonogo mod already installs.
  - title: A typed wire contract
    details: '@ksp-gonogo/sitrep-sdk types every message and every built-in Topic payload, so the browser half is checked at compile time.'
  - title: A design system that matches
    details: '@ksp-gonogo/ui-kit is the same set of primitives the built-in screens use.'
---
