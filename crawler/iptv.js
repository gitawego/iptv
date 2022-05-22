const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const uris = {
  央视高清:
    "http://live.tvfix.org/list/channel/%E5%A4%AE%E8%A7%86%E9%AB%98%E6%B8%85",
  卫视高清:
    "http://live.tvfix.org/list/channel/%E5%8D%AB%E8%A7%86%E9%AB%98%E6%B8%85",
  地方频道:
    "http://live.tvfix.org/list/channel/%E5%9C%B0%E6%96%B9%E9%A2%91%E9%81%93",
  特色频道:
    "http://live.tvfix.org/list/channel/%E7%89%B9%E8%89%B2%E9%A2%91%E9%81%93",
  
  香港: "http://live.tvfix.org/list/channel/%E9%A6%99%E6%B8%AF",
  新闻频道:
    "http://live.tvfix.org/list/channel/%E6%96%B0%E9%97%BB%E9%A2%91%E9%81%93",
  体育频道:
    "http://live.tvfix.org/list/channel/%E4%BD%93%E8%82%B2%E9%A2%91%E9%81%93",
  电影频道:
    "http://live.tvfix.org/list/channel/%E7%94%B5%E5%BD%B1%E9%A2%91%E9%81%93",
  动漫频道:
    "http://live.tvfix.org/list/channel/%E5%8A%A8%E6%BC%AB%E9%A2%91%E9%81%93",
  纪录频道:
    "http://live.tvfix.org/list/channel/%E7%BA%AA%E5%BD%95%E9%A2%91%E9%81%93",
  日本: "http://live.tvfix.org/list/channel/%E6%97%A5%E6%9C%AC",
  测试频道:
    "http://live.tvfix.org/list/channel/%E6%B5%8B%E8%AF%95%E9%A2%91%E9%81%93",
};

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: `C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe`,
  });

  const page = await browser.newPage();
  const now = new Date().toISOString().replace(/[:.]/g, "_");
  const fileName = path.resolve(__dirname, `./iptv-${now}.m3u`);
  const writeStream = fs.createWriteStream(fileName);
  writeStream.write("#EXTM3U\n");
  const content = ["#EXTM3U"];
  for (let type in uris) {
    // console.log(type);

    const uri = uris[type];

    await page.goto(uri);

    let n = 0;

    while (true) {
      let mark = false;

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const itemElement = (await page.$$("#list > div"))[n];

      if (!itemElement) {
        break;
      }

      const titleElement = await itemElement.$(".title");

      let value = await page.evaluate((el) => el.innerText, titleElement);

      value = value.slice(0, value.length - 16);

      page.on("request", (interceptedRequest) => {
        if (mark) {
          return;
        }

        // 记录m3u8文件
        const url = new URL(interceptedRequest.url());

        if (url.pathname.endsWith(".m3u8") || url.pathname.endsWith(".m3u")) {
          mark = true;
          const metaTag = `#EXTINF:-1 tvg-id="" tvg-country="CN" tvg-language="" tvg-logo="" group-title="${type}",${value}`;
          const videoUrl = interceptedRequest.url();
          writeStream.write(`${metaTag}\n`);
          writeStream.write(`${videoUrl}\n`);
          content.push(metaTag);
          content.push(videoUrl);
          console.log(metaTag);
          console.log(interceptedRequest.url());
          //   console.log(value + ": " + interceptedRequest.url());
        }
      });

      await Promise.all([page.waitForNavigation(), itemElement.click()]);

      n++;

      await new Promise((resolve) => setTimeout(resolve, 5000));

      page.removeAllListeners(["request"]);

      // 回到首页
      await page.goto(uri);
    }

    console.log("");
  }
  writeStream.write("\n");
  writeStream.end();
  fs.writeFileSync("./iptv.m3u", content.join("\n"));
  await browser.close();
})();
