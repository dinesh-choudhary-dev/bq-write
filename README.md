# bq-write

Ask questions about your data in plain English. `bq-write` reads your app's source code to understand your schema — column meanings, status codes, table relationships — then uses Claude to generate accurate BigQuery SQL and run it.

```
bq> How many active users signed up in the last 7 days?

  ┌──────────────┬───────┐
  │ signup_date  │ count │
  ├──────────────┼───────┤
  │ 2026-03-11   │ 312   │
  │ 2026-03-12   │ 289   │
  │ ...          │ ...   │
  └──────────────┴───────┘

  7 rows · 0.83 MB processed

Found 2,041 new active users over the last 7 days, peaking on Tuesday.
```

---

## How it works

1. **`bq-write init`** — scans your local repo for ORM models, migrations, and schema files, then caches them as context
2. **`bq-write query`** — loads that context into Claude's system prompt, then lets you ask questions in a REPL or one-shot mode
3. Claude calls BigQuery tools iteratively (`list_tables` → `run_query`) to ground its SQL in the real live schema

No schema hallucination. No `SELECT *`. No guessing what `status = 'ACT'` means.

---

## Installation

```bash
npm install -g bq-write
```

**Requirements:**
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- Google Cloud credentials (see [BigQuery auth](#bigquery-auth))

---

## Setup

### 1. Set your API key

Add to `~/.zshrc` or `~/.bashrc`:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Then reload: `source ~/.zshrc`

### 2. BigQuery auth

```bash
gcloud auth application-default login
```

This sets up Application Default Credentials — no extra config needed.

### 3. Index your repo

Run once inside your application's repository:

```bash
cd ~/my-app
bq-write init
```

This scans for schema-relevant files (models, migrations, SQL, GraphQL, etc.) and caches them to `.bq-write/context.md`. Re-run whenever your schema changes significantly.

---

## Usage

### Interactive REPL

```bash
bq-write query --dataset "my-project.my_dataset"
```

```
Context: 14 files, ~21,000 tokens (indexed 2h ago)

Ask questions in plain English. Type `exit` to quit.

bq> Which products have the most abandoned carts this week?
bq> Break that down by user country
bq> exit
```

Conversation history is kept across turns — you can ask follow-up questions naturally.

### One-shot

```bash
bq-write query \
  --dataset "my-project.my_dataset" \
  --question "How many orders were refunded last month?"
```

### Options

```
bq-write init [options]
  --dir <dir>       Project directory to scan (default: current directory)

bq-write query [options]
  -d, --dataset     BigQuery dataset — required (format: project.dataset)
  -q, --question    Question to ask (omit for REPL mode)
  --dir <dir>       Directory with .bq-write cache (default: current directory)
```

If your app repo and working directory differ:

```bash
bq-write init --dir ~/my-app
bq-write query --dataset "my-project.my_dataset" --dir ~/my-app
```

---

## What gets indexed

`bq-write init` scans for files in priority order, within a token budget (default 80K):

| Priority | Files |
|---|---|
| 1 — Highest | `models.py`, `schema.prisma`, `schema.rb`, ORM model files |
| 2 | Migrations, TypeORM entities |
| 3 | `.sql` DDL files, Alembic versions |
| 4 | GraphQL schemas, OpenAPI/Swagger specs |
| 5 — Fallback | `README.md` |

Binary files, `node_modules`, `dist`, lock files are always skipped.

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | — | Your Anthropic API key |
| `BQ_MAX_RESULTS` | No | `100` | Max rows returned per query |
| `CONTEXT_MAX_TOKENS` | No | `80000` | Token budget for indexed context |

---

## Tips

- **Re-index after schema changes:** `bq-write init` only needs to re-run when your models or migrations change meaningfully
- **Add `.bq-write/` to `.gitignore`** if you don't want to commit the cached context
- **Large repos:** increase `CONTEXT_MAX_TOKENS` if important model files are being cut off
- **Multi-repo setups:** use `--dir` to point at the app repo while running queries from anywhere

---

## Contributing

Issues and PRs welcome at [github.com/dinesh-choudhary-dev/bq-write](https://github.com/dinesh-choudhary-dev/bq-write).

## License

MIT
