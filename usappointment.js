const puppeteer = require("puppeteer");
const parseArgs = require("minimist");
const axios = require("axios");

(async () => {
  //#region Command line args
  const args = parseArgs(process.argv.slice(2), {
    string: ["u", "p", "c", "a", "n", "d", "r"],
    boolean: ["g"],
  });
  const currentDate = new Date("2025-06-01");
  const usernameInput = "L445837@GMAIL.COM";
  const passwordInput = "d2m-eapqrUFH+GK";
  const appointmentId = "65949358";
  const retryTimeout = 10 * 1000;
  const consularId = args.c;
  const userToken = args.n;
  const groupAppointment = args.g;
  const region = "ca";
  let times = 0;
  let lastDate = new Date("2028-06-01");
  //#endregion

  //#region Helper functions
  async function waitForSelectors(selectors, frame, options) {
    for (const selector of selectors) {
      try {
        return await waitForSelector(selector, frame, options);
      } catch (err) {}
    }
    throw new Error(
      "Could not find element for selectors: " + JSON.stringify(selectors)
    );
  }

  async function scrollIntoViewIfNeeded(element, timeout) {
    await waitForConnected(element, timeout);
    const isInViewport = await element.isIntersectingViewport({ threshold: 0 });
    if (isInViewport) {
      return;
    }
    await element.evaluate((element) => {
      element.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "auto",
      });
    });
    await waitForInViewport(element, timeout);
  }

  async function waitForConnected(element, timeout) {
    await waitForFunction(async () => {
      return await element.getProperty("isConnected");
    }, timeout);
  }

  async function waitForInViewport(element, timeout) {
    await waitForFunction(async () => {
      return await element.isIntersectingViewport({ threshold: 0 });
    }, timeout);
  }

  async function waitForSelector(selector, frame, options) {
    if (!Array.isArray(selector)) {
      selector = [selector];
    }
    if (!selector.length) {
      throw new Error("Empty selector provided to waitForSelector");
    }
    let element = null;
    for (let i = 0; i < selector.length; i++) {
      const part = selector[i];
      if (element) {
        element = await element.waitForSelector(part, options);
      } else {
        element = await frame.waitForSelector(part, options);
      }
      if (!element) {
        throw new Error("Could not find element: " + selector.join(">>"));
      }
      if (i < selector.length - 1) {
        element = (
          await element.evaluateHandle((el) =>
            el.shadowRoot ? el.shadowRoot : el
          )
        ).asElement();
      }
    }
    if (!element) {
      throw new Error("Could not find element: " + selector.join("|"));
    }
    return element;
  }

  async function waitForFunction(fn, timeout) {
    let isActive = true;
    setTimeout(() => {
      isActive = false;
    }, timeout);
    while (isActive) {
      const result = await fn();
      if (result) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Timed out");
  }

  async function sleep(timeout) {
    return await new Promise((resolve) => setTimeout(resolve, timeout));
  }

  async function log(msg) {
    const currentDate = "[" + new Date().toLocaleString() + "]";
    console.log(currentDate, msg);
  }

  async function notify(msg) {
    log(msg);

    if (!userToken) {
      return;
    }

    const pushOverAppToken = "a5o8qtigtvu3yyfaeehtnzfkm88zc9";
    const apiEndpoint = "https://api.pushover.net/1/messages.json";
    const data = {
      token: pushOverAppToken,
      user: userToken,
      message: msg,
    };

    await axios.post(apiEndpoint, data);
  }
  //#endregion

  async function runLogic() {
    //#region Init puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    // Comment above line and uncomment following line to see puppeteer in action
    //const browser = await puppeteer.launch({ headless: false });
    const context = await browser.createIncognitoBrowserContext();
const page = await context.newPage();
await page.setUserAgent(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
);
    const timeout = 5000;
    const navigationTimeout = 60000;
    const smallTimeout = 100;
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(navigationTimeout);
    //#endregion

    //#region Logic

    // Set the viewport to avoid elements changing places
    {
      const targetPage = page;
      await targetPage.setViewport({ width: 2078, height: 1479 });
    }

    // Go to login page
    {
      const targetPage = page;
      await targetPage.goto(
        "https://ais.usvisa-info.com/en-" + region + "/niv/users/sign_in",
        { waitUntil: "domcontentloaded" }
      );
    }

    // Click on username input
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [["aria/Email *"], ["#user_email"]],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await element.click({ offset: { x: 118, y: 21.453125 } });
    }

    // Type username
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [["aria/Email *"], ["#user_email"]],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      const type = await element.evaluate((el) => el.type);
      if (
        [
          "textarea",
          "select-one",
          "text",
          "url",
          "tel",
          "search",
          "password",
          "number",
          "email",
        ].includes(type)
      ) {
        await element.type(usernameInput);
      } else {
        await element.focus();
        await element.evaluate((el, value) => {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, usernameInput);
      }
    }

    // Hit tab to go to the password input
    {
      const targetPage = page;
      await targetPage.keyboard.down("Tab");
    }
    {
      const targetPage = page;
      await targetPage.keyboard.up("Tab");
    }

    // Type password
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [["aria/Password"], ["#user_password"]],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      const type = await element.evaluate((el) => el.type);
      if (
        [
          "textarea",
          "select-one",
          "text",
          "url",
          "tel",
          "search",
          "password",
          "number",
          "email",
        ].includes(type)
      ) {
        await element.type(passwordInput);
      } else {
        await element.focus();
        await element.evaluate((el, value) => {
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        }, passwordInput);
      }
    }

    // Tick the checkbox for agreement
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [
          [
            "#sign_in_form > div.radio-checkbox-group.margin-top-30 > label > div",
          ],
        ],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await element.click({ offset: { x: 9, y: 16.34375 } });
    }

    // Click login button
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [
          ['aria/Sign In[role="button"]'],
          ["#new_user > p:nth-child(9) > input"],
        ],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await element.click({ offset: { x: 34, y: 11.34375 } });
      await targetPage.waitForNavigation();
    }

    // We are logged in now. Check available dates from the API
    {
      const targetPage = page;
      await targetPage.setExtraHTTPHeaders({
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
      });

      const response = await targetPage.goto(
        "https://ais.usvisa-info.com/en-" +
          region +
          "/niv/schedule/" +
          appointmentId +
          "/appointment/days/" +
          consularId +
          ".json?appointments[expedite]=false"
      );

      const availableDates = JSON.parse(await response.text());

      if (availableDates.length <= 0) {
        times++;
        if (times % 10 == 0) {
          log(
            "There are no available dates for consulate with id " + consularId
          );
        }
        await browser.close();
        return false;
      }

      const firstDate = new Date(availableDates[0].date);
      if (firstDate < lastDate) {
        lastDate = firstDate;
        console.log("Last date: " + lastDate.toISOString().slice(0, 10));
      }

      if (firstDate > currentDate) {
        times++;
        if (times % 10 == 0) {
          log(
            times +
              ". There is not an earlier date available than " +
              currentDate.toISOString().slice(0, 10)
          );
        }

        await browser.close();
        return false;
      }

      notify("Found an earlier date! " + firstDate.toISOString().slice(0, 10));
    }

    // Go to appointment page
    {
      const targetPage = page;
      await targetPage.goto(
        "https://ais.usvisa-info.com/en-" +
          region +
          "/niv/schedule/" +
          appointmentId +
          "/appointment",
        { waitUntil: "domcontentloaded" }
      );
      await sleep(1000);
    }

    // Select the specified consular from the dropdown
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [
          ["aria/Consular Section Appointment", 'aria/[role="combobox"]'],
          ["#appointments_consulate_appointment_facility_id"],
        ],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await page.select(
        "#appointments_consulate_appointment_facility_id",
        consularId
      );
      await sleep(1000);
    }

    // Click on date input
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [
          ["aria/Date of Appointment *"],
          ["#appointments_consulate_appointment_date"],
        ],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await element.click({ offset: { x: 394.5, y: 17.53125 } });
      await sleep(1000);
    }

    // Keep clicking next button until we find the first available date and click to that date
    {
      const targetPage = page;
      while (true) {
        try {
          const element = await waitForSelectors(
            [
              ['aria/25[role="link"]'],
              [
                "#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a",
              ],
            ],
            targetPage,
            { timeout: smallTimeout, visible: true }
          );
          await scrollIntoViewIfNeeded(element, timeout);
          await page.click(
            "#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group > table > tbody > tr > td.undefined > a"
          );
          await sleep(500);
          break;
        } catch (err) {
          {
            const targetPage = page;
            const element = await waitForSelectors(
              [
                ["aria/Next", 'aria/[role="generic"]'],
                [
                  "#ui-datepicker-div > div.ui-datepicker-group.ui-datepicker-group-last > div > a > span",
                ],
              ],
              targetPage,
              { timeout, visible: true }
            );
            await scrollIntoViewIfNeeded(element, timeout);
            await element.click({ offset: { x: 4, y: 9.03125 } });
          }
        }
      }
    }

    // Select the first available Time from the time dropdown
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [["#appointments_consulate_appointment_time"]],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await page.evaluate(() => {
        document.querySelector(
          "#appointments_consulate_appointment_time option:nth-child(2)"
        ).selected = true;
        const event = new Event("change", { bubbles: true });
        document
          .querySelector("#appointments_consulate_appointment_time")
          .dispatchEvent(event);
      });
      await sleep(1000);
    }

    // Click on reschedule button
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [["aria/Reschedule"], ["#appointments_submit"]],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await element.click({ offset: { x: 78.109375, y: 20.0625 } });
      await sleep(1000);
    }

    // Click on submit button on the confirmation popup
    {
      const targetPage = page;
      const element = await waitForSelectors(
        [
          ["aria/Cancel"],
          ["body > div.reveal-overlay > div > div > a.button.alert"],
        ],
        targetPage,
        { timeout, visible: true }
      );
      await scrollIntoViewIfNeeded(element, timeout);
      await page.click(
        "body > div.reveal-overlay > div > div > a.button.alert"
      );
      await sleep(5000);
    }

    await browser.close();
    return true;
    //#endregion
  }

  const isWithinAllowedTime = () => {
    const now = new Date();
    const hours = now.getHours();
    return hours >= 20 || hours < 6;
  };

  while (true) {
    if (!isWithinAllowedTime()) {
      await sleep(1000 * 60); // 等待1分钟后再检查
      continue;
    }
    try {
      const result = await runLogic();

      if (result) {
        notify("Successfully scheduled a new appointment");
        break;
      }
    } catch (err) {
      // Swallow the error and keep running in case we encountered an error.
    }

    await sleep(retryTimeout);
  }
})();
