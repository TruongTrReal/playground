// Dữ liệu JSON được nhúng trực tiếp vào code
const config = {
    "account": {
      "username": "user123",
      "password": "pass123"
    },
    "proxy": [
      "95cl4a5h:orfECOrGJkWp@103.69.97.51:3166",
      "95cl4a5h:orfECOrGJkWp@103.69.97.51:3167"
    ]
  };
  
  function main(account, proxy) {
    console.log("Account:");
    console.log("Username:", account.username);
    console.log("Password:", account.password);
    
    console.log("\nProxies:");
    proxy.forEach((item, index) => {
      console.log(`Proxy ${index + 1}: ${item}`);
    });
  }
  
  // Lấy thông tin account và proxy từ biến config
  const { account, proxy } = config;
  
  // Gọi hàm main với dữ liệu đã nhúng
  main(account, proxy);
  