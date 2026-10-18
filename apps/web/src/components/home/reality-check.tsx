import { useState } from 'react';
import { ArrowRight, RotateCcw, Check, X } from 'lucide-react';
import { scenarios } from '@/data/field-guide';

export function RealityCheck() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const finished = step === scenarios.length;
  const scenario = scenarios[Math.min(step, scenarios.length - 1)];
  function select(index: number) { if (choice !== null) return; setChoice(index); }
  return <section className="reality-check" id="reality-check" aria-labelledby="check-title">
    <div className="check-intro"><p className="eyebrow">03 / THE REALITY CHECK</p><h2 id="check-title">“I’m one of<br/>the <em>good ones.</em>”</h2><p>Great. Let’s see what that looks like<br/>when nobody’s handing out medals.</p><div className="bust-wrap"><img src="https://images.hostinger.com/efc041a9-6a93-4af7-9835-66a619ec3fac.png" alt="A classical marble bust with blue paper over its mouth—a reminder to listen" loading="lazy"/><span>LESS TALK.<br/>MORE ACCOUNTABILITY.</span></div></div>
    <div className="quiz-panel">
      {!finished ? <><div className="quiz-meta"><span>A QUICK GUT CHECK</span><span>0{step + 1} / 03</span></div><div className="quiz-progress" aria-hidden="true">{scenarios.map((_, i) => <span key={i} className={i <= step ? 'filled' : ''}/>)}</div><h3>{scenario.situation}</h3><p className="quiz-prompt">What do you do?</p><div className="quiz-choices">{scenario.choices.map((text, index) => <button key={text} disabled={choice !== null} className={`quiz-choice ${choice !== null && index === scenario.answer ? 'correct' : ''} ${choice === index && index !== scenario.answer ? 'incorrect' : ''}`} onClick={() => select(index)}><span>{String.fromCharCode(65 + index)}</span>{text}{choice !== null && index === scenario.answer && <Check size={19}/ >}{choice === index && index !== scenario.answer && <X size={19}/>}</button>)}</div>{choice !== null && <div className="quiz-feedback" role="status"><strong>{choice === scenario.answer ? 'That’s what showing up looks like.' : 'Let’s rethink that one.'}</strong><p>{scenario.explanation}</p><button className="text-link" onClick={() => { setStep(step + 1); setChoice(null); }}>{step === scenarios.length - 1 ? 'See your reflection' : 'Next scenario'}<ArrowRight size={18}/></button></div>}</> : <div className="quiz-complete" role="status"><p className="eyebrow">REALITY CHECK COMPLETE</p><h3>Keep practising.</h3><h4>Knowing the answer is a start.</h4><p>This isn’t a certificate of being a good person. What matters is what you do next, especially when it’s inconvenient. Revisit the guide and keep listening.</p><a className="primary-link" href="#practice">Practise saying it <ArrowRight size={18}/></a><button className="text-link" onClick={() => { setStep(0); setChoice(null); }}>Try again <RotateCcw size={18}/></button></div>}
    </div>
  </section>;
}
