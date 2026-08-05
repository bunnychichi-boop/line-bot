const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 您的個人 LINE User ID，維持在 Render 設定
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; 

/**
 * 💡 4個帳號的金鑰對照表：
 * 請在這裡填入您 4 個官方帳號的「Bot ID（帳號）」與「Token 名稱」
 * 稍後我們會去 Render 後台把這些 TOKEN_2, TOKEN_3, TOKEN_4 填上去
 */
const TOKEN_MAP = {
  // 第一個帳號（預設讀取原本的設定）
  "bot_1": process.env.LINE_ACCESS_TOKEN,
  
  // ⚠️ 請把下面的 @帳號 換成您實際的四個官方帳號 ID（例如 @737ynxgm）
  "bot_2": process.env.LINE_ACCESS_TOKEN_2,
  "bot_3": process.env.LINE_ACCESS_TOKEN_3,
  "bot_4": process.env.LINE_ACCESS_TOKEN_4
};

async function getUserProfile(userId, token) {
  try {
    const response = await axios.get(`https://line.me{userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.displayName;
  } catch (error) {
    return '神祕學生';
  }
}

async function sendNotificationToAdmin(clientName, clientId, botName, token) {
  try {
    await axios.post('https://line.me', {
      to: ADMIN_USER_ID,
      messages: [{
        type: 'text',
        text: `🚨 【聯絡導師通知】\n\n來自官方帳號：[ ${botName} ]\n學生「${clientName}」正在線上尋找導師！\n\n學生ID: ${clientId}`
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`成功發送 ${botName} 的通知`);
  } catch (error) {
    console.error('通知發送失敗:', error.message);
  }
}

app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];
  
  // 檢查 LINE 是發送到哪一個 Channel ID，藉此判斷是哪一個班級帳號
  // LINE 的 Webhook Header 中會包含 x-line-signature，這裡我們直接動態用 URL 帶入參數最不容易出錯！
  const botKey = req.query.bot || 'bot_1';
  const currentToken = TOKEN_MAP[botKey] || process.env.LINE_ACCESS_TOKEN;
  
  // 取得當前是哪個 Bot 的暱稱
  let botName = "班級官方帳號";
  if (botKey === 'bot_1') botName = "官方帳號 1";
  if (botKey === 'bot_2') botName = "官方帳號 2";
  if (botKey === 'bot_3') botName = "官方帳號 3";
  if (botKey === 'bot_4') botName = "官方帳號 4";

  for (const event of events) {
    if (event.type === 'message' && event.message.text === '聯絡導師') {
      const clientUserId = event.source.userId;
      const clientName = await getUserProfile(clientUserId, currentToken);
      await sendNotificationToAdmin(clientName, clientUserId, botName, currentToken);
    }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
