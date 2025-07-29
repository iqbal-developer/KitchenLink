const axios = require('axios');
setInterval(async () => {
  try {
    const res = await axios.get('http://localhost:3000');
    console.log('UP', new Date());
  } catch (e) {
    console.log('DOWN', new Date());
  }
}, 60000); // every minute 