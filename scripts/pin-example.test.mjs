import assert from "node:assert/strict";
import test from "node:test";
import { pinCsproj, pinPackageJson } from "./pin-example.mjs";

test("the three packages move and nothing else in the manifest does", () => {
  const text = JSON.stringify({
    dependencies: { "@ksp-gonogo/ui-kit": "1.0.0", "styled-components": "^6.0.0" },
    devDependencies: { "@ksp-gonogo/sitrep-sdk": "1.0.0", "@ksp-gonogo/uplink-tools": "1.0.0", typescript: "^5.9.3" },
  });
  const out = JSON.parse(pinPackageJson(text, "1.1.0-rc.4"));
  assert.equal(out.dependencies["@ksp-gonogo/ui-kit"], "1.1.0-rc.4");
  assert.equal(out.devDependencies["@ksp-gonogo/sitrep-sdk"], "1.1.0-rc.4");
  assert.equal(out.devDependencies["@ksp-gonogo/uplink-tools"], "1.1.0-rc.4");
  assert.equal(out.dependencies["styled-components"], "^6.0.0");
  assert.equal(out.devDependencies.typescript, "^5.9.3");
});

test("only the contract's range moves in a project file", () => {
  const text = `<PackageReference Include="KspGonogo.Sitrep.Contract" Version="[1.0.0]" IncludeAssets="compile" />\n<PackageReference Include="Other" Version="[1.0.0]" />`;
  const out = pinCsproj(text, "1.1.0-rc.4");
  assert.match(out, /Contract" Version="\[1\.1\.0-rc\.4\]"/);
  assert.match(out, /Include="Other" Version="\[1\.0\.0\]"/);
});
