# National Care Home Finder — agent instructions

ChatGPT sets technical direction. Cursor implements it in this repository. A person reviews and merges. Agents do not merge, deploy, or change production.

## Application

Next.js App Router project (`app/`) with React client pages and one browser Supabase client in `lib/supabase.ts`. Washington adult-family-home search, the map, market pages, owner accounts, and admin review are the active product. Other states on the home page are labels only.

There is no `middleware.ts`, no `app/api` route, and no SQL in the repository. Database structure and Row Level Security live in Supabase, outside this repo. Treat them as production until a human approves a non-production change.

## Commands

`package.json` defines only:

- `npm run dev` — local Next.js dev server. Not a validation check.
- `npm run build` — the pull-request validation command.
- `npm run start` — serves an existing production build. Do not use it to deploy.

Do not add dependencies, package scripts, or lockfile changes unless the task asks for them. There is no lint or test script yet.

## Git

- Branch from current `main`. Do not commit on `main`.
- Open a draft pull request into `main`. Do not merge it.
- Do not push to `main`.
- Keep unrelated work, including `dev-facility-search-fix`, off the branch you were asked to use.

## Production boundary

Stop and ask before any action that can change production:

- Vercel deploy, alias, env, or domain changes
- Supabase project settings, schema, policies, functions, or data
- GitHub secrets, environment variables, or DNS
- Merging, force-pushing, or pushing to `main`

The publishable Supabase key may be referenced as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never print key values, commit `.env` files, or put a service-role key in client code or `NEXT_PUBLIC_` variables.

## Where to look next

Project rules in `.cursor/rules/` cover architecture, Supabase security, migrations, testing, git, and production protection. Pull-request validation is `.github/workflows/pr-validation.yml`.
