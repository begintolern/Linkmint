ECHO is on.
## Merchant Sources (Allowed / Disallowed)

**Single source of truth (DB schema)**  
- `MerchantRule.allowedSources` — **JSON** (`string[]` or `null`)
- `MerchantRule.disallowed` — **JSON** (`string[]` or `null`)

We intentionally use JSON here to match the current codebase and avoid drift.  
APIs normalize these to `string[] | null` and expose them to clients as:

- `allowedSources: string[] | null`
- `disallowedSources: string[] | null`  ← **returned** field name (UI contract)

### How to read (server)
```ts
const rows = await prisma.merchantRule.findMany({
  select: {
    id: true,
    allowedSources: true, // JSON
    disallowed: true,     // JSON
  },
});

const normalize = (v: unknown): string[] | null =>
  Array.isArray(v) ? v.map(x => String(x).trim()).filter(Boolean) : null;

const dto = rows.map(m => ({
  id: m.id,
  allowedSources: normalize(m.allowedSources),
  disallowedSources: normalize(m.disallowed), // note: API field name
}));```
