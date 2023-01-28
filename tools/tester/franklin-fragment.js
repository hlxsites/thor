/*
 * Franklin Fragment WebComponent
 * Include content from one Helix page in another.
 * https://www.hlx.live/developer/block-collection/TBD
 */

// eslint-disable-next-line import/prefer-default-export
export class FranklinFragment extends HTMLElement {
  constructor() {
    super();

    // Attaches a shadow DOM tree to the element
    // With mode open the shadow root elements are accessible from JavaScript outside the root
    this.attachShadow({ mode: 'open' });

    // Keep track if we have rendered the fragment yet.
    this.initialized = false;
  }

  /**
   * Invoked each time the custom element is appended into a document-connected element.
   * This will happen each time the node is moved, and may happen before the element's contents
   * have been fully parsed.
   */
  async connectedCallback() {
    if (!this.initialized) {
      try {
        const urlAttribute = this.attributes.getNamedItem('url');
        if (!urlAttribute) {
          throw new Error('franklin-fragment missing url attribute');
        }

        const body = document.createElement('body');
        body.style = 'display: none';
        this.shadowRoot.append(body);

        const { href, origin } = new URL(`${urlAttribute.value}.plain.html`);

        // Load fragment
        const resp = await fetch(href);
        if (!resp.ok) {
          throw new Error(`Unable to fetch ${href}`);
        }

        const styles = document.createElement('link');
        styles.setAttribute('rel', 'stylesheet');
        styles.setAttribute('href', `${origin}/styles/styles.css`);
        styles.onload = () => { body.style = ''; };
        styles.onerror = () => { body.style = ''; };
        this.shadowRoot.appendChild(styles);

        const main = document.createElement('main');
        body.append(main);

        let htmlText = await resp.text();
        // Fix relative image urls
        const regex = /.\/media/g;
        htmlText = htmlText.replace(regex, `${origin}/media`);
        main.innerHTML = htmlText;

        // Set initialized to true so we don't run through this again
        this.initialized = true;

        // Query all the blocks in the fragment
        const blockElements = main.querySelectorAll(':scope > div > div');

        // Did we find any blocks or all default content?
        if (blockElements.length > 0) {
          // Get the block names
          const blocks = Array.from(blockElements).map((block) => block.classList.item(0));

          // Load scripts file for fragment host site
          window.hlx = window.hlx || {};
          window.hlx.suppressLoadPage = true;

          const { decorateMain } = await import(`${origin}/scripts/scripts.js`);
          if (decorateMain) {
            await decorateMain(main);
          }
          body.classList.add('appear');

          // For each block in the fragment load it's js/css
          for (let i = 0; i < blockElements.length; i += 1) {
            const blockName = blocks[i];
            const block = blockElements[i];
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', `${origin}/blocks/${blockName}/${blockName}.css`);

            const cssLoaded = new Promise((resolve) => {
              link.onload = resolve;
              link.onerror = resolve;
            });

            body.appendChild(link);
            // eslint-disable-next-line no-await-in-loop
            await cssLoaded;

            const blockScriptUrl = `${origin}/blocks/${blockName}/${blockName}.js`;
            // eslint-disable-next-line no-await-in-loop
            const decorateBlock = await import(blockScriptUrl);
            if (decorateBlock.default) {
              // eslint-disable-next-line no-await-in-loop
              await decorateBlock.default(block);
            }
          }
          const sections = main.querySelectorAll('.section');
          sections.forEach((s) => {
            s.dataset.sectionStatus = 'loaded';
          });
        }

        // Append the fragment to the shadow dom
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err || 'An error occured while loading the fragment');
      }
    }
  }

  /**
   * Imports a script and appends to document body
   * @param {*} url
   * @returns
   */

  // eslint-disable-next-line class-methods-use-this
  async importScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.type = 'module';
      script.onload = resolve;
      script.onerror = reject;

      document.body.appendChild(script);
    });
  }
}

customElements.define('franklin-fragment', FranklinFragment);
