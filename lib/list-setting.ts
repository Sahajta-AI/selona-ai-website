// A list setting ("email:hash,email:hash") can be split over several variables:
// NAME itself and any NAME_<SOMETHING>, e.g. EDITOR_CONNECTOR_TOKENS_RAHUL.
// Vercel never shows a Sensitive variable again, so a new person gets their own
// variable: nobody else's key has to be re-issued, and deleting that variable
// switches off only that person's access.
export const listSetting = (name: string, env: Record<string, string | undefined> = process.env) =>
  Object.entries(env)
    .filter(([k]) => k === name || k.startsWith(`${name}_`))
    .flatMap(([, v]) => (v ?? "").split(","))
    .map((s) => s.trim())
    .filter(Boolean);
