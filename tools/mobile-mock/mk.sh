#!/bin/bash
# builds every mock page from the packaged theme
M=/home/claude/MORC/_mock
G="$(cd "$(dirname "$0")" && pwd)/gen.py"
mk(){ mkdir -p "$M/$1"; python3 $G "$2" "$3" "$M/$1/index.html"; }
mk "" home ""
mk cart cart ""
mk collections/all shop ""
mk products/ward-chelsea product ward-chelsea
for p in manifesto:manifesto contract:contract track:track liked:wishlist feed:feed policies:policies about:about contact:contact offers:offers giving:giving gifts:gifts; do
  mk "pages/${p%%:*}" "${p##*:}" ""
done
D="$(cd "$(dirname "$0")" && pwd)"
BODY=$D/faq.html mk pages/faq page ""
BODY=$D/blog.html mk blogs/journal page ""
mk 404 notfound ""
