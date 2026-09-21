#!/usr/bin/env bash
set -euo pipefail
DOMAIN="stsalv-smart-schema-builder"
OUT="languages/${DOMAIN}.pot"

find includes . -maxdepth 1 -name '*.php' -print0 | \
  xargs -0 xgettext --default-domain="$DOMAIN" --language=PHP \
    --keyword=__ --keyword=_e --keyword=_x:1,2c --keyword=_n:1,2 \
    --keyword=esc_html__ --keyword=esc_attr__ --keyword=esc_html_e --keyword=esc_attr_e \
    --add-comments=translators: --from-code=UTF-8 -o /tmp/ssb-php.pot

find src -name '*.js' -print0 | \
  xargs -0 xgettext --default-domain="$DOMAIN" --language=JavaScript \
    --keyword=__ --keyword=_x:1,2c --keyword=_n:1,2 \
    --add-comments=translators: --from-code=UTF-8 -o /tmp/ssb-js.pot

msgcat --use-first /tmp/ssb-php.pot /tmp/ssb-js.pot > "$OUT"
msgfmt --check-format --check-domain -o /dev/null "$OUT" && echo "POT OK"