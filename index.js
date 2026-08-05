const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID; 

async function getUserProfile(userId) {
  try {
    const response = await axios.get(`https://line.me{userId}`, {
      headers: { 'Authorization': `Bearer ${LINE_ACCESS_TOKEN}` }
    });
    return response.data.displayName;
  } catch (error) {
    return '神祕顧客';
  }
}

async function sendNotificationToAdmin(clientName, clientId) {
  try {
    await axios.post('https://line.me', {
      to: ADMIN_USER_ID,
      messages: [{
        type: 'text',
        text: `🚨 【客服通知】\n\n學生/客戶「${clientName}」點選了聯絡導師！\n\n使用者ID: ${clientId}`
      }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
      }
    });
    console.log('已通知管理員');
  } catch (error) {
    console.error('通知失敗:', error.message);
  }
}

app.post('/webhook', async (req, res) => {
  const events = req.body.events || [];
  for (const event of events) {
    // 💡 這裡已經成功改為「聯絡導師」囉！
    if (event.type === 'message' && event.message.text === '聯絡導師') {
      const clientUserId = event.source.userId;
      const clientName = await getUserProfile(clientUserId);
      await sendNotificationToAdmin(clientName, clientUserId);
    }
  }
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
