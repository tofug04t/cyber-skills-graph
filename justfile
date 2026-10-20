# Local build and test recipes. Run `just` to list them.
# Requires: just, Node 20+ (npm), Python 3.

set shell := ["bash", "-euo", "pipefail", "-c"]

app := "app"

# List available recipes
default:
    @just --list

# Install app dependencies
install:
    cd {{ app }} && npm install

# Start the dev server at http://localhost:5173/cyber-skills-graph/
dev: install
    cd {{ app }} && npm run dev -- --port 5173 --strictPort

# Regenerate app data from the source files in data/
data:
    python3 scripts/apply_skill_merges.py
    python3 scripts/apply_skill_cuts.py
    python3 scripts/apply_role_changes.py
    python3 scripts/apply_skill_names.py
    python3 scripts/check_skill_colors.py
    python3 scripts/etl.py
    python3 scripts/etl_companions.py

# Type-check the app
typecheck: install
    cd {{ app }} && npx tsc -b --noEmit

# Lint the app
lint: install
    cd {{ app }} && npm run lint

# Production build into app/dist
build: install
    cd {{ app }} && npm run build

# Serve the production build at http://localhost:4173/cyber-skills-graph/
preview: build
    cd {{ app }} && npm run preview -- --port 4173 --strictPort

# Everything that should pass before opening a PR
check: data typecheck lint build

# Remove build output and installed dependencies
clean:
    rm -rf {{ app }}/dist {{ app }}/node_modules
