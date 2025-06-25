mkdir -p docs
cp -r src/* docs
npx svgo@4.0.0 src/map.svg -o docs/map.svg
drop-inline-css -r src -o docs
deno run -A bundle.js ./src/index.js > docs/index.js
minify -r docs -o .
