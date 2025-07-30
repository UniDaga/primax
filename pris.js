const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  white: "\x1b[37m",
  bold: "\x1b[1m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

const logger = {
  info: (msg) => console.log(`${colors.green}[✓] ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠] ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}[✗] ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}[✅] ${msg}${colors.reset}`),
  loading: (msg) => console.log(`${colors.cyan}[⟳] ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.white}[➤] ${msg}${colors.reset}`),
  countdown: (msg) =>
    process.stdout.write(`\r${colors.blue}[⏰] ${msg}${colors.reset}`),
  banner: () => {
    console.log(`${colors.cyan}${colors.bold}`);
    console.log(`---------------------------------------------`);
    console.log(`  PrismaX Auto Bot - Airdrop Insiders  `);
    console.log(`---------------------------------------------${colors.reset}`);
    console.log();
  },
};

function getRandomUserAgent() {
  const userAgents = [
    '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"',
    '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"',
    '"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"',
    '"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15"',
    '"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36"',
    '"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

class PrismaxDailyLoginBot {
  constructor(email) {
    this.email = email;
    this.baseUrl =
      "https://app-prismax-backend-1053158761087.us-west2.run.app/api/daily-login-points";
    this.headers = {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.7",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": getRandomUserAgent(),
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1",
      Referer: "https://app.prismax.ai/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };
  }

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  getDatesBetween(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  }



async dailyLogin(date) {
  try {
    const dateString = this.formatDate(date);
    const payload = {
      email: this.email,
      user_local_date: dateString,
    };

    logger.loading(`Performing daily login for date: ${dateString}`);
    
    // Log the request details for debugging
    console.log('Request URL:', this.baseUrl);
    console.log('Request Headers:', JSON.stringify(this.headers, null, 2));
    console.log('Request Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(this.baseUrl, payload, {
      headers: this.headers,
    });

    if (response.data.success) {
      const data = response.data.data;
      logger.success(`Login successful - ${dateString}`);
      logger.step(`   Today's points: ${data.points_awarded_today}`);
      logger.step(`   Total points: ${data.total_points}`);
      logger.step(
        `   Status: ${
          data.already_claimed_daily ? "Already claimed" : "Newly claimed"
        }`
      );
      logger.step(`   User class: ${data.user_class}`);
      return {
        success: true,
        date: dateString,
        data: data,
      };
    } else {
      logger.error(`Login failed - ${dateString}`);
      logger.error(`Response: ${JSON.stringify(response.data, null, 2)}`);
      return {
        success: false,
        date: dateString,
        error: "Response not successful",
      };
    }
  } catch (error) {
    logger.error(`Error on ${this.formatDate(date)}: ${error.message}`);
    
    // Enhanced error logging
    if (error.response) {
      logger.error(`Status Code: ${error.response.status}`);
      logger.error(`Status Text: ${error.response.statusText}`);
      logger.error(`Response Headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      logger.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      logger.error('No response received from server');
      logger.error(`Request: ${JSON.stringify(error.request, null, 2)}`);
    } else {
      logger.error(`Request setup error: ${error.message}`);
    }
    
    return {
      success: false,
      date: this.formatDate(date),
      error: error.message,
      details: error.response?.data || error.request || error.message,
    };
  }
}
}

function loadEmails() {
  const emails = [];
  let i = 1;
  while (process.env[`EMAIL_${i}`]) {
    emails.push(process.env[`EMAIL_${i}`]);
    i++;
  }
  return emails;
}




async function mainTodayOnly() {
  logger.banner();

  const emails = loadEmails();
  if (emails.length === 0) {
    logger.error(
      "No emails found in .env file. Please add EMAIL_1, EMAIL_2, etc."
    );
    return;
  }

  const today = new Date();
  
  logger.info(`Claiming points for today: ${today.toISOString().split('T')[0]}`);

  for (const email of emails) {
    const bot = new PrismaxDailyLoginBot(email);
    try {
      const result = await bot.dailyLogin(today);
      if (result.success) {
        logger.success(`Successfully claimed points for ${email}`);
      } else {
        logger.error(`Failed to claim points for ${email}: ${result.error}`);
      }
    } catch (error) {
      logger.error(`Error running bot for ${email}: ${error.message}`);
    }
  }

  logger.success("All emails processed successfully!");
}


mainTodayOnly();
