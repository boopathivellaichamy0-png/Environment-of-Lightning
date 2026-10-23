import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  FileCode,
  Terminal,
  Cpu
} from 'lucide-react';
import { AIOperation, AIToolCall } from '../types.ts';

interface AIAgentPaneProps {
  currentOperation: AIOperation | null;
  activeToolCalls: AIToolCall[];
  onPrompt: (prompt: string, model: string) => void;
  onApply: (opId: string) => void;
  onReject: (opId: string) => void;
}

export const AIAgentPane: FC<AIAgentPaneProps> = ({
  currentOperation,
  activeToolCalls,
  onPrompt,
  onApply,
  onReject
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickPrompts = [
    'Add live weather widget to index.html',
    'Scaffold utils.js with calculateMetrics()',
    'Enhance UI card with modern glassmorphism'
  ];

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isSubmitting) return;

    setIsSubmitting(true);
    onPrompt(prompt.trim(), selectedModel);
    setPrompt('');
    setTimeout(() => setIsSubmitting(false), 800);
  };

  return (
    <div
      style={{
        width: '380px',
        height: '100%',
        backgroundColor: '#181818',
        borderLeft: '1px solid #2b2b2b',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      {/* 1. Header */}
      <div
        style={{
          height: '35px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2b2b2b',
          backgroundColor: '#181818'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} color="#38bdf8" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>ANTIGRAVITY AI AGENT</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#252526',
              color: '#34d399',
              border: '1px solid #333333'
            }}
          >
            Autonomous
          </span>
        </div>
      </div>

      {/* 2. Scrollable Agent Stream */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Welcome Banner */}
        {!currentOperation && activeToolCalls.length === 0 && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#1e1e1e',
              border: '1px solid #282828',
              borderRadius: '8px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto'
              }}
            >
              <Sparkles size={18} color="#38bdf8" />
            </div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#ffffff' }}>Pair-program with Antigravity</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#858585', lineHeight: '1.4' }}>
              Directly inspects your workspace, drafts unified diffs, and runs commands.
            </p>
          </div>
        )}

        {/* Active Tool Calls Stream */}
        {activeToolCalls.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#858585', textTransform: 'uppercase' }}>
              Tool Execution Steps
            </span>
            {activeToolCalls.map((tc) => (
              <div
                key={tc.id}
                style={{
                  padding: '8px 10px',
                  backgroundColor: '#202020',
                  border: '1px solid #2b2b2b',
                  borderRadius: '6px',
                  fontSize: '11px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tc.tool === 'run_command' ? (
                      <Terminal size={12} color="#38bdf8" />
                    ) : (
                      <FileCode size={12} color="#34d399" />
                    )}
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{tc.tool}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#34d399' }}>✓ success</span>
                </div>
                {tc.result && <div style={{ color: '#94a3b8', fontSize: '10px' }}>{tc.result}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Pending Operation & Unified Diffs */}
        {currentOperation && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#1e1e1e',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                Proposed Changes
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                {currentOperation.explanation}
              </p>
            </div>

            {/* Diffs Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentOperation.patches.map((p) => (
                <div
                  key={p.filePath}
                  style={{
                    backgroundColor: '#181818',
                    border: '1px solid #282828',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#222222',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FileCode size={12} />
                    <span>{p.filePath}</span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '6px 8px',
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      maxHeight: '140px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      color: '#cbd5e1',
                      lineHeight: '1.4'
                    }}
                  >
                    {p.diff || 'Modified content'}
                  </pre>
                </div>
              ))}
            </div>

            {/* Approve / Reject Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={() => onApply(currentOperation.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  backgroundColor: '#0284c7',
                  border: 'none',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Check size={13} />
                <span>Apply Patches</span>
              </button>
              <button
                onClick={() => onReject(currentOperation.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  backgroundColor: '#252526',
                  border: '1px solid #333333',
                  color: '#f43f5e',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <X size={13} />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#858585', textTransform: 'uppercase' }}>
            Quick Prompts
          </span>
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              onClick={() => {
                setPrompt(qp);
              }}
              style={{
                textAlign: 'left',
                backgroundColor: '#202020',
                border: '1px solid #2b2b2b',
                color: '#cccccc',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                lineHeight: '1.3'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2b2b2b')}
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Prompt Input Footer */}
      <form
        onSubmit={handleSubmit}
        style={{
          padding: '10px',
          backgroundColor: '#181818',
          borderTop: '1px solid #2b2b2b',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: '#202020',
            border: '1px solid #333333',
            borderRadius: '6px',
            padding: '6px 8px',
            alignItems: 'center'
          }}
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask Antigravity to build or edit code..."
            rows={2}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              outline: 'none',
              resize: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isSubmitting}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: prompt.trim() ? '#0284c7' : '#282828',
              border: 'none',
              color: '#ffffff',
              cursor: prompt.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#858585' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={12} />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cccccc',
                fontSize: '11px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Gemini 2.5 Flash" style={{ background: '#1e1e1e' }}>Gemini 2.5 Flash</option>
              <option value="Gemini 2.5 Pro" style={{ background: '#1e1e1e' }}>Gemini 2.5 Pro</option>
              <option value="Antigravity Autonomous" style={{ background: '#1e1e1e' }}>Antigravity Autonomous</option>
            </select>
          </div>
          <span>Shift+Enter for new line</span>
        </div>
      </form>
    </div>
  );
};
