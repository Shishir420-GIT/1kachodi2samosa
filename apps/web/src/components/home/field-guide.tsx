import { useState } from 'react';
import { ArrowDownRight, Minus, Plus } from 'lucide-react';
import { rules } from '@/data/field-guide';

export function FieldGuide() {
  const [filter, setFilter] = useState('All of it');
  const [expanded, setExpanded] = useState<string | null>('01');
  return <section className="field-guide section-rail" id="guide" aria-labelledby="guide-title">
    <span className="vertical-label">THE BARE MINIMUM / NOT EXTRA CREDIT</span>
    <div className="section-heading"><div><p className="eyebrow">02 / THE DON’T-DO LIST</p><h2 id="guide-title">A field guide to<br/><em>not being the problem.</em></h2></div><p>No cape required.<br/>Just some self-awareness.<ArrowDownRight size={34}/></p></div>
    <div className="filter-row" aria-label="Filter the field guide">{['All of it', 'Everyday', 'Relationships', 'When it matters'].map(category => <button key={category} aria-pressed={filter === category} className={filter === category ? 'filter active' : 'filter'} onClick={() => { setFilter(category); setExpanded(null); }}>{category}</button>)}</div>
    <div className="rules-list">{rules.filter(rule => filter === 'All of it' || rule.category === filter).map(rule => <article className="rule" key={rule.number}>
      <button className="rule-toggle" aria-expanded={expanded === rule.number} aria-controls={`rule-${rule.number}`} onClick={() => setExpanded(expanded === rule.number ? null : rule.number)}><span className="rule-number">{rule.number}</span><span className="rule-heading"><span>{rule.title}</span><em>{rule.aside}</em></span><span className="rule-icon">{expanded === rule.number ? <Minus size={21}/> : <Plus size={21}/>}</span></button>
      {expanded === rule.number && <div id={`rule-${rule.number}`} className="rule-body"><p>{rule.text}</p><span className="rule-tag">{rule.category}</span></div>}
    </article>)}</div>
    <p className="guide-note">A starting point, not an exhaustive list. Respect isn’t a checklist you finish.</p>
  </section>;
}
