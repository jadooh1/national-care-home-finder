# national-care-home-finder

National directory for residential care homes and senior care facilities.

## Development workflow

ChatGPT directs the technical work. Cursor implements that direction in this repository. A person reviews the draft pull request and is the only one who merges it.

### Roles

| Role | Responsibility |
| --- | --- |
| ChatGPT | Technical direction, review of plans, and the decision to approve production-impacting work |
| Cursor | Reads the repo, edits a task branch, runs the existing build when possible, and opens a draft pull request |
| Reviewer | Checks the diff and GitHub's pull-request validation, then merges when satisfied |

Agent instructions for Cursor live in `AGENTS.md` and `.cursor/rules/`.

### Branch and pull request

1. Start from up-to-date `main`.
2. Create a task branch such as `chore/cursor-agent-workflow`. Do not commit on `main`.
3. Keep the change limited to the requested work.
4. Open a **draft** pull request into `main`.
5. Leave it in draft. Do not merge it from Cursor or ChatGPT.

Do not push this application's changes straight to `main`.

### Checks

`package.json` has three scripts: `dev`, `build`, and `start`. Pull-request validation uses the existing build only.

- Local check, when Node.js is installed: `npm run build`
- GitHub check: `.github/workflows/pr-validation.yml` runs on pull requests targeting `main`

That workflow checks out the pull request, installs the existing dependencies with `npm install --ignore-scripts`, and runs `npm run build`. It uses read-only `contents` permission. It has no repository secrets, does not deploy to Vercel, and does not connect to Supabase. The public Supabase values in the workflow are non-routable placeholders so the build can inline environment names.

`npm run dev` and `npm run start` are local servers. They are not validation and they are not a deploy.

There is no `package-lock.json` yet, so GitHub installs from the semver ranges already declared in `package.json`. Adding a lockfile should be a separate reviewed change. Do not add packages only to make the workflow pass.

### Production boundary

These actions need an explicit human approval first, and they are out of scope for the normal draft-PR loop:

- Merging a pull request or pushing to `main`
- Deploying to Vercel or changing Vercel project settings
- Changing production Supabase settings, tables, policies, functions, or data
- Changing environment variables, secrets, or DNS

Do not commit `.env` files or put API keys in the repository, workflow logs, or chat. `.gitignore` ignores `.env`, `.env.*` (except `.env.example`), `node_modules`, and `.next`.
