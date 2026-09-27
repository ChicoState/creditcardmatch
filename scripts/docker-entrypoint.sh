#!/usr/bin/env sh

set -eu

# Determine the owner of the source directory
DEV_UID="${LOCAL_UID:-$(stat -c '%u' /workspace)}"
DEV_GID="${LOCAL_GID:-$(stat -c '%g' /workspace)}"

mkdir -p /workspace/node_modules
mkdir -p /workspace/.next
mkdir -p /tmp/dev-home



for directory in /workspace/node_modules /workspace/.next; do
  # Change permissions of these directories based on returned user and group id
  chown -R "${DEV_UID}:${DEV_GID}" "$directory"
done

# Set the home environemnt for the following commands to run inside desired user and group
export HOME=/tmp/dev-home


# Execute the following commands with the permission of user and group id  as owner of source directory
# AI suggested to use --clear-groups to not have inhereritance interference from root privileges
exec setpriv --reuid="${DEV_UID}" --regid="${DEV_GID}" --clear-groups "$@"
