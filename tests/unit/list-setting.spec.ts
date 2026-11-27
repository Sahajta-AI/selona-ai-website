import { test, expect } from "@playwright/test";
import { listSetting } from "@/lib/list-setting";

test("a list setting is read from its own variable and every NAME_<SOMETHING> variable", () => {
  const env = {
    EDITOR_CONNECTOR_TOKENS: " a@x.com:1 , b@x.com:2,",
    EDITOR_CONNECTOR_TOKENS_RAHUL: "rahul@selona.ai:3",
    EDITOR_CONNECTOR_TOKENSX: "not@this.one:4", // no underscore: a different setting
    EDITOR_ACCESS_KEY_HASHES: "other@x.com:5",
    EDITOR_CONNECTOR_TOKENS_EMPTY: undefined,
  };
  expect(listSetting("EDITOR_CONNECTOR_TOKENS", env).sort()).toEqual(["a@x.com:1", "b@x.com:2", "rahul@selona.ai:3"]);
  expect(listSetting("EDITOR_ACCESS_KEY_HASHES", env)).toEqual(["other@x.com:5"]);
  expect(listSetting("MISSING", env)).toEqual([]);
});
