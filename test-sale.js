const axios = require('axios');

async function test() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@gmail.com', // Need to know a valid email, but let's try generic or skip auth if possible
      password: 'password'
    });
    const token = loginRes.data.token;
    console.log("Logged in");
  } catch(e) {
    console.error("Login failed:", e.response ? e.response.data : e.message);
  }
}
test();
