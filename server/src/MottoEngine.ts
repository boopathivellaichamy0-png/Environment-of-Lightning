import { MottoState, ChatMessage, ActivityEvent, ProjectFile } from './types.js';

export class MottoEngine {
  private currentMotto: MottoState;
  private onChangeCallback?: (motto: MottoState) => void;

  constructor(initialMotto?: Partial<MottoState>) {
    this.currentMotto = {
      goal: initialMotto?.goal || 'Explore and build full-stack features with AI',
      currentTask: initialMotto?.currentTask || 'Initialize project architecture',
      components: initialMotto?.components || ['Frontend UI', 'App Logic', 'Styles'],
      missingComponents: initialMotto?.missingComponents || [],
      confidence: initialMotto?.confidence || 0.85,
      reasoning: initialMotto?.reasoning || 'Initial project setup detected',
      lastUpdated: Date.now()
    };
  }

  setChangeCallback(cb: (motto: MottoState) => void) {
    this.onChangeCallback = cb;
  }

  getMotto(): MottoState {
    return this.currentMotto;
  }

  analyzeContext(params: {
    files: Record<string, ProjectFile>;
    recentChats: ChatMessage[];
    recentActivities: ActivityEvent[];
  }): MottoState {
    const { files, recentChats, recentActivities } = params;
    const fileKeys = Object.keys(files);

    const hasAuthFiles = fileKeys.some(f => /auth|login|user|session|token/i.test(f));
    const hasDbFiles = fileKeys.some(f => /db|database|mongo|sql|store|model/i.test(f));
    const hasApiFiles = fileKeys.some(f => /api|route|server|controller|service/i.test(f));
    const hasUIFiles = fileKeys.some(f => /login\.jsx|login\.tsx|index\.html|app\.jsx/i.test(f));

    // Inspect last 5 chat messages
    const chatText = recentChats.slice(-5).map(c => c.text.toLowerCase()).join(' ');

    let newGoal = this.currentMotto.goal;
    let newTask = this.currentMotto.currentTask;
    const detectedComponents: string[] = [];
    const missing: string[] = [];
    let reasoning = 'Project files and chat analyzed.';
    let confidence = 0.85;

    // Check for authentication theme (Demo Scenario #6 & #7 match)
    if (chatText.includes('login') || chatText.includes('auth') || chatText.includes('connect') || hasAuthFiles) {
      newGoal = 'Build a complete user authentication system';
      confidence = 0.95;

      if (hasUIFiles || fileKeys.some(f => /login/i.test(f))) {
        detectedComponents.push('Login UI (Login.jsx)');
      } else {
        missing.push('Login UI Form');
      }

      if (hasDbFiles || fileKeys.some(f => /usermodel|db/i.test(f))) {
        detectedComponents.push('User Data Model (UserModel.js)');
      } else {
        missing.push('User Database Schema');
      }

      if (hasApiFiles || fileKeys.some(f => /authcontroller|server\.js/i.test(f))) {
        detectedComponents.push('Authentication API Controller');
      } else {
        missing.push('API connection / Auth Controller');
      }

      if (chatText.includes('connect') || missing.includes('API connection / Auth Controller')) {
        newTask = 'Connect login page UI to database through authentication API';
        reasoning = 'Team discussed connecting login UI to database; missing API route handler identified.';
      } else {
        newTask = 'Implement JWT session verification & secure endpoints';
        reasoning = 'Core authentication files present, verifying token handling.';
      }
    } else if (chatText.includes('cart') || chatText.includes('checkout') || fileKeys.some(f => /cart|store|shop/i.test(f))) {
      newGoal = 'Build e-commerce checkout and payment flow';
      newTask = 'Integrate order validation and cart state management';
      detectedComponents.push('Cart Store', 'Product Catalog');
      missing.push('Payment Gateway API');
      reasoning = 'Shopping cart context detected from team dialogue.';
    } else if (fileKeys.length > 0) {
      detectedComponents.push(...fileKeys.map(f => `Module: ${f}`));
      newGoal = `Develop ${fileKeys[0].split('.')[0]} application`;
      newTask = 'Refine component functionality and data flow';
      reasoning = `Synthesized from ${fileKeys.length} active files in the workspace.`;
    }

    const updated: MottoState = {
      goal: newGoal,
      currentTask: newTask,
      components: detectedComponents.length > 0 ? detectedComponents : ['Workspace Core'],
      missingComponents: missing,
      confidence,
      reasoning,
      lastUpdated: Date.now()
    };

    this.currentMotto = updated;
    if (this.onChangeCallback) {
      this.onChangeCallback(updated);
    }
    return updated;
  }

  setManualMotto(motto: Partial<MottoState>): MottoState {
    this.currentMotto = {
      ...this.currentMotto,
      ...motto,
      lastUpdated: Date.now()
    };
    if (this.onChangeCallback) {
      this.onChangeCallback(this.currentMotto);
    }
    return this.currentMotto;
  }
}
