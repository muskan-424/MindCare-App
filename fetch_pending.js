const axios = require('axios');
async function test() {
  try {
    // We need an admin token. Let's get one by logging in as admin.
    const loginRes = await axios.post('http://localhost:5000/api/auth', { email: 'muskanmittal151@gmail.com', password: 'Suy23098#' });
    const token = loginRes.data.token;
    const res = await axios.get('http://localhost:5000/api/admin/pending-verification', {
      headers: { 'x-admin-token': token }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
