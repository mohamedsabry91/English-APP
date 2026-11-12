import { ArText } from './ArText';

/**
 * A note shown under English content. The English text is shown when the content has it;
 * otherwise the older Arabic text (the app is moving to English only). Shows nothing when both are missing.
 */
export function Note({ en, ar, className, testId }: { en?: string; ar?: string; className?: string; testId?: string }) {
  if (en) return <p lang="en" dir="ltr" className={className} data-testid={testId}>{en}</p>;
  if (ar) return <p lang="ar" dir="rtl" className={className} data-testid={testId}><ArText>{ar}</ArText></p>;
  return null;
}
