#!/usr/bin/env node
import { cpSync, lstatSync, mkdirSync, realpathSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const skillName = 'review-thesis-writing';
const source = fileURLToPath(new URL('../skills/review-thesis-writing/', import.meta.url));

/** 解析可选的项目路径；未知或重复参数直接报错，避免误装到当前目录。 */
function parseArgs(args) {
  if (args.length === 0) return process.cwd();
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) return null;
  if (args.length === 2 && args[0] === '--target' && args[1] && !args[1].startsWith('-')) {
    return resolve(args[1]);
  }
  throw new Error('参数无效。用法：review-thesis-writing [--target <已有项目目录>]，或 --help。');
}

/** 创建单层真实目录，拒绝文件、符号链接与 Windows junction。 */
function ensureDirectory(directory) {
  try {
    mkdirSync(directory);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  const status = lstatSync(directory);
  if (status.isSymbolicLink()) throw new Error(`拒绝写入链接目录：${directory}`);
  if (!status.isDirectory()) throw new Error(`目标位置不是目录：${directory}`);
}

/** 将随包 skill 安装到已有项目，仅在独占创建的目标内复制文件。 */
function install(project) {
  const root = realpathSync(project);
  if (!statSync(root).isDirectory()) throw new Error(`项目路径不是目录：${project}`);
  if (!statSync(join(source, 'SKILL.md')).isFile()) throw new Error('安装包缺少 SKILL.md。');
  const agents = join(root, '.agents');
  const skills = join(agents, 'skills');
  ensureDirectory(agents);
  ensureDirectory(skills);
  const destination = join(skills, skillName);
  try {
    mkdirSync(destination);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`skill 已存在，未覆盖：${destination}`);
    throw error;
  }
  try {
    cpSync(source, destination, { recursive: true, force: false, errorOnExist: true });
  } catch (error) {
    // 目标由本次调用独占创建；复制失败时仅移除本次不完整的安装。
    rmSync(destination, { recursive: true, force: true });
    throw error;
  }
  console.log(`已安装：${destination}\n调用方式：$${skillName}`);
}

try {
  const project = parseArgs(process.argv.slice(2));
  if (project === null) {
    console.log('用法：review-thesis-writing [--target <已有项目目录>]\n默认安装到当前项目的 .agents/skills/review-thesis-writing。\n已有 skill 会保留并报错；不会自动修改 AGENTS.md。');
  } else {
    install(project);
  }
} catch (error) {
  console.error(`安装失败：${error.message}`);
  process.exitCode = 1;
}
