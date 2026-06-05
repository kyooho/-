/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Prescription {
  id: string;
  date: string;
  department: string;
  doctor: string;
  printed: boolean;
  checkedByDefault: boolean;
  hospitalName?: string;
}

export interface Patient {
  id: string; // Patient Registration Number or ID (환자등록번호)
  name: string;
  residentFirst: string; // 6 digits (e.g., "850101")
  residentLast: string;  // 7 digits (e.g., "1234567")
  prescriptions: Prescription[];
}

export type AppStep = 'home' | 'auth' | 'print' | 'printing-success' | 'help';

export type LanguageCode = 'ko' | 'en' | 'zh';

export interface TranslationSet {
  welcomeTitle: string;
  welcomeSubtitle: string;
  chooseService: string;
  printPrescription: string;
  payMedicalBill: string;
  notImplemented: string;
  kioskNotice: string;
  securityNotice: string;
  accessibilityNotice: string;
  timeoutWarning: string;
  timeoutDescription: string;
  timeoutReset: string;
  timeoutHome: string;
  
  // Auth step
  authTitle: string;
  authSubtitle: string;
  backBtn: string;
  homeBtn: string;
  labelName: string;
  labelResidentNum: string;
  placeholderName: string;
  placeholderResidentFirst: string;
  placeholderResidentLast: string;
  privacyAgreement: string;
  privacyReq: string;
  confirmBtn: string;
  errorPrivacy: string;
  errorNotFound: string;
  errorSsnLength: string;

  // Print step
  printTitle: string;
  printSubtitle: string;
  colDate: string;
  colDept: string;
  colDoctor: string;
  statusPrinted: string;
  copiesLabel: string;
  copiesLimit: string;
  btnPrintCommand: string;
  
  // Printing loading
  printingTitle: string;
  printingWait: string;
  printingDone: string;
}
