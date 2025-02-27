// run.js
import GradientService from './gradient.js';

// Configuration data (could also be loaded from a JSON file)
const config = {
  account: {
    username: "bull1@veer.vn",
    password: "Rtn@2024"
  },
  proxy: [
    "kingptBe3u:proxydate143@45.3.55.175:9090",
    "kingptBe3u:proxydate143@45.3.58.73:9090",
    'kingptBe3u:proxydate143@45.3.55.32:9090',
    'kingptBe3u:proxydate143@45.3.53.194:9090',
    'kingptBe3u:proxydate143@45.3.58.254:9090',
  ]
};

// Start the Gradient automation.
GradientService.main(config.account, config.proxy);
