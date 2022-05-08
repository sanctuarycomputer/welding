// @ts-nocheck
import { FC, useState, useEffect, useRef } from 'react';
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

// https://github.com/codex-team/editor.js/pull/1741
const DEFAULT_CONTENT = {
  blocks: [{
    "data": {"text": "Start welding..."},
    "type": "paragraph",
  }]
};

const EDITOR_JS_TOOLS = {
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
  },
  embed: Embed,
  table: Table,
  list: List,
  warning: Warning,
  code: Code,
  linkTool: {
    class: LinkTool,
    config: { endpoint: '/api/og' }
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

type Props = {
  content: any,
  contentDidChange: Function,
  readOnly: boolean
};

const Editor: FC<Props> = ({
  content,
  contentDidChange,
  readOnly
}) => {
  const ejInstance = useRef();
  const holder = useRef(DOM_ID);

  let guard = false;
  const initEditor = () => {
    if (guard) return;
    guard = true;

    const editor = new EditorJS({
      readOnly,
      holder: holder.current,
      logLevel: "ERROR",
      data: content || DEFAULT_CONTENT,
      onReady: () => {
        ejInstance.current = editor
        editor.readOnly.toggle(readOnly);
        window.EDITOR = editor;
      },
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

  useEffect(() => {
    if (ejInstance.current) {
      ejInstance.current.readOnly.toggle(readOnly);
    }
  }, [readOnly]);

  return (
    <div id={holder.current}></div>
  );
};

export default Editor;
