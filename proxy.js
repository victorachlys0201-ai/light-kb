// proxy.js (本地代理服务器)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config(); // 加载 .env 中的环境变量

const app = express();
const PORT = 3001; // 代理服务运行在 3001 端口

// 允许 Vite App (通常是 5173 端口) 访问本服务
app.use(cors({ origin: 'http://localhost:5173' })); 
app.use(express.json());

// --- 核心路由：处理笔记结构化 ---
app.post('/api/process-note', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: '没有提供笔记内容' });
  }

  // 1. 隐藏你的 Key
  const apiKey = process.env.DEEPSEEK_API_KEY; 

  if (!apiKey || apiKey.includes('xxxx')) {
    return res.status(500).json({ error: '未正确配置 DEEPSEEK_API_KEY，请检查 .env 文件' });
  }

  // 2. 构造精细的 Prompt (指示 AI 输出 JSON)
  const prompt = `
    你是一个知识管理助手。请对以下用户输入的笔记进行结构化处理。
    你需要：
    1. 生成一个30字以内的极简摘要 (summary)。
    2. 提取 2 到 4 个核心关键词作为标签 (tags)。
    
    你的输出必须是严格的 JSON 格式，如下所示：
    {
      "summary": "...",
      "tags": ["tag1", "tag2"]
    }

    用户笔记内容：
    """
    ${content}
    """
  `;

  try {
    console.log('--- 正在 call DeepSeek API ---');
    
    // 3. 执行真正的 DeepSeek API 调用
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat", // 或者是 "deepseek-coder"，取决于你的 Key 类型
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1, // 降低创造性，更注重结构化
        response_format: { type: 'json_object' } // 某些模型支持，强制输出 JSON
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 返回错误：${response.statusText}`);
    }

    const data = await response.json();
    console.log('--- API 返回原始数据 ---', data.choices[0].message.content);

    // 4. 解析 AI 返回的 JSON 字符串
    const aiOutput = JSON.parse(data.choices[0].message.content);
    
    res.json({
      summary: aiOutput.summary || content.substring(0, 30), // 兜底
      tags: aiOutput.tags || ['随笔'] // 兜底
    });

  } catch (error) {
    console.error('--- 代理服务器报错 ---', error);
    res.status(500).json({ error: 'API 处理失败，使用 mock 数据兜底', summary: 'AI摘要失败', tags: ['未分类'] });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 本地 API 代理服务已启动：http://localhost:${PORT}`);
  console.log('你现在可以启动 Vite App 并在保存笔记时 call 这个服务了。');
});