import { useState, useEffect, useMemo } from 'react'; 
import { Plus, Search, BookOpen, Tag, Trash2, Calendar, Sparkles, X, Sun, Moon } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary: string;
  created_at: number;
  last_viewed_at: number;
}

const processNoteWithDeepSeek = async (content: string) => {
  try {
    const response = await fetch('https://light-kb-6skg.vercel.app/api/process-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('AI 服务请求失败');
    return await response.json();
  } catch (error) {
    return { summary: content.substring(0, 40) + "...", tags: ['未分类'] };
  }
};

export default function LightKB() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dark-mode');
      return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('dark-mode', JSON.stringify(isDark));
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem('lightkb_notes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('lightkb_notes', JSON.stringify(notes));
  }, [notes]);

  const handleSaveNote = async () => {
    if (!title || !content) return;
    setIsAiProcessing(true);
    const aiResult = await processNoteWithDeepSeek(content);
    const newNote: Note = {
      id: Date.now().toString(),
      title,
      content,
      tags: aiResult.tags,
      summary: aiResult.summary,
      created_at: Date.now(),
      last_viewed_at: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setTitle('');
    setContent('');
    setIsEditing(false);
    setIsAiProcessing(false);
  };

  const deleteNote = (id: string) => setNotes(notes.filter(n => n.id !== id));

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  const dailyReviewNotes = useMemo(() => {
    return [...notes].sort((a, b) => a.last_viewed_at - b.last_viewed_at).slice(0, 3);
  }, [notes]);

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><BookOpen size={20} /></div>
            <h1 className="font-bold text-xl tracking-tight">LightKB</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => setIsEditing(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2">
              <Plus size={18} /> <span>记录新知识</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <section className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
  <h3 className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400 font-bold">
    <Sparkles size={18} />
    今日知识回顾
  </h3>
  <div className="space-y-3">
    {dailyReviewNotes.length > 0 ? dailyReviewNotes.map(note => (
      /* --- 关键：确保以下所有内容都在这个括号 ( ) 里面 --- */
      <div key={note.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border dark:border-slate-700 text-sm">
        <p className="font-semibold dark:text-slate-100">{note.title}</p>
        <p className="text-slate-500 text-xs line-clamp-2 mb-2">{note.summary}</p>
        
        {/* 这里就是你刚才报错的第 103 行，现在它能“看见” note 了 */}
        <div className="text-[10px] text-indigo-400 flex items-center gap-1">
          <Calendar size={10} /> {new Date(note.created_at).toLocaleDateString()}
        </div>
      </div>
      /* ----------------------------------------------- */
    )) : (
      <p className="text-slate-400 text-sm">记录更多笔记以开启回顾</p>
    )}
  </div>
</section>


          <section>
            <h3 className="font-bold mb-3 flex items-center gap-2 dark:text-slate-200"><Tag size={18} /> 标签筛选</h3>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedTag(null)} className={`px-3 py-1 rounded-full text-sm ${!selectedTag ? 'bg-slate-800 text-white' : 'bg-white border dark:bg-slate-800 dark:border-slate-700'}`}>全部</button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setSelectedTag(tag)} className={`px-3 py-1 rounded-full text-sm ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white border dark:bg-slate-800 dark:border-slate-700'}`}>#{tag}</button>
              ))}
            </div>
          </section>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="搜索..." className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {filteredNotes.map((note) => (
            <article key={note.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800">
              <div className="flex justify-between mb-2">
                <h2 className="font-bold text-lg dark:text-slate-100">{note.title}</h2>
                <button onClick={() => deleteNote(note.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
                <Markdown remarkPlugins={[remarkGfm]}>{note.content}</Markdown>
              </div>
            </article>
          ))}
        </div>
      </main>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl p-6 border dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-slate-100">记录新知识</h3>
              <button onClick={() => !isAiProcessing && setIsEditing(false)}><X /></button>
            </div>
            <input disabled={isAiProcessing} type="text" placeholder="标题" className="w-full text-xl font-bold border-b dark:border-slate-700 pb-2 bg-transparent outline-none dark:text-slate-100" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea disabled={isAiProcessing} placeholder="内容..." className="w-full h-40 mt-4 bg-transparent outline-none dark:text-slate-300" value={content} onChange={(e) => setContent(e.target.value)} />
            <div className="flex justify-end gap-3 mt-4 border-t dark:border-slate-800 pt-4">
              {!isAiProcessing && <button onClick={() => setIsEditing(false)} className="px-4 py-2 dark:text-slate-400">取消</button>}
              <button disabled={isAiProcessing || !title || !content} onClick={handleSaveNote} className="px-6 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                {isAiProcessing ? 'AI 正在结构化...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}