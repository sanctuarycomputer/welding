import { emojiIndex, BaseEmoji } from 'emoji-mart';

export const emojis = Object.values(emojiIndex.emojis).filter(e => {
  return 'native' in e;
});

const DEFAULT_EMOJI: BaseEmoji = (Object.values(emojis)[0] as BaseEmoji);

export default DEFAULT_EMOJI;
