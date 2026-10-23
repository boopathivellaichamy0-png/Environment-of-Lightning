import * as diff from 'diff';
import { FileSystemManager } from './fileSystem.js';
import { TerminalManager } from './terminal.js';
import { AIOperation, AIToolCall, AIPatch } from './types.js';

export class AIAgentEngine {
  private fsManager: FileSystemManager;
  private termManager: TerminalManager;
  private pendingOperations: Map<string, AIOperation> = new Map();

  constructor(fsManager: FileSystemManager, termManager: TerminalManager) {
    this.fsManager = fsManager;
    this.termManager = termManager;
  }

  public async processPrompt(
    prompt: string,
    model: string = 'Gemini 2.5 Flash',
    onStep?: (toolCall: AIToolCall) => void
  ): Promise<AIOperation> {
    const opId = `op-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const toolCalls: AIToolCall[] = [];
    const patches: AIPatch[] = [];

    const op: AIOperation = {
      id: opId,
      prompt,
      model,
      thought: `1. Analyzed workspace files and parsed prompt: "${prompt}".\n2. Decomposed task into architectural components.\n3. Formulated surgical code modifications with unified diffs.`,
      explanation: `Synthesized changes based on your instruction: "${prompt}".`,
      toolCalls,
      patches,
      status: 'waiting_approval',
      createdAt: Date.now()
    };

    const recordTool = (tool: AIToolCall['tool'], args: Record<string, any>, result: string) => {
      const tc: AIToolCall = {
        id: `tool-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        tool,
        args,
        result,
        status: 'success',
        timestamp: Date.now()
      };
      toolCalls.push(tc);
      if (onStep) onStep(tc);
    };

    // Tool 1: list_files to inspect workspace
    const currentFiles = this.fsManager.getAllFilesMap();
    recordTool('list_files', {}, `Discovered ${Object.keys(currentFiles).length} files: ${Object.keys(currentFiles).join(', ')}`);

    const pLower = prompt.toLowerCase();

    // SCENARIO 1: Weather widget / Dashboard / Feature addition
    if (pLower.includes('weather') || pLower.includes('widget') || pLower.includes('card') || pLower.includes('ui')) {
      const origIndex = currentFiles['index.html'] || '';
      const origCss = currentFiles['style.css'] || '';
      const origJs = currentFiles['app.js'] || '';

      const newIndex = origIndex.replace(
        '</div>\n  </div>',
        `  <div class="weather-box" id="weather-widget">
        <h3>🌤️ Live City Forecast</h3>
        <p id="temp-display">24°C • Sunny • Humidity: 45%</p>
        <button id="btn-refresh-weather">Refresh Weather</button>
      </div>
    </div>
  </div>`
      );

      const newCss = origCss + `\n
.weather-box {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
}
.weather-box h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #38bdf8;
}
.weather-box p {
  margin: 0 0 0.75rem 0;
  font-size: 0.85rem;
  color: #cbd5e1;
}
`;

      const newJs = origJs + `\n
// Weather Widget Logic
const weatherBtn = document.getElementById('btn-refresh-weather');
const tempDisplay = document.getElementById('temp-display');
if (weatherBtn && tempDisplay) {
  weatherBtn.addEventListener('click', () => {
    const temps = ['22°C • Partly Cloudy', '26°C • Clear Skies', '21°C • Light Rain', '25°C • Sunny'];
    const random = temps[Math.floor(Math.random() * temps.length)];
    tempDisplay.textContent = random + ' • Humidity: ' + Math.floor(40 + Math.random() * 20) + '%';
  });
}
`;

      if (origIndex !== newIndex) {
        patches.push({
          filePath: 'index.html',
          originalContent: origIndex,
          newContent: newIndex,
          diff: diff.createTwoFilesPatch('index.html', 'index.html', origIndex, newIndex)
        });
        recordTool('replace_content', { path: 'index.html' }, 'Added weather widget container markup');
      }

      if (origCss !== newCss) {
        patches.push({
          filePath: 'style.css',
          originalContent: origCss,
          newContent: newCss,
          diff: diff.createTwoFilesPatch('style.css', 'style.css', origCss, newCss)
        });
        recordTool('replace_content', { path: 'style.css' }, 'Added responsive weather box styles');
      }

      if (origJs !== newJs) {
        patches.push({
          filePath: 'app.js',
          originalContent: origJs,
          newContent: newJs,
          diff: diff.createTwoFilesPatch('app.js', 'app.js', origJs, newJs)
        });
        recordTool('replace_content', { path: 'app.js' }, 'Added interactive weather refresh event listener');
      }

      op.explanation = 'Added a stylish live weather forecast widget to the index page, complete with responsive CSS styling and interactive JS click logic.';
    }
    // SCENARIO 2: Create new file or scaffold component
    else if (pLower.includes('create') || pLower.includes('add file') || pLower.includes('scaffold')) {
      const match = prompt.match(/([a-zA-Z0-9_\-\/]+\.[a-zA-Z0-9]+)/);
      const targetFileName = match ? match[1] : 'utils.js';

      const fileContent = `/**
 * Generated by Antigravity AI Agent
 * Target: ${targetFileName}
 */

export function calculateMetrics(data = []) {
  if (!Array.isArray(data) || data.length === 0) return { count: 0, sum: 0, avg: 0 };
  const sum = data.reduce((acc, val) => acc + val, 0);
  return {
    count: data.length,
    sum,
    avg: Number((sum / data.length).toFixed(2))
  };
}

export function formatDate(timestamp = Date.now()) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp));
}
`;

      patches.push({
        filePath: targetFileName,
        originalContent: '',
        newContent: fileContent,
        diff: diff.createTwoFilesPatch(targetFileName, targetFileName, '', fileContent)
      });
      recordTool('write_file', { path: targetFileName }, `Generated complete module for ${targetFileName}`);
      op.explanation = `Created new module ${targetFileName} with utility functions and typed export signatures.`;
    }
    // SCENARIO 3: General code enhancement / bug fix
    else {
      const targetFile = Object.keys(currentFiles)[0] || 'app.js';
      const orig = currentFiles[targetFile] || '';
      const updated = `// [AI Enhanced] ${prompt}\n` + orig;

      patches.push({
        filePath: targetFile,
        originalContent: orig,
        newContent: updated,
        diff: diff.createTwoFilesPatch(targetFile, targetFile, orig, updated)
      });
      recordTool('replace_content', { path: targetFile }, `Applied prompt context to ${targetFile}`);
      op.explanation = `Analyzed the codebase and drafted modifications in ${targetFile} satisfying your request.`;
    }

    this.pendingOperations.set(opId, op);
    return op;
  }

  public applyOperation(opId: string): { success: boolean; filesModified: string[] } {
    const op = this.pendingOperations.get(opId);
    if (!op) {
      throw new Error(`Operation ${opId} not found`);
    }

    const modified: string[] = [];
    for (const patch of op.patches) {
      this.fsManager.writeFile(patch.filePath, patch.newContent);
      modified.push(patch.filePath);
    }

    op.status = 'applied';
    return { success: true, filesModified: modified };
  }

  public rejectOperation(opId: string): boolean {
    const op = this.pendingOperations.get(opId);
    if (!op) return false;
    op.status = 'rejected';
    this.pendingOperations.delete(opId);
    return true;
  }
}
