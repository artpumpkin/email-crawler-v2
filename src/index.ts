import { EmailCrawler } from 'client';
import fs from 'fs';

const emailCrawler = new EmailCrawler({
  queries: ["webscraper io"],
  urlsPerQuery: 1,
});

emailCrawler.crawlUrls().then((result) => {
  fs.writeFileSync('urls.json', JSON.stringify(result));
});

// emailCrawler.crawl().then((result) => {
//   fs.writeFileSync('result.json', JSON.stringify(result));
// });
