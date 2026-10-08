#!/usr/bin/env bash
# Двоен клик от Finder качва API-то и сайта в Azure.
# Паролата се чете от .deploy/azure.env и се иска нова само ако Azure я откаже.
set -euo pipefail

hold() {
  [[ -t 0 ]] || return 0
  echo
  read -r -p "Натисни Enter за затваряне... " _
}
trap hold EXIT

if [[ -x /usr/libexec/path_helper ]]; then
  eval "$(/usr/libexec/path_helper -s)"
fi
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/local/share/dotnet:${PATH}"

SOURCE="${BASH_SOURCE[0]:-$0}"
ROOT="$(cd "$(dirname "$SOURCE")" && pwd)"
cd "$ROOT"

CREDS="$ROOT/.deploy/azure.env"
PUBLISH="$ROOT/.deploy/publish"
ZIP="$ROOT/.deploy/site.zip"

if [[ ! -f "$CREDS" ]]; then
  echo "Липсва $CREDS"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$CREDS"
set +a

: "${AZURE_USER:?Липсва AZURE_USER в .deploy/azure.env}"
: "${AZURE_PASSWORD:?Липсва AZURE_PASSWORD в .deploy/azure.env}"
: "${AZURE_SCM:?Липсва AZURE_SCM в .deploy/azure.env}"
: "${AZURE_SITE:?Липсва AZURE_SITE в .deploy/azure.env}"

save_password() {
  python3 - "$CREDS" "$1" <<'PY'
import sys
path, password = sys.argv[1], sys.argv[2]
lines = open(path, encoding="utf-8").read().splitlines()
found = False
out = []
for line in lines:
    if line.startswith("AZURE_PASSWORD="):
        out.append("AZURE_PASSWORD=" + repr(password))
        found = True
    else:
        out.append(line)
if not found:
    out.append("AZURE_PASSWORD=" + repr(password))
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
PY
  chmod 600 "$CREDS"
}

upload() {
  curl --silent --show-error \
    --user "${AZURE_USER}:${AZURE_PASSWORD}" \
    --header "Content-Type: application/zip" \
    --data-binary @"$ZIP" \
    --output "$ROOT/.deploy/zipdeploy-response.txt" \
    --write-out "%{http_code}" \
    --max-time 900 \
    "https://${AZURE_SCM}/api/zipdeploy"
}

for cmd in dotnet npm zip curl python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Липсва команда: $cmd"
    exit 1
  fi
done

echo "Строя интерфейса..."
(
  cd "$ROOT/frontend"
  if [[ ! -d node_modules || package-lock.json -nt node_modules ]]; then
    npm ci
  fi
  STATIC_EXPORT=true NEXT_PUBLIC_API_URL= NEXT_PUBLIC_DEMO= npx next build --webpack
)

echo "Строя API-то..."
rm -rf "$PUBLISH"
dotnet publish "$ROOT/backend/RosiNedelcheva.Api.csproj" -c Release -o "$PUBLISH" --nologo
rm -f "$PUBLISH/appsettings.Development.json"
echo "Слагам конфигурацията..."
python3 - "$PUBLISH/appsettings.Production.json" "$HOME/.microsoft/usersecrets/rosi-nedelcheva-api/secrets.json" "$ROOT/backend/appsettings.Development.json" "$AZURE_SITE" <<'PY'
import json
import sys

out_path, secrets_path, dev_path, site = sys.argv[1:5]
site = site.rstrip("/")

def load(path):
    try:
        with open(path, encoding="utf-8-sig") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return {}

secrets = load(secrets_path)
dev = load(dev_path)

def pick(section, key, fallback=""):
    flat = secrets.get(f"{section}:{key}")
    if flat not in (None, ""):
        return flat
    return dev.get(section, {}).get(key, fallback)

connection = secrets.get("ConnectionStrings:Default") or ""
if not str(connection).strip():
    sys.stderr.write("Липсва ConnectionStrings:Default в локалните user-secrets.\n")
    sys.exit(1)

production = {
    "ConnectionStrings": {"Default": connection},
    "Auth": {
        "JwtKey": pick("Auth", "JwtKey", "dev-only-key-change-in-production-32b"),
        "Issuer": pick("Auth", "Issuer", "RosiNedelcheva"),
        "Audience": pick("Auth", "Audience", "RosiNedelcheva"),
        "AdminEmail": pick("Auth", "AdminEmail", "admin@ertherapybg.com"),
        "AdminPassword": pick("Auth", "AdminPassword", "RosiAdmin2026!"),
        "AdminName": pick("Auth", "AdminName", "Росица Неделчева"),
    },
    "Mail": {
        "ConnectionString": pick("Mail", "ConnectionString", ""),
        "Host": pick("Mail", "Host", ""),
        "Port": dev.get("Mail", {}).get("Port", 587),
        "User": pick("Mail", "User", ""),
        "Password": pick("Mail", "Password", ""),
        "From": pick("Mail", "From", "DoNotReply@rosinedelcheva.com"),
        "FromName": pick("Mail", "FromName", "Росица Неделчева"),
        "ReplyTo": pick("Mail", "ReplyTo", "rosiinedelcheva@gmail.com"),
        "SiteUrl": site,
    },
    "Meta": {
        "PixelId": pick("Meta", "PixelId", ""),
        "AccessToken": pick("Meta", "AccessToken", ""),
        "TestEventCode": pick("Meta", "TestEventCode", ""),
    },
    "Stripe": {
        "SecretKey": pick("Stripe", "SecretKey", ""),
        "WebhookSecret": pick("Stripe", "WebhookSecret", ""),
        "SiteUrl": site,
    },
}

with open(out_path, "w", encoding="utf-8") as handle:
    json.dump(production, handle, ensure_ascii=False, indent=2)
    handle.write("\n")
PY
rm -rf "$PUBLISH/wwwroot"
mkdir -p "$PUBLISH/wwwroot"
cp -R "$ROOT/frontend/out/." "$PUBLISH/wwwroot/"

echo "Пакетирам..."
rm -f "$ZIP"
(
  cd "$PUBLISH"
  zip -qr "$ZIP" .
)

echo "Качвам в Azure..."
code="$(upload)"
if [[ "$code" == "401" || "$code" == "403" ]]; then
  echo "Azure отказа запазената парола."
  read -r -s -p "Нова парола от профила за публикуване: " AZURE_PASSWORD
  echo
  if [[ -z "${AZURE_PASSWORD}" ]]; then
    echo "Празна парола. Качването спря."
    exit 1
  fi
  save_password "$AZURE_PASSWORD"
  echo "Записах новата парола. Качвам отново..."
  code="$(upload)"
fi

if [[ "$code" != "200" && "$code" != "202" ]]; then
  echo "Качването не мина (HTTP ${code})."
  if [[ -s "$ROOT/.deploy/zipdeploy-response.txt" ]]; then
    echo "Отговор от Azure:"
    head -c 2000 "$ROOT/.deploy/zipdeploy-response.txt"
    echo
  fi
  exit 1
fi

rm -f "$ROOT/.deploy/zipdeploy-response.txt"
echo "Готово. Сайтът е на ${AZURE_SITE}"
