import React from 'react';

export interface MobileAttendanceVerificationModalProps {
  visible: boolean;
  actionType: 'CHECK_IN' | 'CHECK_OUT';
  onClose: () => void;
  onSuccess: (sessionId: string) => void | Promise<void>;
}

declare const MobileAttendanceVerificationModal: React.FC<MobileAttendanceVerificationModalProps>;
export default MobileAttendanceVerificationModal;
