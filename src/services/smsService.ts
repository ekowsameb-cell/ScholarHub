import { dbGetUsers } from '../dbAdapter';

export interface SMSLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  messageType: 'Receipt' | 'Fee_Reminder' | 'Announcement' | 'Direct_Message';
  content: string;
  status: 'Sent' | 'Delivered';
  timestamp: string;
}

const SMS_STORAGE_KEY = 'sh_sms_logs';

export const dbGetSMSLogs = (): SMSLog[] => {
  try {
    const raw = localStorage.getItem(SMS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse SMS logs:', e);
    return [];
  }
};

export const saveSMSLog = (log: SMSLog): void => {
  const logs = dbGetSMSLogs();
  logs.unshift(log);
  localStorage.setItem(SMS_STORAGE_KEY, JSON.stringify(logs));
  window.dispatchEvent(new Event('sh_data_updated'));
};

interface SendSMSParams {
  recipientPhone: string;
  recipientName: string;
  messageType: 'Receipt' | 'Fee_Reminder' | 'Announcement' | 'Direct_Message';
  content: string;
  openNativeSMS?: boolean;
}

export const sendSMS = async ({
  recipientPhone,
  recipientName,
  messageType,
  content,
  openNativeSMS = true
}: SendSMSParams): Promise<SMSLog> => {
  const cleanPhone = recipientPhone.replace(/\s+/g, '');
  const log: SMSLog = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    recipientPhone: cleanPhone || '+233241234567',
    recipientName,
    messageType,
    content,
    status: 'Delivered',
    timestamp: new Date().toISOString()
  };

  saveSMSLog(log);

  // If requested, open native mobile/desktop SMS protocol link (sms:+233...?body=...)
  if (openNativeSMS && cleanPhone) {
    const smsUri = `sms:${cleanPhone}?body=${encodeURIComponent(content)}`;
    window.open(smsUri, '_blank');
  }

  return log;
};

// Helper: Send Fee Payment Receipt SMS
export const sendReceiptSMS = async (params: {
  studentName: string;
  parentName: string;
  parentPhone: string;
  receiptNumber: string;
  amountPaid: number;
  paymentMethod: string;
  itemsPaidFor: string;
  remainingBalance: number;
}): Promise<SMSLog> => {
  const text = `ScholarHub ERP Receipt #${params.receiptNumber}: Received GHS ${params.amountPaid.toFixed(2)} (${params.paymentMethod}) for ${params.studentName} (${params.itemsPaidFor}). Remaining Balance: GHS ${params.remainingBalance.toFixed(2)}. Thank you!`;

  return sendSMS({
    recipientPhone: params.parentPhone,
    recipientName: params.parentName || `Parent of ${params.studentName}`,
    messageType: 'Receipt',
    content: text
  });
};

// Helper: Send Fee Overdue Reminder SMS
export const sendFeeReminderSMS = async (params: {
  studentName: string;
  parentName: string;
  parentPhone: string;
  balance: number;
}): Promise<SMSLog> => {
  const text = `ScholarHub ERP Alert: Dear ${params.parentName}, kindly note that ${params.studentName} has a pending fee balance of GHS ${params.balance.toFixed(2)}. Please make payment at the Bursar office or via MoMo. Thank you.`;

  return sendSMS({
    recipientPhone: params.parentPhone,
    recipientName: params.parentName,
    messageType: 'Fee_Reminder',
    content: text
  });
};

// Helper: Find parent phone number for a student
export const getParentPhoneForStudent = (parentId: string, defaultPhone = '+233241234567'): { name: string; phone: string } => {
  const users = dbGetUsers();
  const parent = users.find(u => u.uid === parentId || u.role === 'Parent');
  return {
    name: parent?.fullName || 'Parent',
    phone: parent?.phone || defaultPhone
  };
};

