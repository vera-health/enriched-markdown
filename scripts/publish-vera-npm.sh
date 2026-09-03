#!/usr/bin/env bash
# Publish the vera fork to the public npm registry as a scoped package:
#
#   ./scripts/publish-vera-npm.sh 1.0.2-vera.6            # publish
#   ./scripts/publish-vera-npm.sh 1.0.2-vera.7 --dry-run  # inspect first
#
# The tarball is exactly what upstream ships (their prepare + prepack steps
# run unchanged — diet package, RaTeX + grammars fetched by postinstall.mjs
# from their pinned releases); only the name gains the scope and the version
# the vera suffix. The rename happens after the build because yarn resolves
# lifecycle scripts against the workspace graph by package name.
#
# Consumers depend on it through an npm alias so the on-disk folder stays
# `react-native-enriched-markdown`:
#
#   "react-native-enriched-markdown": "npm:@vera-health/react-native-enriched-markdown@<version>"
#
# Bun consumers must list BOTH names in trustedDependencies so postinstall
# runs regardless of which name bun matches against.
set -euo pipefail

VERSION="${1:?usage: $0 <version> [--dry-run] [scope]}"
shift
DRY_RUN=""
SCOPE="@vera-health"
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN="--dry-run" ;;
    @*) SCOPE="$arg" ;;
    *) echo "unknown argument: $arg" >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RN_PKG="$REPO_ROOT/packages/react-native-enriched-markdown"
cd "$RN_PKG"

git diff --quiet -- package.json || {
  echo "package.json has uncommitted changes; commit or stash them first" >&2
  exit 1
}
cleanup() {
  git -C "$REPO_ROOT" checkout -- packages/react-native-enriched-markdown/package.json
  bash "$REPO_ROOT/scripts/prepare-npm-publish.sh" postpack
  rm -f "$RN_PKG"/vera-health-react-native-enriched-markdown-*.tgz
}
trap cleanup EXIT

yarn prepare
bash "$REPO_ROOT/scripts/prepare-npm-publish.sh" prepack

node -e '
  const fs = require("fs");
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  pkg.name = process.argv[1] + "/react-native-enriched-markdown";
  pkg.version = process.argv[2];
  pkg.repository = { type: "git", url: "https://github.com/vera-health/enriched-markdown.git" };
  fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
' "$SCOPE" "$VERSION"

TARBALL="$(npm pack --ignore-scripts | tail -1)"
echo "==> packed $TARBALL"
npm publish "$TARBALL" --access public --tag vera ${DRY_RUN}
