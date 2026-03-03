'use client';

import { useState } from 'react';
import { useJournal, useCreateJournal, useUpdateJournal, useDeleteJournal } from '@/lib/hooks';
import type { JournalEntry } from '@/lib/schemas';

const moods = ['😃', '😐', '😞', '😡', '🤔'];

interface Props {
  accountId: string;
  className?: string;
}

export function JournalPanel({ accountId, className = '' }: Props) {
  const { data: entries = [], isLoading } = useJournal(accountId);
  const createEntry = useCreateJournal();
  const updateEntry = useUpdateJournal();
  const deleteEntry = useDeleteJournal();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [symbol, setSymbol] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSymbol('');
    setMood('');
    setTags('');
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (e: JournalEntry) => {
    setEditing(e);
    setTitle(e.title ?? '');
    setContent(e.content ?? '');
    setSymbol(e.symbol ?? '');
    setMood(e.mood ?? '');
    setTags(e.tags?.join(', ') ?? '');
    setShowForm(true);
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const data = {
      title: title || undefined,
      content: content || undefined,
      symbol: symbol || undefined,
      mood: mood || undefined,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
    };

    if (editing) {
      updateEntry.mutate({ id: editing.id, data }, { onSuccess: resetForm });
    } else {
      createEntry.mutate({ accountId, ...data }, { onSuccess: resetForm });
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          Journal <span className="text-gray-500">({entries.length})</span>
        </h3>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800/60 rounded-lg p-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened? What did you learn?"
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Symbol (e.g. EURUSD)"
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Mood:</span>
            {moods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                className={`text-lg transition-opacity ${mood === m ? 'opacity-100' : 'opacity-30 hover:opacity-60'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={resetForm} className="text-xs text-gray-400 hover:text-white px-3 py-1.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEntry.isPending || updateEntry.isPending}
              className="text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded disabled:opacity-50"
            >
              {editing ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading && <div className="text-center text-gray-500 text-sm py-4">Loading…</div>}
        {!isLoading && entries.length === 0 && !showForm && (
          <div className="text-center text-gray-500 text-sm py-4">No journal entries yet. Start documenting your trades!</div>
        )}
        {entries.map((e) => (
          <div key={e.id} className="bg-gray-800/40 border border-gray-800 rounded-lg p-3 space-y-1.5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {e.mood && <span className="text-sm">{e.mood}</span>}
                <span className="text-sm font-medium text-white">{e.title || 'Untitled'}</span>
                {e.symbol && <span className="text-[10px] font-mono text-brand-400 bg-brand-900/30 px-1.5 py-0.5 rounded">{e.symbol}</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(e)} className="text-gray-500 hover:text-white text-xs px-1">✏</button>
                <button
                  onClick={() => deleteEntry.mutate(e.id)}
                  className="text-gray-500 hover:text-red-400 text-xs px-1"
                >
                  🗑
                </button>
              </div>
            </div>
            {e.content && <p className="text-xs text-gray-400 whitespace-pre-wrap">{e.content}</p>}
            <div className="flex items-center gap-2 flex-wrap">
              {e.tags?.map((t, i) => (
                <span key={i} className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">{t}</span>
              ))}
              {e.createdAt && (
                <span className="text-[10px] text-gray-600 ml-auto tabular-nums">
                  {new Date(e.createdAt).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
