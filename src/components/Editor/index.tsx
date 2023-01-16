// @ts-nocheck
import { FC, useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import { getRelatedNodes } from "src/lib/useBaseNodeFormik";

import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import Embed from "@editorjs/embed";
import Table from "@editorjs/table";
import List from "@editorjs/list";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Quote from "@editorjs/quote";
import Delimiter from "@editorjs/delimiter";
import InlineCode from "@editorjs/inline-code";
import Color from "../../../vendor/editorjs-text-color-plugin";
import Image from "@editorjs/image";

import validateEmail from "src/utils/validateEmail";
import toast from "react-hot-toast";

// import Marker from "@editorjs/marker";
// import Undo from "editorjs-undo";
// import Raw from "@editorjs/raw";
// import Warning from "@editorjs/warning";
// import CheckList from "@editorjs/checklist";

const make = (tagName, classNames = null, attributes = {}) => {
  const el = document.createElement(tagName);
  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }
  for (const attrName in attributes) {
    el[attrName] = attributes[attrName];
  }
  return el;
}

class ParagraphCallout extends Paragraph {
  constructor(...args) {
    const result = super(...args);
    ParagraphCallout.tunes.forEach(tune => {
      result._element.classList.toggle(`${result._CSS.wrapper}--${tune.name}`, !!args[0].data[tune.name]);
    });
    return result;
  }

  save(toolsContent) {
    return {
     ...(this.data || {}),
      text: toolsContent.innerHTML
    };
  }

  static get tunes() {
    return [
      {
        name: 'asCallout',
        icon: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.8 10.592v2.043h2.35v2.138H15.8v2.232h-2.25v-2.232h-2.4v-2.138h2.4v-2.28h2.25v.237h1.15-1.15zM1.9 8.455v-3.42c0-1.154.985-2.09 2.2-2.09h4.2v2.137H4.15v3.373H1.9zm0 2.137h2.25v3.325H8.3v2.138H4.1c-1.215 0-2.2-.936-2.2-2.09v-3.373zm15.05-2.137H14.7V5.082h-4.15V2.945h4.2c1.215 0 2.2.936 2.2 2.09v3.42z"/></svg>`
      },
    ]
  }

  renderSettings(){
    const wrapper = document.createElement('div');
    ParagraphCallout.tunes.forEach( tune => {
      const button = document.createElement('div');
      button.classList.add('cdx-settings-button');
      button.innerHTML = tune.icon;
      wrapper.appendChild(button);
      button.addEventListener('click', () => {
        this._toggleTune(tune.name);
        button.classList.toggle('cdx-settings-button--active');
      });
    });

    return wrapper;
  }

  _toggleTune(tuneName: string) {
    // inverse tune state
    const newValue = !this._data[tuneName];
    this._data[tuneName] = newValue;
    this._element.classList.toggle(`${this._CSS.wrapper}--${tuneName}`, newValue);
  }
}

class CustomQuote extends Quote {
  render() {
    const container = this._make('blockquote', [this.CSS.baseClass, this.CSS.wrapper]);
    const quote = this._make('div', [this.CSS.input, this.CSS.text], {
      contentEditable: !this.readOnly,
      innerHTML: this.data.text,
    });
    quote.dataset.placeholder = this.quotePlaceholder;
    container.appendChild(quote);

    // Disable captions for all new quotes, we'll expect the user
    // to embed sources in the copy of the quote itself. That's a
    // better editing experience.
    if (!["", "<br>"].includes(this.data.caption)) {
      const caption = this._make('div', [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
        innerHTML: this.data.caption,
      });
      caption.dataset.placeholder = this.captionPlaceholder;
      container.appendChild(caption);
    }

    return container;
  }
}

class LinkableHeader extends Header {
  constructor(...args) {
    const result = super(...args);
    this.blockId = args[0]?.block?.id;
    this._element = this.getTag();

    for (let i = 0; i < this.api.blocks.getBlocksCount(); i++) {
      const block = this.api.blocks.getBlockByIndex(i);
      if (block.name === "tableOfContents") block.call("sync");
    }

    return result;
  }

  getTag() {
    const tag = super.getTag();
    if (this.blockId) tag.id = this.blockId;
    return tag;
  }
}

class EmailSignup {
  constructor({ api, config }) {
    this.config = config;
    this.api = api; 
    this._CSS = { 
      wrapper: "ce-email-signup",
      input: "ce-email-signup__input",
      button: "ce-email-signup__button"
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  static get toolbox() {
    return {
      title: "Email Signup",
      icon: '<svg fill="#000000" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 16 16" width="16px" height="16px"><path d="M 7.976563 0.0117188 L 1.503906 4.492188 L 1.46875 4.523438 C 1.46875 4.523438 1.359375 4.636719 1.25 4.796875 C 1.144531 4.957031 1 5.167969 1 5.5 L 1 12.5 C 1 13.324219 1.675781 14 2.5 14 L 13.5 14 C 14.324219 14 15 13.324219 15 12.5 L 15 5.5 C 15 4.859375 14.519531 4.53125 14.410156 4.464844 Z M 7.976563 1.226563 L 13.433594 5.003906 L 8 8.765625 L 2.542969 4.988281 Z M 2 5.828125 L 8 9.984375 L 14 5.828125 L 14 12.5 C 14 12.78125 13.78125 13 13.5 13 L 2.5 13 C 2.21875 13 2 12.78125 2 12.5 Z"/></svg>'
    };
  }

  async didSubmit(e) {
    if (e.preventDefault) e.preventDefault();
    if (!this.config.signupUrl) return false;

    const data = new FormData(e.target);
    const email = data.get("email");

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.", {
        className: "toast",
      });
      return false;
    }

    const toastId = toast.loading("Submitting...", {
      className: "toast",
    });
    const response = await fetch(this.config.signupUrl, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok || response.status !== 200) {
      toast.error("An error occurred. Please try again.", {
        id: toastId,
      });
      return false;
    }

    toast.success("Success! You're subscribed.", {
      id: toastId,
    });

    // Email Template & Unsubscribes
    // Admin Only Subgraph Panel to download subscribers
    return false;
  }

  render() {
    const form = make('form', [this._CSS.wrapper]);
    const input = make('input', [this._CSS.input], {
      name: "email"
    });
    input.placeholder = "Enter your email...";
    form.appendChild(input);
    const button = make('button', [this._CSS.button], {
      innerHTML: this.config.listName ? `Subscribe to ${this.config.listName}` : "Subscribe",
    });
    form.appendChild(button);

    form.attachEvent ? 
      form.attachEvent("submit", this.didSubmit.bind(this)) :
      form.addEventListener("submit", this.didSubmit.bind(this));
    return form;
  }

  save(/*blockContent*/) {
    return {};
  }
}

class TableOfContents {
  constructor({ api }) {
    this.api = api;
    this._CSS = { wrapper: "ce-toc" };
    this._element = document.createElement("div");
    this._element.classList.add(this._CSS.wrapper);
  }

  static get isReadOnlySupported() {
    return true;
  }

  static get toolbox() {
    return {
      title: "Table of Contents",
      icon: '<svg fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16px" height="16px"><path d="M 1.5 3 A 0.50005 0.50005 0 0 0 1 3.5 L 1 5.5 A 0.50005 0.50005 0 0 0 1.5 6 L 3.5 6 A 0.50005 0.50005 0 0 0 4 5.5 L 4 3.5 A 0.50005 0.50005 0 0 0 3.5 3 L 1.5 3 z M 5 3 L 5 4 L 15 4 L 15 3 L 5 3 z M 2 4 L 3 4 L 3 5 L 2 5 L 2 4 z M 5 5 L 5 6 L 12 6 L 12 5 L 5 5 z M 1.5 9 A 0.50005 0.50005 0 0 0 1 9.5 L 1 11.5 A 0.50005 0.50005 0 0 0 1.5 12 L 3.5 12 A 0.50005 0.50005 0 0 0 4 11.5 L 4 9.5 A 0.50005 0.50005 0 0 0 3.5 9 L 1.5 9 z M 5 9 L 5 10 L 15 10 L 15 9 L 5 9 z M 2 10 L 3 10 L 3 11 L 2 11 L 2 10 z M 5 11 L 5 12 L 12 12 L 12 11 L 5 11 z"/></svg>',
    };
  }

  render() {
    this.sync();
    return this._element;
  }

  sync() {
    const headers = [];

    for (let i = 0; i < this.api.blocks.getBlocksCount(); i++) {
      const block = this.api.blocks.getBlockByIndex(i);
      if (block.name === "header") {
        const el = block.holder.querySelector(".ce-header");
        headers.push({
          id: block.id,
          level: parseInt(el?.tagName.replace("H", "")),
          title: el ? el.innerText : "",
        });
      }
    }

    let innerHTML = "";
    headers.forEach((header, index) => {
      const prev = index ? headers[index - 1] : { level: 1 };
      if (prev.level === header.level) {
        innerHTML += `<li><a href="#${header.id}">${header.title}</a></li>`;
      } else if (prev.level > header.level) {
        for (let i = 0; i < prev.level - header.level; i++)
          innerHTML += `</ul>`;
        innerHTML += `<li><a href="#${header.id}">${header.title}</a></li>`;
      } else if (prev.level < header.level) {
        for (let i = 0; i < header.level - prev.level; i++) innerHTML += `<ul>`;
        innerHTML += `<li><a href="#${header.id}">${header.title}</a></li>`;
      }
    });
    this._element.innerHTML = `<ul>${innerHTML}</ul>`;
  }

  save(/*blockContent*/) {
    this.sync();
    return {};
  }
}

// https://github.com/codex-team/editor.js/pull/1741
const DEFAULT_CONTENT = {
  blocks: [
    {
      data: { text: "Start writing..." },
      type: "paragraph",
    },
  ],
};

const EDITOR_COLORS = [
  "var(--text-color)",
  "var(--color-brown)",
  "var(--color-orange)",
  "var(--color-yellow)",
  "var(--color-green)",
  "var(--color-blue)",
  "var(--color-purple)",
  "var(--color-pink)",
  "var(--color-red)",
];

const EDITOR_JS_TOOLS = {
  // checklist: CheckList,
  // warning: Warning,
  // raw: Raw,

  tableOfContents: {
    class: TableOfContents,
  },

  image: {
    class: Image,
    config: {
      endpoints: {
        byFile: "/api/image",
        byUrl: "/api/image",
      },
    },
  },

  color: {
    class: Color,
    config: {
      colorCollections: EDITOR_COLORS,
      type: "text",
      defaultColor: "var(--color-blue)",
    },
  },

  paragraph: {
    class: ParagraphCallout,
    inlineToolbar: true,
    preserveBlank: true,
  },

  embed: {
    class: Embed,
    config: {
      services: {
        figma: {
          regex:
            /https:\/\/([\w\.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(\/.*)?$/,
          embedUrl:
            "https://www.figma.com/embed?embed_host=welding.app&url=https://www.figma.com/file/<%= remote_id %>",
          html: "<iframe frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen style='width:100%;' height='320'></iframe>",
          height: 320,
          width: 640,
          id: (groups) => `${groups[2]}${groups[3]}`,
        },
        loom: {
          regex: /https?:\/\/www.loom.com\/share\/([^\/\?\&]*)/,
          embedUrl:
            "https://www.loom.com/embed/<%= remote_id %>?hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true",
          html: "<iframe frameborder='0' webkitallowfullscreen mozallowfullscreen allowfullscreen style='width:100%;' height='320'></iframe>",
          height: 320,
          width: 580,
          id: (groups) => groups[0],
        },
      },
    },
  },
  table: Table,
  list: List,
  code: Code,
  linkTool: {
    class: LinkTool,
    config: { endpoint: "/api/og" },
  },
  header: {
    class: LinkableHeader,
    config: {
      levels: [1, 2, 3],
      defaultLevel: 1,
    },
  },

  quote: {
    class: CustomQuote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: 'Add a pullquote',
    },
  },

  delimiter: Delimiter,
  inlineCode: InlineCode,
};

const DOM_ID = "editor";

type Props = {
  content: any;
  contentDidChange: (content: any) => void;
  readOnly: boolean;
  formik: FormikProps<BaseNodeFormValues>;
};

const Editor: FC<Props> = ({ content, contentDidChange, readOnly, formik }) => {
  const ejInstance = useRef();
  const ejUndoInstance = useRef();
  const holder = useRef(DOM_ID);

  const subgraphParent = getRelatedNodes(
    formik,
    "outgoing",
    "Subgraph",
    "BELONGS_TO"
  )[0];

  let guard = false;
  const initEditor = () => {
    if (guard) return;
    guard = true;

    const tools = subgraphParent ?
      {
        ...EDITOR_JS_TOOLS,
        emailSignup: {
          class: EmailSignup,
          config: {
            signupUrl: `/api/lists/${subgraphParent.tokenId}/subscribe`,
            listName: `${subgraphParent.currentRevision.nativeEmoji} ${subgraphParent.currentRevision.name}`,
          }
        },
      } :
      EDITOR_JS_TOOLS;

    const editor = new EditorJS({
      readOnly,
      minHeight: 20,
      holder: holder.current,
      data: content || DEFAULT_CONTENT,
      onReady: () => {
        ejInstance.current = editor;
        editor.readOnly.toggle(readOnly);
        //ejUndoInstance.current = new Undo({ editor });
        //ejUndoInstance.current.setReadOnly();
      },
      onChange: async function () {
        const newContent = await editor.saver.save();
        contentDidChange(newContent);
      },
      autofocus: true,
      tools
    });
  };

  useEffect(() => {
    if (!ejInstance.current) initEditor();
    return () => {
      ejInstance.current?.destroy();
      ejInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (ejInstance.current) {
      ejInstance.current.readOnly.toggle(readOnly);
    }
    if (ejUndoInstance.current) {
      ejUndoInstance.current.setReadOnly();
    }
  }, [readOnly]);

  return <div id={holder.current} className="px-2 md:px-0"></div>;
};

export default Editor;
