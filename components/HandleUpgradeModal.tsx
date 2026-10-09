'use client';

import React from 'react';
import UpgradeModal from '@/components/UpgradeModal';

type HandleUpgradeModalProps = Omit<React.ComponentProps<typeof UpgradeModal>, 'triggerContext'>;

export function HandleUpgradeModal(props: HandleUpgradeModalProps) {
  return <UpgradeModal triggerContext="handle" {...props} />;
}

export default HandleUpgradeModal;