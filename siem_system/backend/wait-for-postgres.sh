#!/bin/sh
# Wait for PostgreSQL to be ready
set -e

host="$1"
port="$2"
shift 2
cmd="$@"

until pg_isready -h "$host" -p "$port"; do
  echo "Waiting for PostgreSQL to be ready at $host:$port..."
  sleep 1
done

echo "PostgreSQL is ready!"
exec $cmd