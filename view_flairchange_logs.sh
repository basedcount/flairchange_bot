#!/usr/bin/env bash

SERVICE_NAME="flairchange_bot.service"

if systemctl --user list-units --type=service | grep -q "$SERVICE_NAME"; then
    echo "Showing live logs for $SERVICE_NAME..."
    journalctl --user -u "$SERVICE_NAME" --follow
else
    echo "Error: User service $SERVICE_NAME not found."
    exit 1
fi
