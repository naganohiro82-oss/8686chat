const path = require('path');
const express = require('express');
require('dotenv').config();
const { SYSTEM_PROMPT } = require('./knowledge');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    console.error('ANTHROPIC_API_KEY が設定されていません。');
    return res.status(500).json({ error: 'サーバー側の設定が未完了です（APIキー未設定）。' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages は必須です。' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(502).json({ error: 'AIからの応答取得に失敗しました。' });
    }

    const answer = (data.content || [])
      .map((block) => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n') || 'うまく回答を生成できませんでした。もう一度お試しください。';

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'サーバーエラーが発生しました。' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MOBBY R2B チャットサーバーが起動しました: http://localhost:${PORT}`);
});
