async function test() {
  try {
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@smartplazabd.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    
    if (!loginData.token) {
      console.log('Login failed:', loginData);
      return;
    }
    
    const res = await fetch('http://localhost:5001/api/investors', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loginData.token
      },
      body: JSON.stringify({
        name: 'Test Inv', 
        email: 'inv123@test.com', 
        phone: '01988887777', 
        password: 'password123', 
        investmentAmount: 1000, 
        profitSharePercentage: 10, 
        investedDate: '2025-01-01'
      })
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('Error:', e.message);
  }
}
test();
