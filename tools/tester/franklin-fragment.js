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

        const { href, origin } = new URL(`${urlAttribute.value}.plain.html`);

        // Load fragment
        const resp = await fetch(href);
        if (!resp.ok) {
          throw new Error(`Unable to fetch ${href}`);
        }

        const main = document.createElement('main');
        let htmlText = await resp.text();

        // Fix relative image urls
        const regex = /.\/media/g;
        htmlText = htmlText.replace(regex, `${origin}/media`);
        main.innerHTML = htmlText;

        // Set initialized to true so we don't run through this again
        this.initialized = true;

        const { loadBlocks } = await import(`${origin}/scripts/lib-franklin.js`);
        const { decorateMain } = await import(`${origin}/scripts/scripts.js`);
        decorateMain(main);
        await loadBlocks(main);

        // Append the fragment to the shadow dom
        if (this.shadowRoot) {
          this.shadowRoot.append(main);
        }
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
