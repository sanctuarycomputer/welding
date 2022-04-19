import { Blob } from 'nft.storage';
import type { NextPage } from 'next';
import Frontmatter from 'src/components/Frontmatter';
import { useFormik } from 'formik';
import Modal from 'react-modal';
import React, { useState } from 'react';
import { emojiIndex } from 'emoji-mart';
import dynamic from 'next/dynamic';
import * as yup from 'yup';

const Editor = dynamic(() => import('../components/Editor'), {
  ssr: false
});

const allEmojis = Object.values(emojiIndex.emojis);
//const RANDOM_EMOJI = allEmojis[Math.floor(Math.random()*allEmojis.length)];
const RANDOM_EMOJI = allEmojis[0];

const IS_BROWSER = typeof window !== "undefined";

const Home: NextPage = () => {
  const editableKey = 'draft:document:0x0123:content';

  const [content, setContent] = useState(JSON.parse(
    (IS_BROWSER && window.localStorage.getItem(editableKey)) ||
    '{}'
  ));

  const contentDidChange = (newContent) => {
    if (IS_BROWSER) {
      window.localStorage.setItem(
        editableKey,
        JSON.stringify(newContent)
      );
    }
    setContent(newContent);
  };

  //const saveDraftAsFile = () => {
  //  const blob = new Blob([JSON.stringify(content)], { type: "text/json" });
  //  const link = document.createElement("a");
  //  link.download = editableKey;
  //  link.href = window.URL.createObjectURL(blob);
  //  link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");
  //  link.dispatchEvent(new MouseEvent("click", {
  //    view: window,
  //    bubbles: true,
  //    cancelable: true,
  //  }));
  //  link.remove();
  //};

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      emoji: RANDOM_EMOJI
    },
    onSubmit: () => {
    },
    validationSchema: yup.object({
      name:
        yup.string().trim().required('Document name is required'),
    }),
  });

  return (
    <div className="content py-4 mt-24 mx-auto">
      <div className="mb-24">
        <div className="pill inline"><span>0x123</span>minemeld</div>
        <span className="px-2 font-bold">/</span>
        <div className="pill inline"><span>0x456</span>Intro to minemeld</div>
      </div>

      <Frontmatter formik={formik} />

      <Editor
        content={content}
        contentDidChange={contentDidChange}
      />
    </div>
  )
};

export default Home;
