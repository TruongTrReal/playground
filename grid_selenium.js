import { Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import { exec } from 'child_process';
import os from "os";

let drivers = [];

// Custom function to get screen resolution on both Windows and Linux
function getResolution() {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows: use WMIC command to get the resolution
      exec('wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution', (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`WMIC error: ${error.message}`));
        }
        const lines = stdout.trim().split('\n').filter(line => line.trim() !== '');
        if (lines.length >= 2) {
          // First line is header; use the second line as data.
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
      // Linux: use xrandr to get the resolution (requires an X11 session)
      exec("xrandr | grep '*' | awk '{print $1}'", (error, stdout, stderr) => {
        if (error) {
          return reject(new Error(`xrandr error: ${error.message}`));
        }
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
    // Fallback to default resolution if detection fails
    return { width: 1920, height: 1080 };
  }
}

async function createBrowser(x, y, w, h) {
  const opts = new chrome.Options();
  opts.addArguments(
    `--window-position=${x},${y}`,
    `--window-size=${w},${h}`,
    '--force-device-scale-factor=0.2'
  );
  if (os.platform() === 'linux') {
    opts.addArguments(
      '--no-sandbox',
    );
    opts.setChromeBinaryPath('/usr/bin/chromium-browser');
  }
  drivers.push(await new Builder().forBrowser('chrome').setChromeOptions(opts).build());
}

async function launchBrowsers(n) {
  const { width: w, height: h } = await getScreenSize();
  const cols = 5, rows = 4, max = cols * rows, pad = 1;

  for (let i = 0; i < n; i++) {
    const pos = i % max;
    const x = (pos % cols) * (w + pad) + pad;
    const y = Math.floor(pos / cols) * (h + pad) + pad;
    await createBrowser(x, y, w, h);
  }
}

process.on('SIGINT', async () => {
  for (let driver of drivers) {
    try {
      await driver.quit();
    } catch {}
  }
  process.exit();
});

await launchBrowsers(12);
setInterval(() => {}, 1000);
