## email-crawler-v2
An improved email crawler using node.js and puppeteer.



## Challenge

> For a given **keyword** get the first **n-th** urls from a certain search engine *(in this case Google)*, for each url get all other nested urls to a **given depth**, for each new url scrap all **emails**,  **meta data** *(description, keywords)*, then save them in a *json* format.



## Setup

1. **Clone** the repo

   ```shell
   git clone https://github.com/artpumpkin/email-crawler-v2
   cd email-crawler-v2
   ```

2. **Install** the dependencies

   ```shell
   npm install
   ```

4. **Start** the main script

   ```shell
   npm start
   ```



## Signature

```typescript
new EmailCrawler({ 
    queries: string[];
    urlsPerQuery: number;
  	maxDepth: number;
  	urlsPerDepth: number;
  	noFilters?: boolean;
})
```



## Code Simple

```typescript
import { EmailCrawler } from 'client';
import fs from 'fs';

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
```



## Results

```javascript
result: {
    querie: string;
    urls: string[];
    metas: {
        url: string;
        keywords: string;
        description: string;
        emails: string[];
    }[];
    emails: string[];
    timeTaken: string;
}[]
```



## Licence

MIT
