import toast from 'react-hot-toast';

async function copyToClipboard(text: string) {
  if (!navigator.clipboard) return toast.error('Could not copy.');
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied.', {
      position: 'bottom-right',
      className: 'toast'
    });
  } catch(e) {
    toast.error('Could not copy.', {
      position: 'bottom-right',
      className: 'toast'
    });
  }
};

export default copyToClipboard;
