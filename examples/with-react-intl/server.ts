import {basename} from 'path';
import {sync as globSync} from 'glob';
import {createServer} from 'http';
import accepts from 'accepts';
import next from 'next';
import {polyfill} from './polyfills';
// Get the supported languages by looking for translations in the `lang/` dir.
const supportedLanguages = globSync('./compiled-lang/*.json').map(f =>
  basename(f, '.json')
);

const SUPPORTED_LOCALES = ['en', 'fr'];

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();

// We need to load and expose the translations on the request for the user's
// locale. These will only be used in production, in dev the `defaultMessage` in
// each message description in the source code will be used.
const getMessages = (locale: string = 'en') => {
  return require(`./compiled-lang/${locale}.json`);
};

Promise.all([app.prepare(), ...SUPPORTED_LOCALES.map(polyfill)]).then(() => {
  createServer((req, res) => {
    const accept = accepts(req);
    const locale = accept.language(supportedLanguages) || 'en';
    (req as any).locale = locale;
    (req as any).messages = dev ? {} : getMessages(locale);
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
