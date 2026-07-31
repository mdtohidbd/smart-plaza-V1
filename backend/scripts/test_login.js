require('dotenv').config({ path: __dirname + '/../.env' });
const axios = require('axios');

const testLogin = async () => {
  try {
    const res = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@smartplazabd.com',
      password: 'admin123'
    });
    console.log('✅ Admin login success! User:', res.data.user.name, 'Role:', res.data.user.role);
  } catch (err) {
    console.log('❌ Login attempt output:', err.response?.data || err.message);
  }
};

testLogin();
