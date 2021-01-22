import { EmailCrawler } from 'client';
import fs from 'fs';

// TODO email occurrency starting from 1 and kept incrementing in each encounter
// TODO reconnect on url queries


const emailCrawler = new EmailCrawler({
  queries: ['jumia', 'avito', 'vendo'],
  urlsPerQuery: 1,
  maxDepth: 2,
  urlsPerDepth: 10,
  noFilters: true,
});

emailCrawler.crawl().then((result) => {
  fs.writeFileSync('result.json', JSON.stringify(result));
});
