#!/usr/bin/env bash
theme_ts="${HOME}/.cache/hyde/wallbash/wallbashTheme.ts"
target_ts="${HOME}/ghub/Ether/src/wallbashTheme.ts"

if [[ -f "${theme_ts}" ]]; then
  cp "${theme_ts}" "${target_ts}"
  echo "Copied ${theme_ts} to ${target_ts}"
else
  echo "Error: ${theme_ts} not found"
  exit 1
fi
