#!/usr/bin/env bash
# Run every 2 minutes from root's crontab. If origin/main moved, deploy it.
#   */2 * * * * /opt/site/autoupdate.sh >> /var/log/site-autoupdate.log 2>&1
#
# The commit that is actually being served is recorded in `.deployed`, and not
# inferred from HEAD. A deploy that failed half way used to move HEAD anyway, so
# the following run saw nothing left to do and the broken state stayed until
# somebody noticed. Now a failure is simply retried two minutes later.
set -uo pipefail
cd "$(dirname "$0")"

# One deploy at a time: a build can take longer than the two minutes between runs.
exec 9>/tmp/site-autoupdate.lock
flock -n 9 || exit 0

git fetch -q origin main || exit 0
REMOTE=$(git rev-parse origin/main)
DEPLOYED=$(cat .deployed 2>/dev/null || echo "aucun")
[ "$DEPLOYED" = "$REMOTE" ] && exit 0

echo "[$(date -Is)] $DEPLOYED → $REMOTE"
git reset -q --hard origin/main

# Called through bash rather than as ./update.sh: a checkout pushed from a
# Windows machine can arrive without the executable bit, and the deploy must not
# depend on it.
if SITE_NO_PULL=1 bash ./update.sh; then
  echo "$REMOTE" > .deployed
else
  echo "[$(date -Is)] ECHEC du deploiement de $REMOTE, nouvel essai dans deux minutes"
  exit 1
fi
