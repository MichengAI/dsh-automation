import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "js-yaml";

interface PackageManifest {
  name?: string;
  packageManager?: string;
  engines?: { node?: string };
  exports?: Record<string, { default?: string } | string>;
  files?: string[];
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  dsh?: {
    bundle?: { patch?: string };
    client?: { platform?: string; inject?: string[] };
  };
}

const root = new URL("../", import.meta.url);

test("包保持可安装的 DSH bundle 与 Web client 契约", async () => {
  const manifest = JSON.parse(
    await readFile(new URL("package.json", root), "utf8"),
  ) as PackageManifest;

  assert.equal(manifest.name, "@michengai/dsh-automation");
  assert.equal(manifest.packageManager, "pnpm@11.22.0");
  assert.equal(manifest.engines?.node, "^22.19.0 || >=24.0.0");
  assert.equal(manifest.dsh?.bundle?.patch, "./cordis.patch.yml");
  assert.equal(manifest.dsh?.client?.platform, "web");
  assert.deepEqual(manifest.dsh?.client?.inject, [
    "@deepseek-ai/dsh-client-connection",
    "@deepseek-ai/dsh-client-locale",
    "@deepseek-ai/dsh-client-ui-settings",
    "@deepseek-ai/dsh-client-ui-conversation",
    "@deepseek-ai/dsh-client-ui-primitives",
  ]);
  assert.deepEqual(manifest.exports?.["./client"], {
    types: "./lib/types/client/index.d.ts",
    default: "./lib/client.js",
  });
  assert.ok(manifest.files?.includes("lib"));
  assert.ok(manifest.files?.includes("cordis.patch.yml"));
  assert.equal(manifest.scripts?.prepare, undefined);
  assert.equal(manifest.peerDependencies?.react, "^18.2.0");
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/cordis"],
    ">=4.0.1 <5.0.0",
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/dsh-agent"],
    "0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2",
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/dsh-client-runtime"],
    undefined,
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/dsh-client-ui-renderer"],
    undefined,
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/dsh-client-ui-workspace"],
    undefined,
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/dsh-client-ui-primitives"],
    "0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2",
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/dsh-permission-presets"],
    "0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2",
  );
  assert.equal(
    manifest.peerDependencies?.["@deepseek-ai/schemastery"],
    ">=3.18.1 <4.0.0",
  );
  assert.equal(
    manifest.devDependencies?.["@deepseek-ai/dsh-agent"],
    "0.1.5-rc.2",
  );
  assert.equal(
    manifest.devDependencies?.["@deepseek-ai/dsh-client-ui-primitives"],
    "0.1.5-rc.2",
  );
  for (const [name, range] of Object.entries(manifest.peerDependencies ?? {})) {
    if (name.startsWith("@deepseek-ai/dsh-")) {
      assert.equal(
        range,
        "0.1.0-rc.8 || 0.1.1-rc.2 || 0.1.2-rc.1 || 0.1.5-rc.1 || 0.1.5-rc.2",
        name,
      );
    }
  }
  for (const [name, version] of Object.entries(
    manifest.devDependencies ?? {},
  )) {
    if (name.startsWith("@deepseek-ai/dsh-"))
      assert.equal(version, "0.1.5-rc.2", name);
  }
  assert.deepEqual(manifest.peerDependenciesMeta?.react, { optional: true });

  const patch = await readFile(new URL("cordis.patch.yml", root), "utf8");
  const entries = load(patch) as Array<{
    id?: string;
    name?: string;
    inject?: string[];
    insert?: Array<{ id: string; name: string }>;
  }>;
  assert.ok(Array.isArray(entries));
  assert.deepEqual(
    entries.filter((entry) => entry.id === "connection"),
    [
      {
        id: "connection",
        name: "@deepseek-ai/dsh-client-connection",
        inject: ["webServer", "webRuntime"],
      },
    ],
  );
  assert.ok(
    entries.some((entry) =>
      entry.insert?.some(
        (plugin) =>
          plugin.id === "dsh-automation" &&
          plugin.name === "@michengai/dsh-automation",
      ),
    ),
  );

  await Promise.all([
    access(new URL("lib/index.js", root)),
    access(new URL("lib/client.js", root)),
    access(new URL("lib/types/index.d.ts", root)),
    access(new URL("lib/types/client/index.d.ts", root)),
  ]);
  const clientBundle = await readFile(new URL("lib/client.js", root), "utf8");
  assert.match(clientBundle, /window\.__ModuleLoader__\.load\(/);
  assert.match(clientBundle, /@michengai\/dsh-automation/);
});

test("客户端入口在插件生命周期内安装常驻会话同步桥", async () => {
  const source = await readFile(new URL("src/client/index.ts", root), "utf8");
  assert.match(
    source,
    /import \{ createAutomationRuntime, installAutomationSessionSync \} from '\.\/runtime\.js'/,
  );
  assert.match(
    source,
    /ctx\.effect\(\(\) => installAutomationSessionSync\(runtime, \(\) => ctx\.sessions\), 'dsh-automation: session sync'\)/,
  );
});
