import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const tempRoot = join(packageRoot, '.test-tmp');
const cli = join(packageRoot, 'bin/cli.mjs');

/** 为每项测试创建独立项目，结束时仅清理本次创建的目录。 */
function fixture(t) {
  mkdirSync(tempRoot, { recursive: true });
  const directory = mkdtempSync(join(tempRoot, 'project-'));
  t.after(() => {
    assert.equal(dirname(resolve(directory)), resolve(tempRoot));
    rmSync(directory, { recursive: true, force: true });
  });
  return directory;
}

/** 在指定项目执行真实 CLI，返回退出码及输出。 */
function run(directory, ...args) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: directory, encoding: 'utf8' });
}

/** 递归比较安装后的文件内容，确保引用资料随 skill 完整复制。 */
function compareTree(source, target) {
  assert.deepEqual(readdirSync(target).sort(), readdirSync(source).sort());
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if (entry.isDirectory()) compareTree(join(source, entry.name), join(target, entry.name));
    else assert.deepEqual(readFileSync(join(target, entry.name)), readFileSync(join(source, entry.name)));
  }
}

test('默认安装到当前项目，完整复制 skill，保留原有项目文件', t => {
  const directory = fixture(t);
  writeFileSync(join(directory, 'AGENTS.md'), '用户已有规则');
  const result = run(directory);
  assert.equal(result.status, 0, result.stderr);
  compareTree(join(packageRoot, 'skills/review-thesis-writing'), join(directory, '.agents/skills/review-thesis-writing'));
  assert.equal(readFileSync(join(directory, 'AGENTS.md'), 'utf8'), '用户已有规则');
});

test('显式目标支持中文和空格，不写入调用目录', t => {
  const directory = fixture(t);
  const target = join(directory, '中文 项目');
  mkdirSync(target);
  const result = run(directory, '--target', target);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readdirSync(directory), ['中文 项目']);
  compareTree(join(packageRoot, 'skills/review-thesis-writing'), join(target, '.agents/skills/review-thesis-writing'));
});

test('已有 skill 拒绝覆盖，保留用户修改', t => {
  const directory = fixture(t);
  assert.equal(run(directory).status, 0);
  const skill = join(directory, '.agents/skills/review-thesis-writing/SKILL.md');
  writeFileSync(skill, '用户已定制的 skill');
  const result = run(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /已存在/);
  assert.equal(readFileSync(skill, 'utf8'), '用户已定制的 skill');
});

test('帮助与非法参数均不创建目录', t => {
  const directory = fixture(t);
  assert.equal(run(directory, '--help').status, 0);
  for (const args of [['--unknown'], ['--target'], ['--target', '--help'], ['--target', directory, '--target', directory]]) {
    assert.equal(run(directory, ...args).status, 1, JSON.stringify(args));
  }
  assert.deepEqual(readdirSync(directory), []);
});

test('目标项目不存在时失败，不擅自创建项目', t => {
  const directory = fixture(t);
  assert.equal(run(directory, '--target', join(directory, 'missing')).status, 1);
  assert.deepEqual(readdirSync(directory), []);
});

test('拒绝经过符号链接或 Windows junction 写到其他位置', t => {
  for (const level of ['.agents', 'skills']) {
    const directory = fixture(t);
    const outside = join(directory, 'outside');
    mkdirSync(outside);
    if (level === 'skills') mkdirSync(join(directory, '.agents'));
    const link = level === '.agents' ? join(directory, '.agents') : join(directory, '.agents/skills');
    symlinkSync(outside, link, process.platform === 'win32' ? 'junction' : 'dir');
    const result = run(directory);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /链接/);
    assert.deepEqual(readdirSync(outside), []);
  }
});

test('目录位置被普通文件占用时保留文件并失败', t => {
  const directory = fixture(t);
  writeFileSync(join(directory, '.agents'), '保留');
  assert.equal(run(directory).status, 1);
  assert.equal(readFileSync(join(directory, '.agents'), 'utf8'), '保留');
});
