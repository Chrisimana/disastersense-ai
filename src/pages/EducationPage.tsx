import { useState } from 'react';
import { educationData, type EducationEntry } from '../data/educationData';

function Section({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e3a5f', margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span>{icon}</span> {title}
      </h3>
      <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
        cursor: 'pointer',
        padding: '0.4rem 0',
        borderBottom: '1px solid #f1f5f9',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => setChecked(!checked)}
        style={{ marginTop: '0.15rem', accentColor: '#1d4ed8', flexShrink: 0 }}
      />
      <span
        style={{
          fontSize: '0.875rem',
          color: checked ? '#94a3b8' : '#374151',
          textDecoration: checked ? 'line-through' : 'none',
          lineHeight: 1.5,
          transition: 'color 0.15s, text-decoration 0.15s',
        }}
      >
        {label}
      </span>
    </label>
  );
}

function DisasterCard({ entry }: { entry: EducationEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist'>('info');

  const tabs = [
    { id: 'info' as const, label: 'Panduan' },
    { id: 'checklist' as const, label: `Checklist (${entry.checklist.length})` },
  ];

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: '1rem',
          transition: 'background 0.15s',
        }}
        aria-expanded={expanded}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1e3a5f' }}>
            {entry.title}
          </h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
            {entry.description.slice(0, 100)}…
          </p>
        </div>
        <span
          style={{
            fontSize: '1.1rem',
            color: '#94a3b8',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        >
          ▼
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f1f5f9' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.6rem 1.25rem',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? '#1d4ed8' : '#64748b',
                  borderBottom: activeTab === tab.id ? '2px solid #1d4ed8' : '2px solid transparent',
                  transition: 'color 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ padding: '1.25rem 1.5rem' }}>
            {activeTab === 'info' ? (
              <>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                  {entry.description}
                </p>
                <Section title="Tanda-Tanda Peringatan" items={entry.warningSigns} icon="⚠️" />
                <Section title="Langkah Sebelum Bencana" items={entry.beforeSteps} icon="📋" />
                <Section title="Langkah Saat Bencana" items={entry.duringSteps} icon="🚨" />
                <Section title="Langkah Setelah Bencana" items={entry.afterSteps} icon="✅" />
              </>
            ) : (
              <div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                  Centang item yang sudah Anda siapkan:
                </p>
                {entry.checklist.map((item, i) => (
                  <ChecklistItem key={i} label={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export default function EducationPage() {
  return (
    <main style={{ padding: '1.5rem', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f', margin: 0 }}>
          Edukasi Bencana
        </h1>
        <p style={{ margin: '0.35rem 0 0', color: '#475569', fontSize: '0.9rem' }}>
          Panduan kesiapsiagaan untuk berbagai jenis bencana alam
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {educationData.map((entry) => (
          <DisasterCard key={entry.id} entry={entry} />
        ))}
      </div>
    </main>
  );
}
