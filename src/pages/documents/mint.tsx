import React, { useState } from 'react';
import type { NextPage } from 'next';
import Modal from 'react-modal';
import Frontmatter from 'src/components/Frontmatter';
import { useFormik } from 'formik';
import { emojiIndex } from 'emoji-mart';
import dynamic from 'next/dynamic';
import * as yup from 'yup';
import EditNav from 'src/components/EditNav';
import TopicManager from 'src/components/TopicManager';

const Editor = dynamic(() => import('src/components/Editor'), {
  ssr: false
});

const allEmojis = Object.values(emojiIndex.emojis);
const RANDOM_EMOJI = allEmojis[0];
const IS_BROWSER = typeof window !== "undefined";

const Home: NextPage = () => {
  const editableKey = 'draft:document:content';

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
    <>
      <EditNav
        backLinkHref="/documents"
        backLinkLabel="← Documents"
        buttonDisabled={!(formik.isValid && formik.dirty)}
        buttonLabel={formik.isSubmitting ? "Loading..." : "+ Mint Document"}
        onButtonClick={formik.handleSubmit}
      />
      <div className="content py-4 mt-24 mx-auto">
        <Frontmatter formik={formik} />
        <TopicManager />
        <Editor content={content} contentDidChange={contentDidChange} />
      </div>
    </>
  )
};

export default Home;
