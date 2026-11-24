// Runs a real MCP session against server.mjs over stdio with the official SDK client,
// then runs the matching `taskmarket` CLI commands and prints both, for transcript.md.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const server = join(dirname(fileURLToPath(import.meta.url)), '..', 'server.mjs');
const client = new Client({ name: 'session-recorder', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [server] }));

const cli = (args) => { try { return execFileSync('taskmarket', args, { encoding: 'utf8' }); } catch (e) { return 'CLI not available: ' + e.message; } };
const ids = (json) => { try { return JSON.parse(json).data.tasks.map((t) => t.referenceCode).join(', '); } catch { return json.slice(0, 200); } };
const show = (title, v) => console.log(`\n### ${title}\n\n\`\`\`\n${v}\n\`\`\``);

const { tools } = await client.listTools();
show('tools/list', tools.map((t) => `${t.name}${t.annotations?.readOnlyHint ? '  (readOnlyHint)' : ''}`).join('\n'));

const call = async (name, args) => (await client.callTool({ name, arguments: args })).content[0].text;
const modes = await call('list_task_modes', {});
show('list_task_modes {}', modes);

const f = { mode: 'bounty', min_reward: 10, verified_only: true, sort: 'reward_desc', limit: 5 };
const list = await call('list_open_tasks', f);
show('list_open_tasks ' + JSON.stringify(f), list);
const mcpIds = JSON.parse(list.slice(list.indexOf('{'))).tasks.map((t) => t.reference).join(', ');
const cliOut = cli(['--network', 'tempo', 'task', 'list', '--status', 'open', '--mode', 'bounty', '--reward-min', '10', '--verified-by', 'tap:identity:verified', '--sort', 'reward_desc', '--limit', '5']);
show('taskmarket --network tempo task list --status open --mode bounty --reward-min 10 --verified-by tap:identity:verified --sort reward_desc --limit 5 (references only)', ids(cliOut));
console.log(`\nMCP references: ${mcpIds}\nCLI references: ${ids(cliOut)}\nMatch: ${mcpIds === ids(cliOut)}`);

const firstId = JSON.parse(list.slice(list.indexOf('{'))).tasks[0]?.id;
if (firstId) {
  const raw = await call('get_task', { task_id: firstId });
  const got = JSON.parse(raw.slice(raw.indexOf('{')));
  const { description, ...rest } = got;
  show('get_task ' + firstId, JSON.stringify({ ...rest, description: description.slice(0, 160) + '...' }, null, 2));
  const c = JSON.parse(cli(['--network', 'tempo', 'task', 'get', firstId])).data;
  const t = c.task || c;
  show('taskmarket --network tempo task get <id> (same fields)', JSON.stringify({ id: t.id, referenceCode: t.referenceCode, mode: t.mode, reward: t.reward, status: t.status, submissionCount: t.submissionCount, expiryTime: t.expiryTime }, null, 2));
}
show('bad input: get_task {"task_id":"nope"}', (await client.callTool({ name: 'get_task', arguments: { task_id: 'nope' } })).content[0].text);
await client.close();
