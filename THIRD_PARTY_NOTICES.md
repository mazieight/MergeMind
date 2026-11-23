# Third-party notices

The root MIT LICENSE covers original MergeMind code. Third-party code and assets retain their upstream copyright notices and license terms.

## Next.js starter code and assets

MergeMind was initialized with create-next-app. Its starter-derived configuration and the following assets come from the Next.js project:

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`
- `src/app/favicon.ico`

Source: [Next.js create-next-app templates](https://github.com/vercel/next.js/tree/canary/packages/create-next-app/templates). The following notice is reproduced verbatim from the installed Next.js 16.4.6 `license.md`:

```text
The MIT License (MIT)

Copyright (c) 2025 Vercel, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The Next.js and Vercel names and logos also carry trademark conditions described in the [Vercel brand guidelines](https://vercel.com/geist/brands). MergeMind's MIT license grants no rights to those trademarks.

## Package dependencies

`package-lock.json` records exact dependency versions, including optional packages for other platforms. Installed packages carry their own license and notice files. Keep those files and relevant source headers when redistributing their code or binaries, including dependencies included in application bundles or deployment archives.

The following identifies direct dependencies and selected transitive components requiring particular attention. It is a review of the current source repository and lockfile, rather than an exhaustive notice bundle for every possible build or platform.

| Components                                                                                                                       | Upstream license                                                              | Notices and redistribution requirements                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js, React, React DOM, server-only, Supabase clients, Zod, Tailwind CSS, ESLint, Prettier, Vitest, and DefinitelyTyped types | MIT                                                                           | Preserve the applicable upstream copyright and permission notices with distributed copies or substantial portions. Prettier also supplies `THIRD-PARTY-NOTICES.md`.                                                                                                                                        |
| TypeScript, Playwright, and PGlite                                                                                               | Apache-2.0                                                                    | Include the applicable Apache license, retain relevant upstream notices, preserve supplied NOTICE attributions, and identify modifications to upstream files. TypeScript supplies `ThirdPartyNoticeText.txt`. PGlite includes PostgreSQL and other bundled components whose notices must also be retained. |
| Sharp and its platform-specific native packages                                                                                  | Apache-2.0 and, for bundled libvips components, LGPL-3.0-or-later             | Preserve package and embedded component notices. A distribution containing native libraries must also meet the applicable LGPL source and relinking requirements. Inspect the exact platform package and its included libraries for each release.                                                          |
| Lightning CSS and axe-core                                                                                                       | MPL-2.0                                                                       | Preserve MPL notices and provide recipients access to the covered source when distributing covered code, including modifications to covered files.                                                                                                                                                         |
| caniuse-lite                                                                                                                     | CC-BY-4.0                                                                     | Preserve attribution and the license reference for redistributed covered data, and identify changes when applicable. Source: [browserslist/caniuse-lite](https://github.com/browserslist/caniuse-lite).                                                                                                    |
| Other locked transitive packages                                                                                                 | ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, BlueOak-1.0.0, Python-2.0, and CC0-1.0 | Follow the exact package's license and retain its required copyright, license, and disclaimer text.                                                                                                                                                                                                        |

License references: [MIT](https://opensource.org/license/mit), [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0), [LGPL-3.0](https://www.gnu.org/licenses/lgpl-3.0.html), [MPL-2.0](https://www.mozilla.org/MPL/2.0/), and [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).

### Playwright NOTICE

The installed `@playwright/test` 1.65.1 package supplies the following NOTICE, reproduced verbatim:

```text
Playwright
Copyright (c) Microsoft Corporation

This software contains code derived from the Puppeteer project (https://github.com/puppeteer/puppeteer),
available under the Apache 2.0 license (https://github.com/puppeteer/puppeteer/blob/master/LICENSE).
```

## Presentation and fonts

`presentation/MergeMind-final.pptx` embeds two screenshots of the MergeMind demo. The presentation references Arial and the app uses system font names. No font files are embedded in the presentation or tracked in this repository. Font software remains subject to its own license if distributed separately.
