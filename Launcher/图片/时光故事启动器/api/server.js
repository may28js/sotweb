
/**
 * 时光故事 - 生产级后端桥接器 (Production Bridge)
 * 仿照 acore-cms-wp-plugin 逻辑实现
 */
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// --- 核心配置 (已根据您的反馈修正) ---
const CONFIG = {
  DB: {
    host: 'localhost', // 如果数据库和此脚本在同一台VPS，请保持 localhost
    user: 'web',
    password: 'm123852', // 填入您的数据库密码
    authDB: 'acore_auth',        // 修正后的数据库名
    charDB: 'acore_characters'   // 修正后的数据库名
  },
  SOAP: {
    url: 'http://127.0.0.1:7878', // 修正后的 AC 默认 SOAP 端口
    user: 'm',            // 您在游戏中创建的GM账号
    pass: '1'        // 该账号的密码
  }
};

async function sendSoapCommand(command) {
  const soapMsg = `
    <?xml version="1.0" encoding="UTF-8"?>
    <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:MaNGOS">
      <SOAP-ENV:Body>
        <ns1:executeCommand>
          <command>${command}</command>
        </ns1:executeCommand>
      </SOAP-ENV:Body>
    </SOAP-ENV:Envelope>
  `;

  try {
    const response = await axios.post(CONFIG.SOAP.url, soapMsg, {
      auth: { username: CONFIG.SOAP.user, password: CONFIG.SOAP.pass },
      headers: { 'Content-Type': 'text/xml' }
    });
    return response.data;
  } catch (error) {
    console.error('SOAP Error:', error.message);
    throw new Error('无法连接至 WorldServer SOAP 接口，请检查端口 7878 是否开启');
  }
}

app.post('/api/auth/register', async (req, res) => {
  const { account, email, password } = req.body;
  try {
    // 1. 通过 SOAP 创建账号
    await sendSoapCommand(`account create ${account} ${password}`);
    
    // 2. 更新 Email (SQL)
    const conn = await mysql.createConnection(CONFIG.DB);
    await conn.execute(`UPDATE ${CONFIG.DB.authDB}.account SET email = ? WHERE username = ?`, [email, account.toUpperCase()]);
    await conn.end();
    
    res.json({ success: true, message: '注册成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/user/characters', async (req, res) => {
  const accountId = req.query.accountId;
  try {
    const conn = await mysql.createConnection(CONFIG.DB);
    const [rows] = await conn.execute(
      `SELECT guid, name, level, race, class, gender FROM ${CONFIG.DB.charDB}.characters WHERE account = ?`,
      [accountId]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: '无法读取角色' });
  }
});

app.listen(3000, () => console.log('API Bridge started on port 3000'));
