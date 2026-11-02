import { getTag } from '../core/content';
import { ArText } from './ArText';
import type { TagId } from '../core/types';
import { useStore } from './store';

/** Tag name in the interface language. Arabic names contain English examples, so isolate them. */
export function TagName({ id }: { id: TagId }) {
  const { lang } = useStore();
  const tag = getTag(id);
  if (!tag) return <bdi>{id}</bdi>;
  return <bdi>{lang === 'ar' ? <ArText>{tag.nameAr}</ArText> : tag.nameEn}</bdi>;
}
