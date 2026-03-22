// src/lib/types.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary: string;
  created_at: number;
  last_viewed_at: number;
}

// 模拟 AI 处理函数
export const simulateAIProcess = async (content: string) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 简单的关键词提取逻辑（模拟 AI 标签）
  const commonTags = ['思路', '技术', '生活', '灵感', '工作', '重要'];
  const mockTags = commonTags.filter(() => Math.random() > 0.7);
  if (mockTags.length === 0) mockTags.push('随笔');

  return {
    summary: content.substring(0, 60) + (content.length > 60 ? "..." : ""),
    tags: mockTags
  };
};