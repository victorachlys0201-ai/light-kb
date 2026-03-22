// api/process-note.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 1. 开启 CORS 跨域允许（生产环境必备）
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求 (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { content } = req.body;
  const apiKey = process.env.DEEPSEEK_API_KEY; // Vercel 会从后台环境变量读取

  const prompt = `
    你是一个知识管理助手。请对以下用户输入的笔记进行结构化处理。
    输出格式必须是严格的 JSON：{"summary": "...", "tags": ["tag1", "tag2"]}
    内容："""${content}"""
  `;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const data = await response.json();
    const aiOutput = JSON.parse(data.choices[0].message.content);
    
    return res.status(200).json(aiOutput);
  } catch (error) {
    return res.status(500).json({ error: 'AI 处理失败', summary: '摘要生成失败', tags: ['未分类'] });
  }
}