// 删掉 React，只保留需要的 hook
import { useState, useEffect, useMemo } from 'react'; 
import { Plus, Search, BookOpen, Tag, Trash2, Calendar, Sparkles, X, Sun, Moon } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


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

    const response = await fetch('https://light-kb-6skg.vercel.app/api/process-note', {
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
  // 暗黑模式状态初始化
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dark-mode');
      return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 监听状态并修改 HTML 的 class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dark-mode', 'false');
    }
  }, [isDark]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
    <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-10 transition-colors">
     <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
     <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
          <BookOpen size={20} />
       </div>
        <h1 className="font-bold text-xl tracking-tight dark:text-slate-100">LightKB</h1>
      </div>
    
     <div className="flex items-center gap-3">
        {/* --- 新增：暗黑模式切换按钮 --- */}
       <button 
          onClick={() => setIsDark(!isDark)}
         className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button 
          onClick={() => setIsEditing(true)}
         className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all shadow-sm"
       >
          <Plus size={18} /> <span>记录新知识</span>
        </button>
     </div>
   </div>
  </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="space-y-8">
  <section className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
    <div className="flex items-center gap-2 mb-4 text-indigo-700 dark:text-indigo-400 font-bold">
      <Sparkles size={18} />
      <h3>今日知识回顾</h3>
    </div>
    <div className="space-y-3">
      {dailyReviewNotes.length > 0 ? dailyReviewNotes.map(note => (
        <div key={note.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-indigo-100 dark:border-slate-700 text-sm">
          <p className="font-semibold mb-1 truncate dark:text-slate-100">{note.title}</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 mb-2">{note.summary}</p>
          <div className="text-[10px] text-indigo-400 flex items-center gap-1">
            <Calendar size={10} /> 记录于 {new Date(note.created_at).toLocaleDateString()}
          </div>
        </div>
      )) : <p className="text-slate-400 text-sm">记录更多笔记以开启回顾</p>}
    </div>
  </section>

  <section>
    <h3 className="font-bold mb-3 flex items-center gap-2 dark:text-slate-200">
      <Tag size={18} /> 标签筛选
    </h3>
    <div className="flex flex-wrap gap-2">
      <button 
        onClick={() => setSelectedTag(null)}
        className={`px-3 py-1 rounded-full text-sm transition-colors ${!selectedTag ? 'bg-slate-800 dark:bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
      >
        全部
      </button>
      {allTags.map(tag => (
        <button 
          key={tag}
          onClick={() => setSelectedTag(tag)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${selectedTag === tag ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
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
               className="w-full pl-10 pr-4 py-3 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-4">
  {filteredNotes.length > 0 ? (
    filteredNotes.map((note) => (
      <article
  key={note.id}
  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-500/50 transition-all shadow-sm"
>
  <div className="flex justify-between items-start mb-2">
    <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">{note.title}</h2>
    <button
      onClick={() => deleteNote(note.id)}
      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <Trash2 size={18} />
    </button>
  </div>

  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none mb-4 text-slate-600 dark:text-slate-400">
    <Markdown remarkPlugins={[remarkGfm]}>
      {note.content}
    </Markdown>
  </div>

  <div className="flex items-center justify-between">
    <div className="flex flex-wrap gap-2">
      {note.tags.map((tag) => (
        <span
          key={tag}
          className="text-xs bg-indigo-50 dark:bg-indigo-900/40 text-indigo-500 dark:text-indigo-300 px-2 py-1 rounded-md"
        >
          #{tag}
        </span>
      ))}
    </div>
    <span className="text-xs text-slate-400 dark:text-slate-500">
      {new Date(note.created_at).toLocaleDateString()}
    </span>
  </div>
</article>

      </article>
    ))
  ) : (
    <div className="text-center py-20 text-slate-400">
      <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
      <p>没有找到相关笔记</p>
    </div>
  )}
</div>


      {isEditing && (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    {/* 弹窗主体容器：增加 dark:border-slate-800 */}
    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border dark:border-slate-800">
      
      {/* 内部统一边距容器 */}
      <div className="p-6 space-y-4">
        
        {/* 头部：标题与关闭按钮 */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg dark:text-slate-100">记录新知识</h3>
          <button 
            onClick={() => { if(!isAiProcessing) setIsEditing(false); }} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X />
          </button>
        </div>

        {/* 输入框：标题 */}
        <input 
          autoFocus
          disabled={isAiProcessing}
          type="text" 
          placeholder="知识点标题" 
          className="w-full text-xl font-bold outline-none border-b dark:border-slate-700 pb-2 bg-transparent focus:border-indigo-500 text-slate-900 dark:text-slate-100 disabled:opacity-50"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 输入框：内容 */}
        <textarea 
          disabled={isAiProcessing}
          placeholder="在此输入详细内容..." 
          className="w-full h-40 outline-none resize-none bg-transparent text-slate-600 dark:text-slate-300 disabled:opacity-50"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* 底部按钮区域：必须放在 p-6 容器内，以保证间距一致 */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
          {!isAiProcessing && (
            <button 
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              取消
            </button>
          )}
          
          <button 
            disabled={isAiProcessing || !title || !content}
            onClick={handleSaveNote}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            {isAiProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>AI 正在结构化...</span>
              </>
            ) : (
              '保存并生成 AI 标签'
            )}
          </button>
        </div>

      </div> {/* 结束 p-6 */}
    </div> {/* 结束 Modal Card */}
  </div> /* 结束 Backdrop */
)}
       