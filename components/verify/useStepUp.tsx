'use client';

import React, { useCallback, useRef, useState } from 'react';
import { StepUpFlow, type StepUpResult } from '@/components/verify/StepUpFlow';

/**
 * Opens the step-up identity check and resolves with its outcome (or null if the member closes it first).
 *
 *   const { run, element } = useStepUp();
 *   const result = await run();                                  // account restriction
 *   const result = await run({ reason: 'photo_swap', photo });   // changing the main photo
 *   ...render {element} once in the page
 */
export function useStepUp() {
  const [open, setOpen] = useState(false);
  // A new key per run: every check starts from the intro sheet with clean state.
  const [session, setSession] = useState(0);
  const [options, setOptions] = useState<{ reason?: 'photo_swap'; photo?: Blob | null }>({});
  const settle = useRef<((r: StepUpResult | null) => void) | null>(null);
  const last = useRef<StepUpResult | null>(null);

  const run = useCallback((opts: { reason?: 'photo_swap'; photo?: Blob | null } = {}) => {
    last.current = null;
    setOptions(opts);
    setSession((n) => n + 1);
    setOpen(true);
    return new Promise<StepUpResult | null>((resolve) => {
      settle.current = resolve;
    });
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
    settle.current?.(last.current);
    settle.current = null;
  }, []);

  const element = <StepUpFlow key={session} open={open} reason={options.reason} photo={options.photo} onClose={onClose} onResult={(r) => (last.current = r)} />;
  return { run, element };
}
