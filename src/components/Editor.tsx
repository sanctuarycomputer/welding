import { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';

import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table';
import List from '@editorjs/list';
import Warning from '@editorjs/warning';
import Code from '@editorjs/code';
import LinkTool from '@editorjs/link';
//import Image from '@editorjs/image';
import Raw from '@editorjs/raw';
import Quote from '@editorjs/quote';
import Marker from '@editorjs/marker';
import CheckList from '@editorjs/checklist';
import Delimiter from '@editorjs/delimiter';
import InlineCode from '@editorjs/inline-code';
import SimpleImage from '@editorjs/simple-image';

// Pattern for building a readOnly format
class MyWarning extends Warning {
  render() {
    if (!this.readOnly) return super.render();
    const container = this._make('div', [this.CSS.baseClass, this.CSS.wrapper]);

    const title = this._make('div', [this.CSS.input, this.CSS.title], {
      contentEditable: !this.readOnly,
      innerHTML: this.data.title,
    });
    const message = this._make('div', [this.CSS.input, this.CSS.message], {
      contentEditable: !this.readOnly,
      innerHTML: this.data.message,
    });

    title.dataset.placeholder = this.titlePlaceholder;
    message.dataset.placeholder = this.messagePlaceholder;

    container.appendChild(title);
    container.appendChild(message);

    return container;
  }
}

const EDITOR_JS_TOOLS = {
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
  },
  embed: Embed,
  table: Table,
  list: List,
  warning: MyWarning,
  code: Code,
  linkTool: {
    class: LinkTool,
    config: {
      endpoint: '/api/fetch-link-metadata',
    }
  },
  //image: Image,
  raw: Raw,
  header: {
    class: Header,
    config: {
      levels: [1, 2, 3],
      defaultLevel: 1
    }
  },
  quote: Quote,
  marker: Marker,
  checklist: CheckList,
  delimiter: Delimiter,
  inlineCode: InlineCode,
  simpleImage: SimpleImage,
};

const DOM_ID = 'editor';

// TODO: Handle readOnly and readOnly changing
const Editor = ({
  content,
  contentDidChange
}) => {
  const ejInstance = useRef();

  let guard = false;
  const initEditor = () => {
    if (guard) return;
    guard = true;

    const editor = new EditorJS({
      holder: DOM_ID,
      logLevel: "ERROR",
      data: content,
      onReady: () => ejInstance.current = editor,
      onChange: async function() {
        let newContent = await editor.saver.save();
        contentDidChange(newContent);
      },
      autofocus: true,
      tools: EDITOR_JS_TOOLS
    });
  };

  useEffect(() => {
    if (!ejInstance.current) initEditor();
    return () => {
      ejInstance.current?.destroy();
      ejInstance.current = null;
    }
  }, []);

  return (
    <div id={DOM_ID}></div>
  );
};

export default Editor;
