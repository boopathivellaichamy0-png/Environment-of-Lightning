import { spawn } from 'child_process';
import { TerminalLog } from './types.js';

export class TerminalManager {
  private currentCwd: string;

  constructor(workspaceDir: string) {
    this.currentCwd = workspaceDir;
  }

  public getCwd(): string {
    return this.currentCwd;
  }

  public setCwd(newCwd: string): void {
    this.currentCwd = newCwd;
  }

  public executeCommand(
    command: string,
    onLog: (log: TerminalLog) => void
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const isWindows = process.platform === 'win32';
      const trimmed = command.trim();

      // Handle 'cd' commands locally to update cwd
      if (trimmed.startsWith('cd ') || trimmed === 'cd') {
        const target = trimmed.replace(/^cd\s*/, '').trim();
        if (!target) {
          onLog({
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            type: 'stdout',
            text: `${this.currentCwd}\n`
          });
          resolve({ exitCode: 0, stdout: this.currentCwd, stderr: '' });
          return;
        }
      }

      onLog({
        id: `in-${Date.now()}`,
        timestamp: Date.now(),
        type: 'input',
        text: `PS ${this.currentCwd}> ${command}\n`
      });

      let stdoutAcc = '';
      let stderrAcc = '';

      const shellProcess = isWindows
        ? spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command], {
            cwd: this.currentCwd,
            env: process.env
          })
        : spawn('/bin/bash', ['-c', command], {
            cwd: this.currentCwd,
            env: process.env
          });

      shellProcess.stdout?.on('data', (data) => {
        const text = data.toString('utf-8');
        stdoutAcc += text;
        onLog({
          id: `out-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type: 'stdout',
          text
        });
      });

      shellProcess.stderr?.on('data', (data) => {
        const text = data.toString('utf-8');
        stderrAcc += text;
        onLog({
          id: `err-${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
          type: 'stderr',
          text
        });
      });

      shellProcess.on('close', (code) => {
        const exitCode = code ?? 0;
        resolve({
          exitCode,
          stdout: stdoutAcc,
          stderr: stderrAcc
        });
      });

      shellProcess.on('error', (err) => {
        const text = `Failed to start process: ${err.message}\n`;
        stderrAcc += text;
        onLog({
          id: `err-${Date.now()}`,
          timestamp: Date.now(),
          type: 'stderr',
          text
        });
        resolve({
          exitCode: 1,
          stdout: stdoutAcc,
          stderr: stderrAcc
        });
      });
    });
  }
}
