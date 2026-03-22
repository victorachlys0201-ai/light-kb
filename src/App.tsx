import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, BookOpen, Tag, Trash2, Calendar, Sparkles, X } from 'lucide-react';

// --- 数据结构定义 ---
interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary: string;
  created_at: number;
  last_viewed_at: number;
}

// --- 【新增】真实 AI 处理函数 ---
// 它会请求你本地运行的 proxy.js 代理服务
const processNoteWithDeepSeek = async (content: string): Promise<{ summary: string, tags: string[] }> => {
  try {
    const response = await fetch('http://localhost:3001/api/process-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error('AI 服务请求失败');

    const data = await response.json();
    return {
      summary: data.summary,
      tags: data.tags,
    };
  } catch (error) {
    console.error('接入 DeepSeek 时出错:', error);
    // 兜底方案：如果 API 挂了，返回基本信息，不影响用户保存
    return {
      summary: content.substring(0, 40) + "...",
      tags: ['未分类'],
    };
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

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem('lightkb_notes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  // 持久化存储
  useEffect(() => {
    localStorage.setItem('lightkb_notes', JSON.stringify(notes));
  }, [notes]);

  // --- 【修改】核心功能：创建笔记 ---
  const handleSaveNote = async () => {
    if (!title || !content) return;
    
    setIsAiProcessing(true); // 开始显示“AI 正在结构化”

    // 调用真实的 DeepSeek 处理逻辑
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
    
    // 重置状态与表单
    setTitle('');
    setContent('');
    setIsEditing(false); // 关键：关闭弹窗
    setIsAiProcessing(false); // 关键：停止加载动画
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  // 搜索与筛选逻辑
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? note.tags.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });
  }, [notes, searchQuery, selectedTag]);

  // 每日回顾逻辑
  const dailyReviewNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => a.last_viewed_at - b.last_viewed_at)
      .slice(0, 3);
  }, [notes]);

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <BookOpen size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">LightKB</h1>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} /> <span>记录新知识</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <section className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-4 text-indigo-700 font-bold">
              <Sparkles size={18} />
              <h3>今日知识回顾</h3>
            </div>
            <div className="space-y-3">
              {dailyReviewNotes.length > 0 ? dailyReviewNotes.map(note => (
                <div key={note.id} className="bg-white p-3 rounded-xl shadow-sm border border-indigo-100 text-sm">
                  <p className="font-semibold mb-1 truncate">{note.title}</p>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-2">{note.summary}</p>
                  <div className="text-[10px] text-indigo-400 flex items-center gap-1">
                    <Calendar size={10} /> 记录于 {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              )) : <p className="text-slate-400 text-sm">记录更多笔记以开启回顾</p>}
            </div>
          </section>

          <section>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Tag size={18} /> 标签筛选
            </h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedTag ? 'bg-slate-800 text-white' : 'bg-white border text-slate-600'}`}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-600 hover:border-indigo-300'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索标题或内容..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredNotes.length > 0 ? filteredNotes.map(note => (
              <article key={note.id} className="bg-white p-5 rounded-2xl border group hover:border-indigo-200 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-bold text-lg">{note.title}</h2>
                  <button onClick={() => deleteNote(note.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">#{tag}</span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
              </article>
            )) : (
              <div className="text-center py-20 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                <p>没有找到相关笔记</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">记录新知识</h3>
                <button 
                  onClick={() => { if(!isAiProcessing) setIsEditing(false); }} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X />
                </button>
              </div>
              <input 
                autoFocus
                disabled={isAiProcessing}
                type="text" 
                placeholder="知识点标题" 
                className="w-full text-xl font-bold outline-none border-b pb-2 focus:border-indigo-500 disabled:bg-transparent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea 
                disabled={isAiProcessing}
                placeholder="在此输入详细内容..." 
                className="w-full h-40 outline-none resize-none text-slate-600 disabled:bg-transparent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-4">
                {!isAiProcessing && (
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                )}
                <button 
                  disabled={isAiProcessing || !title || !content}
                  onClick={handleSaveNote}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAiProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      AI 正在结构化...
                    </>
                  ) : '保存并生成 AI 标签'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}