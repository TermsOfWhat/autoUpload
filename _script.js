import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import ytdl from 'ytdl-core';
import path from 'path';
import fs from 'fs';
import { sleep } from './sleep.js';
import { getShorts } from './getShorts.js';
import { removeFromIndex } from './removeFromIndex.js';
import { autoScroll } from './autoScroll.js';
import { upload } from './utils/upload.js';
import readline from 'readline';
import dotenv from 'dotenv';
dotenv.config();
puppeteer.use(StealthPlugin());

(async () => {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-accelerated-2d-canvas',
    '--no-zygote',
    '--renderer-process-limit=1',
    '--no-first-run',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-dev-shm-usage',
    '--disable-infobars',
    '--lang=en-US,en',
    '--window-size=1920x1080',
    '--disable-extensions',
  ];
  const options = {
    // dumpio: true,
    args,
    headless: false,
    ignoreHTTPSErrors: true,
    userDataDir: './user_data',
  };
  try {
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en,en-US;q=0,5',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,/;q=0.8',
    });

    console.log('process.env.LINK :', process.env.LINK);
    const link = process.env.LINK;
    const tiktokLink = process.env.TIKTOK_LINK;
    const MyTikTokEmail = process.env.TIKTOK_EMAIL;
    const MyTikTokPassword = process.env.TIKTOK_PASSWORD;
    await page.goto(link, {
      waitUntil: 'networkidle2',
    });

    const pages = await browser.pages();
    console.log('pages ::::', pages);
    await pages[0].close();

    let currentShort = 0;
    let MaxShorts = 300;
    // while (MaxShorts > currentShort) {
    const allTitles = await getShorts(page);
    const unUsedTitles = removeFromIndex(currentShort, allTitles);
    console.log('unUsedTitles :', unUsedTitles);
    for (let short = 0; short < unUsedTitles.length; short++) {
      if (!unUsedTitles[short]) continue;
      currentShort++;
      const outputPath = path.join('shorts', `${new Date().getTime()}.mp4`);
      ytdl(`${unUsedTitles[short]}`).pipe(fs.createWriteStream(outputPath));
      const newTab = await browser.newPage();
      await newTab.goto(tiktokLink, {
        waitUntil: 'networkidle2',
      });
      await newTab.evaluate(() => {
        const googleBtn = document.querySelector(
          '#loginContainer > div > div > div > div:nth-child(5) > div.tiktok-7u35li-DivBoxContainer.e1cgu1qo0 > div.tiktok-1cp64nz-DivTextContainer.e1cgu1qo3 > div > div'
        );
        if (!googleBtn) return true;
        googleBtn.click();
        return false;
      });
      await sleep(2000);

      const googlePopUp = pages[3];
      if (googlePopUp) {
        const isLoggedIn = await googlePopUp.evaluate(() => {
          const account = document.querySelector('.yAlK0b');
          if (account) {
            account.click();
            return true;
          } else {
            return false;
          }
        });
        if (!isLoggedIn) {
          await googlePopUp.type('#identifierId', MyTikTokEmail, { delay: 120 });
          await googlePopUp.evaluate(() => {
            const nextBtn = document.querySelector('#identifierNext > div > button > span');
            nextBtn.click();
          });
          await googlePopUp.waitForSelector(
            '#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input'
          );
          await sleep(1000);

          await googlePopUp.type(
            '#password > div.aCsJod.oJeWuf > div > div.Xb9hP > input',
            MyTikTokPassword,
            { delay: 500 }
          );

          await googlePopUp.waitForSelector('#passwordNext > div > button > div.VfPpkd-RLmnJb');
          await googlePopUp.evaluate(() => {
            const nextBtn = document.querySelector(
              '#passwordNext > div > button > div.VfPpkd-RLmnJb'
            );
            nextBtn.click();
          });
        }

        await sleep(4000);
        if (googlePopUp) {
          await googlePopUp.waitForSelector('.VfPpkd-vQzf8d');
          await googlePopUp.evaluate(() => {
            const continueBtn = document.querySelectorAll('.VfPpkd-RLmnJb');
            continueBtn[3].click();
          });
        }
      }
      //upload to tiktok
      await sleep(2000);
      await upload(newTab, outputPath);

      let isCompleted = false;
      while (!isCompleted) {
        await sleep(1000);
        isCompleted = await newTab.evaluate(() => {
          console.log('test', !document.querySelector('.css-y1m958').disabled);
          return !document.querySelector('.css-y1m958').disabled;
        });
        console.log('after isCompleted :', isCompleted);

        if (isCompleted) {
          await sleep(3000);
          console.log();
          newTab.waitForSelector('.css-y1m958');
          await newTab.evaluate(() => {
            const postBtn = document.querySelector('.css-y1m958');
            console.log('postBtn :', postBtn);
            postBtn.click();
          });
          await sleep(3000);

          await newTab.waitForSelector(
            '#root > div > div > div > div.jsx-4145698467.container-v2 > div.jsx-4145698467.contents-v2.reverse > div.jsx-2908024588.form-v2.reverse > div.tiktok-modal__modal-mask > div > div.tiktok-modal__modal-footer.is-horizontal > div.tiktok-modal__modal-button.is-highlight'
          );
          await sleep(3000);

          newTab.close();
        }
      }
    }

    // await autoScroll(page);
    await sleep(3000);
    //  }
  } catch (e) {
    console.log(e);
  }
})();

//add check for isUploaded ?
//add console.logs
