import puppeteer from "puppeteer";
import * as fs from "fs";
import { loginCredentials } from "./credentials.js";
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const loginAndGetData = async (username, password) => {
  const browser = await puppeteer.launch({
    headless: false, // Change this to "true" for headless mode
    defaultViewport: false,
    userDataDir: "./tmp",
  });

  const url = "http://103.139.165.110:8080";
  const rpUrl = `http://103.139.165.110:8080/accounts/rec_pay.php?from=2023-01-01&to=2023-01-31&but_search=search`;

  const page = await browser.newPage();
  await page.goto(url);

  await page.type(
    "div.form-group:nth-child(1) > div:nth-child(2) > input:nth-child(1)",
    username,
    { delay: 100 }
  );
  await page.type(
    "div.form-group:nth-child(2) > div:nth-child(2) > input:nth-child(1)",
    password,
    { delay: 100 }
  );

  await Promise.all([
    page.waitForNavigation(),
    page.click(".btn"),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  await page.goto(rpUrl);

  const tableData = await page.evaluate(() => {
    const headerRows = Array.from(document.querySelectorAll("table thead tr"));
    const headerData = headerRows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th, td"));
      return cells.slice(0, 3).map((cell) => cell.textContent.trim());
    });

    const bodyRows = Array.from(document.querySelectorAll("table tbody tr"));
    const bodyData = bodyRows.map((row) => {
      const cells = Array.from(row.querySelectorAll("td"));
      return cells.slice(0, 3).map((cell) => cell.textContent.trim());
    });

    return { june: { ...headerData, ...bodyData } };
  });

  await browser.close();
  return tableData;
};

(async () => {
  const resultData = {};
  
  for (const { username, password } of loginCredentials) {
    const data = await loginAndGetData(username, password);
    resultData[username] = data;
  }

  fs.writeFileSync("report.json", JSON.stringify(resultData, null, 2));
})();
