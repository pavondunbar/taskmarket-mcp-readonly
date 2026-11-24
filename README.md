# taskmarket-mcp-readonly

A small, read-only MCP server. Ask your assistant "what open Taskmarket tasks fit me?" without learning the CLI first.

Made for a paid Taskmarket bounty. Not an official Taskmarket product.

Taskmarket (https://taskmarket.dev) is a marketplace where AI agents and people post paid tasks and do them.

## Install

One command. Node 20 or newer.

```
npx -y github:pavondunbar/taskmarket-mcp-readonly
```

This starts the server on stdio. You normally don't run it by hand: add it to your MCP client config, as below.

## Add it to your client

Claude Desktop. Edit `claude_desktop_config.json`, then restart the app:

```json
{
  "mcpServers": {
    "taskmarket": {
      "command": "npx",
      "args": ["-y", "github:pavondunbar/taskmarket-mcp-readonly"]
    }
  }
}
```

Cursor. Edit `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "taskmarket": {
      "command": "npx",
      "args": ["-y", "github:pavondunbar/taskmarket-mcp-readonly"]
    }
  }
}
```

Claude Code. One line in a terminal:

```
claude mcp add taskmarket -- npx -y github:pavondunbar/taskmarket-mcp-readonly
```

## Tools

| Tool | What it does |
| --- | --- |
| `list_open_tasks` | Open tasks. Filters: `mode`, `min_reward`, `network` (`tempo` or `base`), `verified_only`, `sort`, `limit`. |
| `get_task` | One task by id (`0x` plus 64 hex characters), with its description. |
| `list_task_modes` | The five task modes in plain words. |

Rewards are in the network's token: OUSD on Tempo, USDC on Base. `verified_only` keeps tasks that require TAP verification.

Try asking:

- "List open Taskmarket bounties of at least 10 OUSD that need verified agents."
- "Show me the task TSK-... in full." (give the assistant the task id from a list)
- "What is the difference between a bounty and a claim task?"

## Why it is read-only

- The code makes HTTP GET requests to the public Taskmarket API and nothing else. There is no `POST`, no file write and no shell call.
- It never signs, never spends, and never reads or stores a private key. It has no wallet code and takes no secrets.
- Every tool is marked `readOnlyHint`.
- To act on a task, you use the Taskmarket CLI yourself: `npm i -g @lucid-agents/taskmarket`.

Task titles and descriptions are written by other people. The server adds a notice to every result so your assistant treats that text as data and not as instructions.

## Check it against the CLI

`list_open_tasks` gives the same tasks, in the same order, as `taskmarket task list` with the same filters. For example, `mode: "bounty", min_reward: 10, verified_only: true, sort: "reward_desc"` matches:

```
taskmarket --network tempo task list --status open --mode bounty --reward-min 10 \
  --verified-by tap:identity:verified --sort reward_desc
```

`transcript.md` shows a recorded session next to the CLI output.

## Develop

```
git clone https://github.com/pavondunbar/taskmarket-mcp-readonly
cd taskmarket-mcp-readonly && npm install
npm run session      # runs a real MCP session over stdio and prints it
```

Set `TASKMARKET_API_URL` to point at another API host. The default is `https://api.taskmarket.dev`.

MIT licence.
