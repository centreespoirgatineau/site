#!/usr/bin/env bash
# Run every 2 minutes from root's crontab. If origin/main moved, deploy it.
#   */2 * * * * /opt/site/autoupdate.sh >> /var/log/site-autoupdate.log 2>&1
set -euo pipefail
cd "$(dirname "$0")"
git fetch -q origin main
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] && exit 0
echo "[$(date -Is)] $LOCAL → $REMOTE"
git reset -q --hard origin/main
SITE_NO_PULL=1 ./update.sh
