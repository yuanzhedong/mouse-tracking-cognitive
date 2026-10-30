#!/bin/sh
# Stamp every local script/stylesheet include with ?v=<stamp> so browsers
# never mix files from two deploys (GitHub Pages lets them cache 10 min).
# Run before each deploy:  sh tools/bump-version.sh
cd "$(dirname "$0")/.." || exit 1
V=$(date +%Y%m%d%H%M)
for f in index.html done.html */index.html; do
  sed -i "" -E "s#((src|href)=\"(\.\./)?shared/[A-Za-z0-9_.-]+\.(js|css))(\?v=[0-9]+)?\"#\1?v=$V\"#g" "$f"
done
echo "assets stamped v=$V"
