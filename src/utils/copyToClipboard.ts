import toast from "react-hot-toast";

async function copyToClipboard(text: string) {
  if (!navigator.clipboard) return toast.error("Could not copy.");
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied.", {
      className: "toast",
    });
  } catch (e) {
    toast.error("Could not copy.", {
      className: "toast",
    });
  }
}

export default copyToClipboard;
