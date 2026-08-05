const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 您的個人 LINE User ID
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; 

// 4個帳號的 Token 對照表
const TOKEN_MAP = {
  "bot_1": process.env.LINE_ACCESS_TOKEN,
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
    return '神祕使用者';
  }
}

async function sendNotificationToAdmin(clientName, clientId, botName, token) {
  try {
    await axios.post('https://line.me', {
      to: ADMIN_USER_ID,
      messages: [{
        type: 'text',
        text: `🚨 【聯絡導師通知】\n\n來自：[ ${botName} ]\n「${clientName}」點選了聯絡導師！\n\n使用者ID: ${clientId}`
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
  const botKey = req.query.bot || 'bot_1';
  const currentToken = TOKEN_MAP[botKey] || process.env.LINE_ACCESS_TOKEN;
  
  // 💡 自動判定通知文字顯示哪一班
  let botName = "班級官方帳號";
  if (botKey === 'bot_1') botName = "餐2忠B 班級公告（家長）";
  if (botKey === 'bot_2') botName = "餐2忠B 班級公告（學生）";
  if (botKey === 'bot_3') botName = "餐1忠B 班級公告（家長）";
  if (botKey === 'bot_4') botName = "餐1忠B 班級公告（學生）";

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
