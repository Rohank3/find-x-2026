#!/usr/bin/env bash
# FIND X Local Services Manager (PostgreSQL + Redis/Valkey)

set -e

export LD_LIBRARY_PATH="$HOME/.local/pgsql/usr/lib:$LD_LIBRARY_PATH"
export PATH="$HOME/.local/pgsql/usr/bin:$HOME/.local/node/bin:$PATH"

mkdir -p "$HOME/.local/pgsql/logs" "$HOME/.local/valkey/logs"

# 1. Start PostgreSQL if not already running
if ! "$HOME/.local/pgsql/usr/bin/pg_isready" -h localhost -p 5432 >/dev/null 2>&1; then
    echo "Starting PostgreSQL..."
    "$HOME/.local/pgsql/usr/bin/pg_ctl" -D "$HOME/.local/pgsql/data" -l "$HOME/.local/pgsql/logs/pg.log" -o "-k /tmp -p 5432" start
else
    echo "PostgreSQL is already running."
fi

# 2. Start Valkey (Redis) if not already running
if ! "$HOME/.local/valkey/usr/bin/valkey-cli" ping >/dev/null 2>&1; then
    echo "Starting Valkey (Redis)..."
    "$HOME/.local/valkey/usr/bin/valkey-server" --port 6379 --daemonize yes --logfile "$HOME/.local/valkey/logs/valkey.log" --pidfile "$HOME/.local/valkey/valkey.pid"
else
    echo "Valkey (Redis) is already running."
fi

echo "All services active (PostgreSQL: 5432, Redis: 6379)."
