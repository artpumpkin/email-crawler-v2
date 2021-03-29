import puppeteer from 'puppeteer';
import { parseDomain, fromUrl, ParseResultType } from 'parse-domain';
import { performance } from 'perf_hooks';
import isUrl from 'is-url';
import ms from 'ms';

interface IEmailCrawler {
  queries: string[];
  urlsPerQuery: number;
}

class EmailCrawler {
  private queries: string[];
  private urlsPerQuery: number;
  private static EMAIL_PATTERN = /\b[a-z0-9_.+-]+?@[a-z-]+?\.[a-z-.]+?\b/gi;
  private browser: puppeteer.Browser;
  private page: puppeteer.Page;
  private currentUrl: string;
  private metas: {
    url: string;
    keywords: string;
    description: string;
    emails: string[];
  }[];
  private emails: string[];
  private processedUrls: string[];

  constructor({ queries, urlsPerQuery = 10 }: IEmailCrawler) {
    this.queries = queries;
    this.urlsPerQuery = urlsPerQuery;
  }

  async crawlUrls() {
    try {
      await this.openBrowser();

      const results = [];
      for (const querie of this.queries) {
        const t0 = performance.now();
        const urls = await this.getUrls(querie);
        this.processedUrls = [];
        for (const url of urls) {
          this.currentUrl = url;
          await this.extractUrls(url);
        }

        const t1 = performance.now();
        results.push({
          querie,
          urls,
          timeTaken: Math.round((t1 - t0) / 10) / 100 + 's',
        });
      }
      return results;
    } finally {
      await this.browser.close();
    }
  }

  async extractUrls(url: string) {
    this.processedUrls.push(url);

    console.log(this.processedUrls.length);

    try {
      await this.page.goto(url, { waitUntil: 'load', timeout: ms('2m') });
      this.page.on('dialog', async (dialog) => {
        try {
          await dialog.accept();
        } catch {}
      });

      const hrefs = await this.page.$$eval('a[href]', (elements) =>
        elements.map((element) =>
          (element as HTMLAnchorElement).href.toLowerCase(),
        ),
      );

      const filteredHrefs = hrefs.filter((href) => {
        /* Only accept hrefs if
         * href is a url
         * href is not already processed
         * href is not whitelisted
         * href domain name is same as current url domaine name
         */
        const isURL = isUrl(href);
        const isProcessed = this.processedUrls.includes(href);
        const isWhitelisted = this.isWhitelisted(href, ['google', 'facebook']);
        const isSameDomainName =
          this.getUrlDomainName(this.currentUrl) ===
          this.getUrlDomainName(href);
        return isURL && !isProcessed && !isWhitelisted && isSameDomainName;
      });

      for (const href of filteredHrefs) {
        await this.extractUrls(href);
      }
    } catch (e) {
      return;
    }
  }

  async crawl() {
    try {
      await this.openBrowser();

      const results = [];
      for (const querie of this.queries) {
        const t0 = performance.now();
        const urls = await this.getUrls(querie);
        this.metas = [];
        this.emails = [];
        this.processedUrls = [];
        for (const url of urls) {
          url
          this.currentUrl = 'https://webscraper.io/';
          await this.extractEmails('https://webscraper.io/');
        }

        const t1 = performance.now();
        results.push({
          querie,
          urls,
          metas: this.metas,
          emails: this.emails,
          timeTaken: Math.round((t1 - t0) / 10) / 100 + 's',
        });
      }
      return results;
    } finally {
      await this.browser.close();
    }
  }

  async openBrowser() {
    this.browser = await puppeteer.launch({
      headless: true,
    });

    this.page = await this.browser.newPage();

    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      if (
        req.resourceType() === 'image' ||
        req.resourceType() === 'font' ||
        req.resourceType() === 'stylesheet'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  async getUrls(querie: string) {
    const urls = [];
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      querie,
    )}&start=${urls.length}`;
    await this.page.goto(url, { waitUntil: 'load' });
    const hrefs = await this.page.$$eval('.g a:not([class])', (elements) =>
      elements.map((element) =>
        (element as HTMLAnchorElement).href.toLowerCase(),
      ),
    );

    const filteredHrefs = hrefs.filter((href) => isUrl(href));
    for (const href of filteredHrefs) {
      urls.push(href);
      if (urls.length === this.urlsPerQuery) break;
    }
    return urls;
  }

  async extractEmails(url: string, depth = 0) {
    // Store already visited urls
    this.processedUrls.push(url);

    try {
      await this.page.goto(url, { waitUntil: 'load', timeout: ms('2m') });
      this.page.on('dialog', async (dialog) => {
        try {
          await dialog.accept();
        } catch {}
      });
      const html = await this.page.content();

      // TODO For each page gets its queries from meta tags.
      let keywords = '';
      try {
        keywords = await this.page.$eval(
          'meta[name=keywords]',
          (element) => (element as HTMLMetaElement)?.content || '',
        );
      } catch {
        keywords = '';
      }

      let description = '';
      try {
        description = await this.page.$eval(
          'meta[name=description]',
          (element) => (element as HTMLMetaElement)?.content || '',
        );
      } catch {
        description = '';
      }

      // Only get emails with the same domain names.
      const matches = html.match(EmailCrawler.EMAIL_PATTERN) || [];
      const emails: string[] = [];
      for (const match of matches) {
        const email = match.toLowerCase();
        if (
          this.getUrlDomainName(this.currentUrl) ===
          this.getEmailDomainName(email)
        ) {
          if (!this.emails.includes(email) && !emails.includes(email)) {
            emails.push(email);
          }
        }
      }

      this.emails.push(...emails);
      this.metas.push({
        url,
        keywords,
        description,
        emails,
      });

      const hrefs = await this.page.$$eval('a[href]', (elements) =>
        elements.map((element) =>
          (element as HTMLAnchorElement).href.toLowerCase(),
        ),
      );

      const filteredHrefs = hrefs.filter((href) => {
        /* Only accept hrefs if
         * href is a url
         * href is not already processed
         * href is not whitelisted
         * href domain name is same as current url domaine name
         */
        const isURL = isUrl(href);
        const isProcessed = this.processedUrls.includes(href);
        const isWhitelisted = this.isWhitelisted(href, ['google', 'facebook']);
        const isSameDomainName =
          this.getUrlDomainName(this.currentUrl) ===
          this.getUrlDomainName(href);
        return isURL && !isProcessed && !isWhitelisted && isSameDomainName;
      });

      for (const href of filteredHrefs) {
        await this.extractEmails(href, depth + 1);
      }
    } catch (e) {
      console.log({ url, error: e.message });
      return;
    }
  }

  getUrlDomainName(url: string) {
    const parseResult = parseDomain(fromUrl(url));
    if (parseResult.type === ParseResultType.Listed) {
      const { domain, topLevelDomains } = parseResult;
      return `${domain}.${topLevelDomains.join('.')}`;
    }
  }

  isWhitelisted(url: string, whitelist: string[]) {
    const parseResult = parseDomain(fromUrl(url));
    if (parseResult.type === ParseResultType.Listed) {
      const { domain } = parseResult;
      return whitelist.includes(domain!);
    }
  }

  getEmailDomainName(email: string) {
    return email.match(/(?<=@)[a-z-]+?\.[a-z-.]+?\b/i)![0];
  }
}

export default EmailCrawler;
