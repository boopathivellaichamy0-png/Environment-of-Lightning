import { useState, useEffect } from 'react';
import type { FC } from 'react';
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  X,
  Users,
  FileCode,
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunStep: (step: number) => Promise<{ success: boolean; title: string; message: string }>;
}

export const DemoModal: FC<DemoModalProps> = ({
  isOpen,
  onClose,
  onRunStep
}) => {
  if (!isOpen) return null;

  const [currentStep, setCurrentStep] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [stepLogs, setStepLogs] = useState<Record<number, string>>({});

  const demoSteps = [
    {
      num: 1,
      title: 'Initialize Room DEV-AI-7824',
      desc: 'Creates shared collaborative development room DEV-AI-7824 with isolated workspace.',
      icon: <Zap size={16} color="var(--lightning-cyan)" />
    },
    {
      num: 2,
      title: 'User B (Priya) Joins',
      desc: 'Priya joins room DEV-AI-7824 with presence avatar and live cursor tracking.',
      icon: <Users size={16} color="#ec4899" />
    },
    {
      num: 3,
      title: 'User A Creates Login.jsx',
      desc: 'Divya creates Login.jsx. Instantly synchronized across all peer editors via CRDT.',
      icon: <FileCode size={16} color="var(--lightning-cyan)" />
    },
    {
      num: 4,
      title: 'User B Creates UserModel.js',
      desc: 'Priya creates database model UserModel.js. Visible across the team without page refresh.',
      icon: <FileCode size={16} color="#ec4899" />
    },
    {
      num: 5,
      title: 'Simultaneous Concurrent Editing',
      desc: 'Both users type simultaneously in their files. Yjs CRDT resolves changes conflict-free.',
      icon: <ShieldCheck size={16} color="var(--accent-emerald)" />
    },
    {
      num: 6,
      title: 'Chat: "Connect login to database"',
      desc: 'Divya sends team message to discuss connecting login UI to backend database model.',
      icon: <MessageSquare size={16} color="#38bdf8" />
    },
    {
      num: 7,
      title: 'AI Motto Engine Synthesis',
      desc: 'AI synthesizes chat and files to update Motto: "Build a complete user authentication system".',
      icon: <Sparkles size={16} color="var(--ai-purple)" />
    },
    {
      num: 8,
      title: 'AI Observes Missing Bridge',
      desc: 'AI detects UI + Model components and flags missing Auth Controller connection.',
      icon: <Sparkles size={16} color="var(--accent-amber)" />
    },
    {
      num: 9,
      title: 'Antigravity CLI Analysis',
      desc: 'Antigravity reads latest workspace at current version and drafts non-destructive patch.',
      icon: <Zap size={16} color="var(--lightning-cyan)" />
    },
    {
      num: 10,
      title: 'Validate Version & Apply via CRDT',
      desc: 'Validates base version, verifies no cursor conflicts, and applies changes via CRDT!',
      icon: <CheckCircle2 size={16} color="var(--accent-emerald)" />
    }
  ];

  const executeStep = async (stepNum: number) => {
    setIsRunning(true);
    try {
      const res = await onRunStep(stepNum);
      setStepLogs(prev => ({ ...prev, [stepNum]: res.message }));
      if (stepNum === 10) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (e: any) {
      setStepLogs(prev => ({ ...prev, [stepNum]: `Error: ${e.message}` }));
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-play mechanism
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isAutoPlaying && currentStep <= 10 && !isRunning) {
      timer = setTimeout(async () => {
        await executeStep(currentStep);
        if (currentStep < 10) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsAutoPlaying(false);
        }
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep, isRunning]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(4, 7, 15, 0.78)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel-elevated" style={{
        width: '680px',
        maxHeight: '90vh',
        borderRadius: '16px',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 240, 255, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(0,240,255,0.08) 0%, rgba(168,85,247,0.08) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Zap size={22} color="var(--lightning-cyan)" className="animate-lightning" />
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#fff'
              }}>
                ⚡ Interactive Demo Flow (Section 33)
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                10-Step AI-Orchestrated Real-Time Collaboration Walkthrough
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Steps List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {demoSteps.map((step) => {
            const isCompleted = stepLogs[step.num] !== undefined;
            const isCurrent = currentStep === step.num;

            return (
              <div
                key={step.num}
                onClick={() => {
                  setCurrentStep(step.num);
                  executeStep(step.num);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: isCurrent
                    ? '1px solid var(--lightning-cyan)'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-subtle)',
                  background: isCurrent
                    ? 'rgba(0, 240, 255, 0.08)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.04)'
                    : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Step Icon / Number */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted ? 'var(--accent-emerald)' : '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  {isCompleted ? <CheckCircle2 size={16} /> : step.num}
                </div>

                {/* Details */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '2px'
                  }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: isCurrent ? 'var(--lightning-cyan)' : '#f8fafc'
                    }}>
                      {step.title}
                    </span>
                    {isCurrent && (
                      <span className="badge badge-cyan" style={{ fontSize: '9px' }}>
                        ACTIVE STEP
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                    {step.desc}
                  </p>

                  {/* Execution Result Log */}
                  {stepLogs[step.num] && (
                    <div style={{
                      marginTop: '0.4rem',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '4px',
                      background: 'rgba(0,0,0,0.4)',
                      borderLeft: '2px solid var(--accent-emerald)',
                      fontSize: '0.72rem',
                      color: '#a7f3d0',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      ✓ {stepLogs[step.num]}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.3)'
        }}>
          <button
            onClick={() => {
              setStepLogs({});
              setCurrentStep(1);
              setIsAutoPlaying(false);
            }}
            className="btn-secondary"
            style={{ fontSize: '0.75rem' }}
          >
            <RotateCcw size={13} /> Reset
          </button>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={isAutoPlaying ? "btn-secondary" : "btn-ai"}
              style={{ fontSize: '0.75rem' }}
            >
              {isAutoPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isAutoPlaying ? 'Pause Auto-play' : 'Auto-Play All 10 Steps'}</span>
            </button>

            <button
              onClick={async () => {
                await executeStep(currentStep);
                if (currentStep < 10) setCurrentStep(prev => prev + 1);
              }}
              disabled={isRunning}
              className="btn-primary"
              style={{ fontSize: '0.75rem' }}
            >
              <span>{currentStep === 10 ? 'Finish Tour' : `Run Step ${currentStep}`}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
