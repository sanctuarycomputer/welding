// @ts-nocheck
import { FC, useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";

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

// import Marker from "@editorjs/marker";
// import Undo from "editorjs-undo";
// import Raw from "@editorjs/raw";
// import Warning from "@editorjs/warning";
// import CheckList from "@editorjs/checklist";

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
    class: Paragraph,
    inlineToolbar: true,
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
    class: Header,
    config: {
      levels: [1, 2, 3],
      defaultLevel: 1,
    },
  },
  quote: Quote,
  delimiter: Delimiter,
  inlineCode: InlineCode,
};

const DOM_ID = "editor";

type Props = {
  content: any;
  contentDidChange: (content: any) => void;
  readOnly: boolean;
};

const Editor: FC<Props> = ({ content, contentDidChange, readOnly }) => {
  const ejInstance = useRef();
  const ejUndoInstance = useRef();
  const holder = useRef(DOM_ID);

  let guard = false;
  const initEditor = () => {
    if (guard) return;
    guard = true;

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
      tools: EDITOR_JS_TOOLS,
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
