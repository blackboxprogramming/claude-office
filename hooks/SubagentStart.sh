#!/bin/bash
# Claude Office hook: SubagentStart
# Writes subagent start events for task duration tracking

MONITOR_FILE="${HOME}/.claude-office/events.jsonl"
mkdir -p "$(dirname "$MONITOR_FILE")"
EVENT=$(cat)
echo "{\"event\":\"subagent_start\",\"timestamp\":$(date +%s000),\"data\":${EVENT}}" >> "$MONITOR_FILE"
