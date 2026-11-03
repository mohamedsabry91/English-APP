import { exportProgress } from '../core/storage';
import type { LocalDate, Progress } from '../core/types';

/** Save progress as a JSON file on the device. No network. */
export function exportToFile(p: Progress, date: LocalDate): void {
  const text = exportProgress(p, date);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `english-practice-progress-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
