// gradient.js
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { exec } from 'child_process';
import os from 'os';
import ProxyChain from 'proxy-chain';

// Global array to hold drivers
let drivers = [];

// ----------------------
// GRID / BROWSER LAUNCHING
// ----------------------

// Function to get screen resolution (supports Windows and Linux)
function getResolution() {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    if (platform === 'win32') {
      exec('wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution', (error, stdout) => {
        if (error) return reject(new Error(`WMIC error: ${error.message}`));
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length >= 2) {
          const dataLine = lines[1].trim();
          const parts = dataLine.split(/\s+/);
          if (parts.length >= 2) {
            const width = parseInt(parts[0], 10);
            const height = parseInt(parts[1], 10);
            return resolve({ width, height });
          }
        }
        return reject(new Error('Unable to parse Windows resolution output.'));
      });
    } else if (platform === 'linux') {
      exec("xrandr | grep '*' | awk '{print $1}'", (error, stdout) => {
        if (error) return reject(new Error(`xrandr error: ${error.message}`));
        const resolution = stdout.split('\n')[0].trim();
        if (resolution) {
          const [width, height] = resolution.split('x').map(Number);
          return resolve({ width, height });
        }
        return reject(new Error('Unable to retrieve Linux resolution.'));
      });
    } else {
      return reject(new Error(`Platform ${platform} is not supported.`));
    }
  });
}

async function getScreenSize() {
  try {
    return await getResolution();
  } catch {
    // Fallback resolution
    return { width: 800, height: 600 };
  }
}

// Create a single browser instance with grid positioning and proxy setting.
async function createBrowser(x, y, w, h, proxy) {
  const opts = new chrome.Options();
  opts.addArguments(
    `--window-position=${x},${y}`,
    `--window-size=${w},${h}`,
    '--force-device-scale-factor=0.2'
  );
  if (proxy) {
    // Parse proxy string to get auth and address
    const [auth, address] = proxy.split('@');
    const [username, password] = auth.split(':');
    const [host, port] = address.split(':');

    // Create proxy URL with authentication
    const proxyUrl = `http://${username}:${password}@${host}:${port}`;
    
    // Create new proxy server with proxy-chain
    const newProxyUrl = await ProxyChain.anonymizeProxy(proxyUrl);
    
    // Configure Chrome to use the anonymous proxy
    opts.addArguments(`--proxy-server=${newProxyUrl}`);
  }
  if (os.platform() === 'linux') {
    opts.addArguments('--no-sandbox');
    opts.setChromeBinaryPath('/usr/bin/chromium-browser');
  }
  // Add the gradient extension
  opts.addExtensions(['gradient.crx']);
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).build();

  // Wait a moment for extension to initialize
  await driver.sleep(2000);
  
  // Clear all tabs after initializing driver
  const handles = await driver.getAllWindowHandles();
  for (let i = handles.length - 1; i > 0; i--) {
    await driver.switchTo().window(handles[i]);
    await driver.close();
  }
  await driver.switchTo().window(handles[0]);
  
  drivers.push(driver);
  return driver;
}

// Launch a browser for each proxy, arranging them in a grid.
async function launchBrowsers(proxies) {
  const { width: w, height: h } = await getScreenSize();
  const cols = 5, rows = 4, max = cols * rows, pad = 1;
  let browserDrivers = [];
  for (let i = 0; i < proxies.length; i++) {
    const pos = i % max;
    const x = (pos % cols) * (w + pad) + pad;
    const y = Math.floor(pos / cols) * (h + pad) + pad;
    const driver = await createBrowser(x, y, w, h, proxies[i]);
    browserDrivers.push(driver);
  }
  return browserDrivers;
}

// ----------------------
// HELPER FUNCTIONS FOR AUTOMATION
// ----------------------

function waitForElement(driver, locator, timeout = 10000) {
  return driver.wait(until.elementLocated(locator), timeout);
}

async function clickElement(driver, locator) {
  const element = await waitForElement(driver, locator);
  await element.click();
}

async function safeClick(driver, locator) {
  try {
    const element = await driver.findElement(locator);
    await element.click();
  } catch (e) {
    // Element not present or not clickable—ignore.
  }
}

async function enterText(driver, locator, text) {
  const element = await waitForElement(driver, locator);
  await element.clear();
  await element.sendKeys(text);
}

// ----------------------
// GRADIENT SERVICE CONFIGURATION
// ----------------------

const gradientConfig = {
  loginUrl: "https://app.gradient.network/",
  extensionUrl: "chrome-extension://caacbgbklghmpodbdafajbgdnegacfmo/popup.html",
  selectors: {
    usernameInput: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[1]/input'),
    passwordInput: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[2]/div[2]/span/input'),
    loginButton: By.xpath('/html/body/div[1]/div[2]/div/div/div/div[4]/button[1]'),
    loginConfirmElement: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[2]'),
    dashboardElement: By.xpath('/html/body/div[1]/div[1]/div[2]/main/div/div/div[1]'),
    gotItButton: By.xpath('/html/body/div[3]/div/div[2]/div/div[1]/div/div/div/button'),
    yesButton: By.xpath('/html/body/div[2]/div/div[2]/div/div[1]/div/div/div/button'),
    rewardSwitchButton: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[3]/div/div[3]'),
    status: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[1]/div[2]/div[3]/div[2]/div/div[2]/div'),
    tapToday: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]'),
    uptime: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]'),
    todayReward: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[1]/div[1]'),
    sessionReward: By.xpath('//*[@id="root-gradient-extension-popup-20240807"]/div/div[4]/div[2]/div[1]')
  }
};

// ----------------------
// GRADIENT SERVICE CLASS
// ----------------------

class GradientService {
  async login(driver, username, password, proxyUrl) {
    try {
      console.log(`Starting Gradient login for ${username}`);
      const { loginUrl, extensionUrl, selectors } = gradientConfig;
      await driver.get(loginUrl);

      // Check if already logged in by looking for dashboard element.
      try {
        await waitForElement(driver, selectors.dashboardElement, 20000);
        console.log(`Already logged in Gradient for ${username}`);
        return true;
      } catch (e) {
        // Not logged in—proceed.
      }
      await enterText(driver, selectors.usernameInput, username);
      await enterText(driver, selectors.passwordInput, password);
      await clickElement(driver, selectors.loginButton);
      await waitForElement(driver, selectors.dashboardElement, 30000);
      await driver.get(extensionUrl);
      await waitForElement(driver, selectors.loginConfirmElement, 30000);
      console.log(`Login success for Gradient ${username}`);
      return true;
    } catch (error) {
      console.error(`Gradient login failed for ${username}: ${error.message}`);
      return false;
    }
  }

  async check(driver, username, proxyUrl) {
    try {
      const { extensionUrl, selectors } = gradientConfig;
      await driver.get(extensionUrl);
      await driver.sleep(2000);
      // Dismiss potential modal dialogs
      await safeClick(driver, selectors.gotItButton);
      await safeClick(driver, selectors.yesButton);
      // Switch to rewards view
      await safeClick(driver, selectors.rewardSwitchButton);
      console.log(`Switched to rewards view for ${username}`);

      const getValueSafe = async (selector) => {
        try {
          const element = await waitForElement(driver, selector);
          return await element.getText();
        } catch (error) {
          console.warn(`Element not found: ${selector}`);
          return 'N/A';
        }
      };

      const [status, tapToday, uptime, todayReward, sessionReward] = await Promise.all([
        getValueSafe(selectors.status),
        getValueSafe(selectors.tapToday),
        getValueSafe(selectors.uptime),
        getValueSafe(selectors.todayReward),
        getValueSafe(selectors.sessionReward)
      ]);

      console.log(`Gradient status for ${username}:
        Status: ${status}
        Tap Today: ${tapToday}
        Uptime: ${uptime}
        Today's Reward: ${todayReward}
        Session Reward: ${sessionReward}`);

      let point = parseInt(sessionReward, 10);
      if (isNaN(point)) point = 0;
      return point;
    } catch (error) {
      console.error(`Gradient check failed for ${username}: ${error.message}`);
      return false;
    }
  }

  // Main function: launches a browser for each proxy, runs login,
  // performs an initial check and then schedules periodic checks every 5 minutes.
  static async main(account, proxies) {
    // Launch browsers (one per proxy) arranged in a grid.
    const browserDrivers = await launchBrowsers(proxies);
    const service = new GradientService();
    const { username, password } = account;

    // For each driver/proxy, run login and initial check; then schedule periodic checks.
    for (let i = 0; i < browserDrivers.length; i++) {
      const driver = browserDrivers[i];
      const proxy = proxies[i];
      const loginSuccess = await service.login(driver, username, password, proxy);
      if (loginSuccess) {
        // Perform the first check
        await service.check(driver, username, proxy);
        // Schedule a check every 5 minutes (300,000 milliseconds)
        setInterval(async () => {
          await service.check(driver, username, proxy);
        }, 5 * 60 * 1000);
      }
    }
  }
}

export default GradientService;
