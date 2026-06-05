/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { 
  Printer, 
  CreditCard, 
  Globe, 
  ShieldAlert, 
  Check, 
  ChevronLeft, 
  Home, 
  Plus, 
  Minus, 
  RotateCcw, 
  UserCheck, 
  FileText, 
  Database, 
  ChevronRight, 
  Settings, 
  Clock, 
  X, 
  Bell, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Flame,
  ArrowRight,
  Hospital,
  Activity,
  Search,
  Hash,
  HelpCircle
} from 'lucide-react';
import { Patient, Prescription, AppStep, LanguageCode } from './types';
import { translations } from './translations';

const koreanAlphabetKeys = [
  'ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ',
  'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ',
  'ㅍ', 'ㅎ', 'ㅏ', 'ㅓ', 'ㅗ', 'ㅜ',
  'ㅡ', 'ㅣ', 'ㅑ', 'ㅕ', 'ㅛ', 'ㅠ',
  'ㅐ', 'ㅔ', 'SPACE', 'DELETE'
];

const numericKeys = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  'DELETE', '0', ' '
];

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [lang, setLang] = useState<LanguageCode>('ko');
  const [step, setStep] = useState<AppStep>('home');
  
  // Patient Database simulation (initially seeded, can be customized in admin panel)
  const initialPatients: Patient[] = [
    {
      id: 'P001',
      name: '홍길동',
      residentFirst: '850101',
      residentLast: '1234567',
      prescriptions: [
        { id: 'RX-101', date: getTodayDateString(), department: '내과', doctor: '김OO 의사', printed: false, checkedByDefault: true, hospitalName: '보행병원' },
        { id: 'RX-100', date: '2026-05-20', department: '이비인후과', doctor: '이OO 의사', printed: true, checkedByDefault: false, hospitalName: '보행병원' }
      ]
    },
    {
      id: 'P002',
      name: '김민준',
      residentFirst: '920315',
      residentLast: '1058291',
      prescriptions: [
        { id: 'RX-201', date: '2026-05-31', department: '소아청소년과', doctor: '박민수 부장', printed: false, checkedByDefault: true, hospitalName: '보행병원' },
        { id: 'RX-202', date: '2026-05-31', department: '정형외과', doctor: '이성민 과장', printed: false, checkedByDefault: true, hospitalName: '보행병원' },
        { id: 'RX-200', date: '2026-05-15', department: '안과', doctor: '최지우 과장', printed: true, checkedByDefault: false, hospitalName: '보행병원' }
      ]
    },
    {
      id: 'P003',
      name: '박서연',
      residentFirst: '781105',
      residentLast: '2084931',
      prescriptions: [
        { id: 'RX-301', date: '2026-05-31', department: '산부인과', doctor: '강선희 과장', printed: false, checkedByDefault: true, hospitalName: '보행병원' },
        { id: 'RX-300', date: '2026-05-29', department: '피부과', doctor: '정은우 대리', printed: true, checkedByDefault: false, hospitalName: '보행병원' }
      ]
    },
    {
      id: 'P004',
      name: '이영희',
      residentFirst: '530822',
      residentLast: '2942485',
      prescriptions: [
        { id: 'RX-401', date: '2026-05-31', department: '신경과', doctor: '한재석 주임', printed: false, checkedByDefault: true, hospitalName: '보행병원' },
        { id: 'RX-400', date: '2026-05-10', department: '가정의학과', doctor: '임윤아 과장', printed: true, checkedByDefault: false, hospitalName: '보행병원' }
      ]
    }
  ];

  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('kiosk_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Patient[];
        return parsed.map(patient => {
          if (patient.id === 'P001') {
            return {
              ...patient,
              prescriptions: patient.prescriptions.map(rx => {
                let updatedDoctor = rx.doctor;
                if (rx.doctor === '김민수 과장') updatedDoctor = '김OO 의사';
                if (rx.doctor === '이영진 주임') updatedDoctor = '이OO 의사';
                
                let updatedDate = rx.date;
                if (rx.id === 'RX-101') {
                  updatedDate = getTodayDateString();
                }

                return { 
                  ...rx, 
                  doctor: updatedDoctor,
                  date: updatedDate
                };
              })
            };
          }
          return patient;
        });
      } catch (e) {
        return initialPatients;
      }
    }
    return initialPatients;
  });

  // Keep patients synced with localStorage
  useEffect(() => {
    localStorage.setItem('kiosk_patients', JSON.stringify(patients));
  }, [patients]);

  // Auth Inputs
  const [inputName, setInputName] = useState('');
  const [inputResidentFirst, setInputResidentFirst] = useState('');
  const [inputResidentLast, setInputResidentLast] = useState('');
  const [isPrivacyAgreed, setIsPrivacyAgreed] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedSimPatientId, setSelectedSimPatientId] = useState('P001');
  
  // Interactive Validation feedback
  const [validationError, setValidationError] = useState('');
  const [activeFocusedField, setActiveFocusedField] = useState<'name' | 'residentFirst' | 'residentLast' | null>(null);

  // Authenticated Patient state
  const [loggedInPatient, setLoggedInPatient] = useState<Patient | null>(null);
  
  // Selection logic for prescriptions
  const [selectedPrescriptIds, setSelectedPrescriptIds] = useState<Record<string, boolean>>({});
  const [printCopies, setPrintCopies] = useState(1);
  const [printingProgress, setPrintingProgress] = useState(0);
  const [printingStatusText, setPrintingStatusText] = useState('');
  const [justPrintedPrescriptions, setJustPrintedPrescriptions] = useState<Prescription[]>([]);
  const [showActivePrintedDocument, setShowActivePrintedDocument] = useState<Prescription | null>(null);

  // Timeout logic
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(10);
  const [isFastTimeoutEnabled, setIsFastTimeoutEnabled] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const timeoutLimit = isFastTimeoutEnabled ? 10 : 60;

  // Language Menu dropdown toggler
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Help modal toggler
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Administration side panel toggle
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Add Custom Patient Form State
  const [adminAddName, setAdminAddName] = useState('');
  const [adminAddBirth, setAdminAddBirth] = useState('');
  const [adminAddSsnLast, setAdminAddSsnLast] = useState('');
  const [adminAddDept, setAdminAddDept] = useState('내과');
  const [adminAddDoctor, setAdminAddDoctor] = useState('박준기 원장');

  // Load language localizations
  const t = translations[lang];

  // --- AUDIO FEEDBACK / NOTIFICATION CLICKS ---
  const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.08) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context block safety
    }
  };

  // --- RESET TIMOUT ON ACTIVITY ---
  const resetTimer = () => {
    setSecondsLeft(timeoutLimit);
    setShowTimeoutWarning(false);
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      // Reset timer on any screen interaction
      resetTimer();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [timeoutLimit]);

  // Clock Countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (step === 'home' || step === 'printing-success') {
          // No timer on primary welcoming home screen or during active printing to reduce anxiety/interruption
          return timeoutLimit;
        }
        
        if (prev <= 1) {
          // Auto Logout
          setStep('home');
          setInputName('');
          setInputResidentFirst('');
          setInputResidentLast('');
          setIsPrivacyAgreed(false);
          setValidationError('');
          setLoggedInPatient(null);
          setShowTimeoutWarning(false);
          playBeep(220, 'triangle', 0.5);
          
          // Reset prescription printed states so we can reprint, but keep initially printed ones as already printed
          setPatients(prevPatients => {
            return prevPatients.map(p => ({
              ...p,
              prescriptions: p.prescriptions.map(rx => ({
                ...rx,
                printed: rx.id.endsWith('00') ? true : false
              }))
            }));
          });

          return timeoutLimit;
        }

        // Show warning at under 15 seconds (or 4 seconds in fast timeout)
        const warningThreshold = isFastTimeoutEnabled ? 4 : 15;
        if (prev - 1 <= warningThreshold) {
          setShowTimeoutWarning(true);
          playBeep(prev % 2 === 0 ? 880 : 700, 'sine', 0.04);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, isFastTimeoutEnabled, timeoutLimit]);

  // Auto termination countdown timer when printing is completed
  useEffect(() => {
    let timer: any = null;
    if (step === 'printing-success' && printingProgress === 100) {
      setAutoCloseSeconds(10);
      timer = setInterval(() => {
        setAutoCloseSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigateTo('home');
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setAutoCloseSeconds(10);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, printingProgress]);

  // Auto-focus move from Resident First to Resident Last
  useEffect(() => {
    if (inputResidentFirst.length === 6 && activeFocusedField === 'residentFirst') {
      setActiveFocusedField('residentLast');
      playBeep(600, 'sine', 0.05);
    }
  }, [inputResidentFirst, activeFocusedField]);

  // --- TRANSITIONS ---
  const navigateTo = (newStep: AppStep) => {
    playBeep(523.25, 'sine', 0.1); // C5 note
    setStep(newStep);
    resetTimer();
    setValidationError('');
    
    if (newStep === 'auth') {
      setActiveFocusedField('name');
    }
    
    if (newStep === 'home') {
      // Clear logged in
      setInputName('');
      setInputResidentFirst('');
      setInputResidentLast('');
      setIsPrivacyAgreed(false);
      setLoggedInPatient(null);
      setPrintCopies(1);

      // Reset prescription printed states so we can reprint, but keep initially printed ones as already printed
      setPatients(prevPatients => {
        return prevPatients.map(p => ({
          ...p,
          prescriptions: p.prescriptions.map(rx => ({
            ...rx,
            printed: rx.id.endsWith('00') ? true : false
          }))
        }));
      });
    }
  };

  // Select/Deselect Prescription handler
  const togglePrescriptionSelect = (rxId: string) => {
    playBeep(400, 'sine', 0.05);
    setSelectedPrescriptIds(prev => ({
      ...prev,
      [rxId]: !prev[rxId]
    }));
  };

  // Adjust copies logic with limits
  const adjustCopies = (amount: number) => {
    const nextVal = printCopies + amount;
    if (nextVal >= 1 && nextVal <= 2) {
      playBeep(480, 'sine', 0.06);
      setPrintCopies(nextVal);
    } else {
      playBeep(180, 'sawtooth', 0.1); // Out of boundary warning sound
    }
  };

  // --- IDENTITY VERIFICATION ACTION ---
  const handleAuthSubmit = () => {
    if (!isPrivacyAgreed) {
      setValidationError(t.errorPrivacy);
      playBeep(250, 'sawtooth', 0.25);
      return;
    }

    if (!inputName.trim()) {
      setValidationError(lang === 'ko' ? '환자 이름을 입력해 주세요.' : 'Please enter patient name.');
      playBeep(250, 'sawtooth', 0.25);
      return;
    }

    if (inputResidentFirst.length < 6 || inputResidentLast.length < 7) {
      setValidationError(t.errorSsnLength);
      playBeep(250, 'sawtooth', 0.25);
      return;
    }

    // Attempt matching in simulated patient DB
    const cleanInputName = inputName.trim();
    const matched = patients.find(p => 
      p.name.toLowerCase() === cleanInputName.toLowerCase() &&
      p.residentFirst === inputResidentFirst &&
      p.residentLast === inputResidentLast
    );

    if (matched) {
      // Successful login
      setLoggedInPatient({ ...matched });
      
      // Auto pre-select unprinted prescriptions
      const initialSelection: Record<string, boolean> = {};
      matched.prescriptions.forEach(p => {
        if (!p.printed) {
          initialSelection[p.id] = true;
        }
      });
      setSelectedPrescriptIds(initialSelection);
      
      playBeep(880, 'sine', 0.15);
      setTimeout(() => playBeep(1200, 'sine', 0.15), 100);
      setValidationError('');
      setStep('print');
      resetTimer();
    } else {
      // No patient found error
      setValidationError(t.errorNotFound);
      playBeep(180, 'sawtooth', 0.3);
    }
  };

  // --- PRINT COMMAND SIMULATION ---
  const handlePrintStart = () => {
    // Collect active checked items
    if (!loggedInPatient) return;

    const checkedRx = loggedInPatient.prescriptions.filter(rx => selectedPrescriptIds[rx.id]);
    if (checkedRx.length === 0) {
      setValidationError(lang === 'ko' ? '인쇄할 처방전을 하나 이상 선택해 주세요.' : 'Please select at least one prescription to print.');
      playBeep(200, 'sawtooth', 0.2);
      return;
    }

    playBeep(659.25, 'sine', 0.1); // E5
    setValidationError('');
    setStep('printing-success');
    setJustPrintedPrescriptions(checkedRx);
    setPrintingProgress(0);
    
    // Simulate real thermal high-speed laser printing state machine
    let currentProgress = 0;
    const totalDuration = 50000; // 50 seconds printing visual cue as requested
    const intervalTime = 100;
    const stepIncrement = 100 / (totalDuration / intervalTime);

    const interval = setInterval(() => {
      currentProgress += stepIncrement;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setPrintingProgress(100);
        setPrintingStatusText(t.printingDone);
        playBeep(1046.50, 'sine', 0.2); // C6 sound chord
        
        // Update prescription 'printed' status in database
        setPatients(prevPatients => {
          return prevPatients.map(p => {
            if (p.id === loggedInPatient.id) {
              const updatedRx = p.prescriptions.map(rx => {
                if (selectedPrescriptIds[rx.id]) {
                  return { ...rx, printed: rx.department === '내과' ? false : true };
                }
                return rx;
              });
              return { ...p, prescriptions: updatedRx };
            }
            return p;
          });
        });

        // Update active loggedIn patient too
        setLoggedInPatient(prev => {
          if (!prev) return null;
          return {
            ...prev,
            prescriptions: prev.prescriptions.map(rx => {
              if (selectedPrescriptIds[rx.id]) {
                return { ...rx, printed: rx.department === '내과' ? false : true };
              }
              return rx;
            })
          };
        });

      } else {
        setPrintingProgress(Math.min(currentProgress, 99));
        // Dynamic labels corresponding to printing status
        if (currentProgress < 30) {
          setPrintingStatusText(lang === 'ko' ? '처방전 정보를 암호화 승인 통신 중...' : 'Encrypting and connecting with medical cloud...');
        } else if (currentProgress < 75) {
          setPrintingStatusText(lang === 'ko' ? `처방전 출력 장치 구동 중 (${printCopies}부 인쇄)` : `Laser thermal printing in progress (${printCopies} copies)`);
        } else {
          setPrintingStatusText(lang === 'ko' ? '도장 날인 및 종이 커팅 처리 중...' : 'Applying official seal and cutting papers...');
        }
        
        if (Math.floor(currentProgress) % 8 === 0) {
          playBeep(1500, 'sine', 0.02); // Laser printing fast squeak noise
        }
      }
    }, intervalTime);
  };

  // ID Card insertion trigger
  const handleInsertIDCard = (p: Patient) => {
    if (isScanning) return;
    if (!isPrivacyAgreed) {
      setValidationError(lang === 'ko' ? '개인정보 수집 및 활용 동의에 체크해 주셔야 신분증 인식이 가능합니다.' : 'Please agree to the privacy policy to scan your ID.');
      playBeep(250, 'sawtooth', 0.25);
      return;
    }
    setValidationError('');
    setIsScanning(true);
    setScanProgress(0);
    
    // Play card insertion mechanical beep sequence
    playBeep(600, 'sine', 0.1);
    setTimeout(() => playBeep(750, 'sine', 0.1), 120);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 2;
      setScanProgress(currentProgress);
      if (currentProgress % 10 === 0) {
        playBeep(1000 + currentProgress * 4, 'sine', 0.02);
      }
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          setLoggedInPatient({ ...p });
          
          // Auto pre-select unprinted prescriptions
          const initialSelection: Record<string, boolean> = {};
          p.prescriptions.forEach(rx => {
            if (!rx.printed) {
              initialSelection[rx.id] = true;
            }
          });
          setSelectedPrescriptIds(initialSelection);
          
          playBeep(880, 'sine', 0.15);
          setTimeout(() => playBeep(1200, 'sine', 0.15), 100);
          setStep('print');
          resetTimer();
        }, 150);
      }
    }, 60);
  };

  // Auto-Fill helper for reviewers / testers
  const handleAutoFill = (testerPat: Patient) => {
    setInputName(testerPat.name);
    setInputResidentFirst(testerPat.residentFirst);
    setInputResidentLast(testerPat.residentLast);
    setIsPrivacyAgreed(true);
    setValidationError('');
    playBeep(700, 'sine', 0.1);
  };

  // Add Custom Patient Action (Inspector Panel)
  const handleAddCustomPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAddName.trim() || adminAddBirth.length !== 6 || adminAddSsnLast.length !== 7) {
      alert('올바른 환자 정보(이름 및 주민번호)를 작성해 주세요.');
      return;
    }

    const newPatId = 'P' + (patients.length + 1).toString().padStart(3, '0');
    const newPatient: Patient = {
      id: newPatId,
      name: adminAddName.trim(),
      residentFirst: adminAddBirth,
      residentLast: adminAddSsnLast,
      prescriptions: [
        {
          id: `RX-${Math.floor(Math.random() * 900) + 100}`,
          date: getTodayDateString(),
          department: adminAddDept,
          doctor: adminAddDoctor,
          printed: false,
          checkedByDefault: true,
          hospitalName: '보행병원'
        }
      ]
    };

    setPatients(prev => [...prev, newPatient]);
    setAdminAddName('');
    setAdminAddBirth('');
    setAdminAddSsnLast('');
    playBeep(900, 'sine', 0.15);
    alert(`새 환자 [${newPatient.name}] 등록 완료! 아래 테스터 패널에서 간편 자동입력 버튼을 사용할 수 있습니다.`);
  };

  // Reset print status
  const handleResetDatabase = () => {
    localStorage.removeItem('kiosk_patients');
    setPatients(initialPatients);
    if (loggedInPatient) {
      setLoggedInPatient(initialPatients.find(p => p.id === loggedInPatient.id) || null);
    }
    playBeep(440, 'triangle', 0.2);
  };

  // --- CUSTOM DIGITAL TOUCH KEYPAD LAYOUT ---
  const handleVirtualKeyPress = (val: string) => {
    playBeep(450, 'sine', 0.05);
    if (activeFocusedField === 'name') {
      if (val === 'DELETE') {
        setInputName(prev => prev.slice(0, -1));
      } else if (val === 'SPACE') {
        setInputName(prev => prev + ' ');
      } else {
        if (inputName.length < 15) {
          setInputName(prev => prev + val);
        }
      }
    } else if (activeFocusedField === 'residentFirst') {
      if (val === 'DELETE') {
        setInputResidentFirst(prev => prev.slice(0, -1));
      } else if (/^[0-9]$/.test(val)) {
        if (inputResidentFirst.length < 6) {
          setInputResidentFirst(prev => prev + val);
        }
      }
    } else if (activeFocusedField === 'residentLast') {
      if (val === 'DELETE') {
        setInputResidentLast(prev => prev.slice(0, -1));
      } else if (/^[0-9]$/.test(val)) {
        if (inputResidentLast.length < 7) {
          setInputResidentLast(prev => prev + val);
        }
      }
    }
  };

  return (
    <div id="full_app_container" className="min-h-screen bg-[#f1f5f9] text-slate-800 flex items-center justify-center relative p-2 md:p-6 overflow-x-hidden">
      <div id="simulated_kiosk_enclosure" className="flex-1 bg-slate-200/50 p-4 md:p-8 flex items-center justify-center relative">
        
        {/* Physical outer structure of the kiosk console */}
        <div id="kiosk_case" className="w-full max-w-[1240px] bg-white rounded-[24px] border-4 border-slate-300 shadow-[0_20px_50px_-10px_rgba(30,41,59,0.15)] overflow-hidden flex flex-col min-h-[580px] max-h-[820px]">
          
          {/* Header of the physical kiosk screen */}
          <div id="kiosk_header" className="bg-white p-4 md:p-5 border-b border-slate-200 text-slate-800 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-tight">
                  {lang === 'ko' ? '보행병원' : 'BOHAENG HOSPITAL'}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-bold tracking-tight mt-0.5">
                  {lang === 'ko' ? '처방전 출력 시스템' : 'Prescription Printing Station'}
                </p>
              </div>
            </div>

            {/* Language Selector and Session Timer in header */}
            <div className="flex items-center gap-3">
              
              {/* Timeout clock if not on index screen */}
              {step !== 'home' && (
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black transition-all ${
                    secondsLeft <= 15 ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  onClick={resetTimer}
                  title="세션 연장"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {lang === 'ko' ? '안전 세션' : 'Session'} {secondsLeft}초
                  </span>
                </div>
              )}

              {/* Multilingual Selection Button */}
              <div className="relative">
                <button
                  id="language_dropdown_btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLangMenu(!showLangMenu);
                    playBeep(450, 'sine', 0.05);
                  }}
                  className="bg-white hover:bg-slate-50 border border-slate-350 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:border-slate-400 transition shadow-sm cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {lang === 'ko' ? '한국어' : lang === 'en' ? 'English' : '中文'}
                  </span>
                  <span className="text-[11px] text-slate-400">▼</span>
                </button>

                {/* Dropdown list */}
                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 font-bold">
                    {(['ko', 'en', 'zh'] as LanguageCode[]).map((langItem) => (
                      <button
                        key={langItem}
                        onClick={() => {
                          setLang(langItem);
                          setShowLangMenu(false);
                          playBeep(520, 'sine', 0.08);
                        }}
                        className={`w-full text-left px-5 py-3 text-sm font-bold hover:bg-slate-50 hover:text-blue-600 transition block ${
                          lang === langItem ? 'text-blue-600 bg-blue-50 font-extrabold' : 'text-slate-750'
                        }`}
                      >
                        {langItem === 'ko' ? '한국어 (KR)' : langItem === 'en' ? 'English (US)' : '简体中文 (CN)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ==========================================
              KIOSK SCREEN INNER BODY (SCROLLABLE OR STRETCH)
              ========================================== */}
          <div id="kiosk_screen_viewport" className="flex-1 bg-slate-50 p-4 md:p-6 overflow-y-auto flex flex-col justify-between relative min-h-[460px] text-slate-800">
            
            {/* -------------------------------------
                STEP 1: HOME/WELCOME SCREEN
                ------------------------------------- */}
            {step === 'home' && (
               <div id="step_home" className="flex-1 flex flex-col justify-between py-2 space-y-4 select-none">
                
                {/* Clean, Elegant Welcome Greeting */}
                <div className="text-center space-y-2 pt-6 pb-6">
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-snug">
                    {lang === 'ko' ? '안녕하세요, 보행병원입니다' : lang === 'en' ? 'Welcome to Bohaeng Hospital' : '您好，欢迎光临步行医院'}
                  </h2>
                </div>

                {/* Grid of Two Distinctive Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full items-stretch pb-1">
                  
                  {/* 처방전 출력 - MAIN HIGH INTEGRITY CARD */}
                  <button
                    id="btn_print_prescription"
                    onClick={() => navigateTo('auth')}
                    className="group relative bg-[#e9f2fc] border-2 border-[#0060ad] p-6 md:p-8 rounded-[28px] text-center shadow-sm hover:shadow-md hover:bg-[#deebfb] active:scale-[0.98] transform transition-all duration-200 select-none cursor-pointer flex flex-col items-center justify-center min-h-[220px] md:min-h-[250px]"
                  >
                    
                    {/* SVG File / Document list icon inside solid blue square */}
                    <div className="w-16 h-16 bg-[#0060ad] rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform duration-200 shadow-md">
                      <FileText className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-1.5 mb-2">
                      <h3 className="text-2xl md:text-3xl font-black text-[#0060ad] tracking-tight">
                        {lang === 'ko' ? '처방전 출력' : lang === 'en' ? 'Print Prescription' : '处方单/处方笺打印'}
                      </h3>
                      <p className="text-slate-650 font-extrabold text-sm leading-relaxed max-w-[260px] mx-auto mt-1">
                        {lang === 'ko' 
                           ? '진료 후 처방전을 출력합니다' 
                           : lang === 'en' 
                             ? 'Print prescriptions after consultation' 
                             : '诊疗服务完成后自助打印处方笺'}
                      </p>
                    </div>

                  </button>

                  {/* 도움말 - SECONDARY INFORMATION CARD */}
                  <button
                    id="btn_show_help_guide"
                    onClick={() => navigateTo('help')}
                    className="group bg-white border border-slate-200 p-6 md:p-8 rounded-[28px] text-center hover:border-slate-350 shadow-sm hover:shadow-md hover:bg-slate-50/70 active:scale-[0.98] transform transition-all duration-200 select-none flex flex-col items-center justify-center min-h-[220px] md:min-h-[250px] cursor-pointer"
                  >
                    
                    {/* Light-gray square with question icon */}
                    <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 mb-4 group-hover:scale-105 transition-transform duration-200 shadow-tiny">
                      <HelpCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight group-hover:text-slate-900 transition-colors">
                        {lang === 'ko' ? '도움말' : lang === 'en' ? 'Help Guide' : '使用帮助'}
                      </h3>
                      <p className="text-slate-500 font-bold text-sm leading-relaxed max-w-[245px] mx-auto mt-1">
                        {lang === 'ko' ? '사용 안내를 확인합니다' : lang === 'en' ? 'View operating instructions' : '查看自助机使用说明'}
                      </p>
                    </div>

                  </button>

                </div>

                {/* Bottom announcement banner (matches user image layout perfectly) */}
                <div className="bg-slate-100 p-2.5 md:p-3.5 rounded-xl border border-slate-200 text-slate-705 font-bold flex items-center justify-center gap-2.5 max-w-4xl mx-auto w-full mt-2 select-none animate-fade-in shadow-3xs">
                  <span className="text-[#0060ad] font-black tracking-wider text-xs md:text-sm">
                    {lang === 'ko' ? '안내' : lang === 'en' ? 'INFO' : '提示'}
                  </span>
                  <span className="text-slate-300 font-normal">|</span>
                  <p className="text-xs md:text-sm text-slate-700 font-extrabold">
                    {lang === 'ko' 
                      ? '처방전 출력 시 본인 인증이 필요합니다' 
                      : lang === 'en' 
                        ? 'Identity verification is required when printing prescriptions' 
                        : '打印处方笺时需要进行本人的身份验证'}
                  </p>
                </div>

              </div>
            )}

            {/* -------------------------------------
                STEP 2: AUTHENTICATION (ID CARD INSERTION BASED)
                ------------------------------------- */}
            {step === 'auth' && (
              <div id="step_auth" className="flex-1 flex flex-col justify-between space-y-4">
                
                {/* Navigation Breadcrumbs */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 select-none">
                  <button
                    onClick={() => navigateTo('home')}
                    className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 px-4 py-2 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 border border-slate-300 transition shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t.backBtn}
                  </button>
                  <span className="text-xs text-slate-650 font-bold uppercase tracking-wider">
                    [ 2 / 3 단계 ] 본인 인증 및 동의
                  </span>
                  <button
                    onClick={() => navigateTo('home')}
                    className="bg-rose-100 hover:bg-rose-200 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Home className="w-4 h-4" /> {t.homeBtn}
                  </button>
                </div>

                {/* Main Kiosk Interface Container (Double column layout for wide display support) */}
                <div className="flex-1 flex items-center justify-center py-2 w-full">
                  <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-[24px] p-4 md:p-5 space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
                    
                    {/* Top Accent Graphic */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0060ad] to-[#00a8e8]" />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch w-full">
                      
                      {/* LEFT COLUMN: Personal Data Consent & Review Window */}
                      <div className="lg:col-span-5 bg-slate-50 border border-slate-200 p-4 rounded-[20px] flex flex-col justify-between space-y-3 select-none">
                        <div className="space-y-2">
                          <h4 className="text-sm md:text-base font-black text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-200 pb-2">
                            <span className="p-1 bg-[#e9f2fc] text-[#0060ad] rounded-lg">
                              <UserCheck className="w-4.5 h-4.5" />
                            </span>
                            {lang === 'ko' ? '개인정보 수집 및 활용 동의' : lang === 'en' ? 'Privacy Consent Policy' : '隐私收集与使用同意'}
                          </h4>
                          <p className="text-sm text-slate-700 font-bold leading-normal">
                            {lang === 'ko' 
                              ? '의료법 및 개인정보보호법에 의거하여 당일 처방 조회를 위해 동의가 필수적으로 요구되는 조항입니다.' 
                              : 'Pursuant to Medical Law, consent is required for real-time prescription eligibility matching.'}
                          </p>

                          {/* Scrollable Privacy Terms Block */}
                          <div className="w-full h-24 overflow-y-auto bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 leading-relaxed font-semibold space-y-1.5 select-none scrollbar-thin">
                            {lang === 'ko' ? (
                              <>
                                <p className="font-extrabold text-slate-850">■ 수집 및 이용하는 개인정보 항목</p>
                                <p className="text-slate-600 pl-1.5">- 목적: 본인식별 대조 및 처방정보 실시간 중계</p>
                                <p className="text-[#0060ad] pl-1.5 font-bold">- 수집항목: 성명, 주민등록번호(판독 후 즉각 소멸)</p>
                                
                                <p className="font-extrabold text-slate-850 mt-1.5">■ 개인정보 보유 및 이용 기간</p>
                                <p className="text-rose-600 pl-1.5 font-bold">- 보유기한: 본인 식별 후 원클릭 발급 즉시 영구 파괴</p>
                                <p className="text-slate-500 pl-1.5 text-xs leading-tight">(저희 시스템은 어떠한 환자 신분증 데이터도 클라우드나 로그 디렉토리에 보존하지 않습니다.)</p>

                                <p className="font-extrabold text-slate-850 mt-1.5">■ 동의를 거부할 권리 및 제한</p>
                                <p className="text-slate-600 pl-1.5">- 환자분은 본 동의를 거부하실 수 있으나, 미동의 시 의료정보 연계가 불가능하여 무인기 출력이 중단됩니다.</p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-slate-800">1. Purpose of Data Utility</p>
                                <p className="pl-1.5">- Instant identity matching & prescription fetch.</p>
                                <p className="font-bold text-slate-800 mt-1.5">2. Processing Items</p>
                                <p className="pl-1.5">- Full Name, Identity details (instant dump).</p>
                                <p className="font-bold text-slate-800 mt-1.5">3. Storage Retention</p>
                                <p className="text-rose-600 font-bold pl-1.5">- Destroyed instantly upon session clearance.</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Interactive toggle switch styled card */}
                        <button
                          type="button"
                          id="privacy_checkbox_toggle"
                          onClick={() => {
                            playBeep(400, 'sine', 0.05);
                            setIsPrivacyAgreed(!isPrivacyAgreed);
                          }}
                          className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-150 select-none cursor-pointer flex items-center gap-2.5 ${
                            isPrivacyAgreed 
                              ? 'bg-[#e9f2fc] border-[#0060ad] text-[#0060ad] shadow-xs' 
                              : 'bg-white border-slate-300 hover:border-slate-400 text-slate-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                            isPrivacyAgreed 
                              ? 'bg-[#0060ad] border-[#0060ad] text-white' 
                              : 'bg-white border-slate-300'
                          }`}>
                            <Check className={`w-3 h-3 stroke-[3.5] transition-transform ${isPrivacyAgreed ? 'scale-100' : 'scale-0'}`} />
                          </div>
                          <div>
                            <span className="text-sm md:text-base font-black block tracking-tight">
                              {lang === 'ko' ? '동의합니다 (필수)' : 'I Agree (Required)'}
                            </span>
                            <span className="text-sm text-[#0060ad] font-black block">
                              {lang === 'ko' ? '위 약관을 모두 읽고 동의에 승인합니다.' : 'Understand data protection.'}
                            </span>
                          </div>
                        </button>
                      </div>

                      {/* RIGHT COLUMN: ID Reader simulation box & verification triggers */}
                      <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                        
                        <div className="space-y-3.5 text-center">
                          {/* Top mini graphic indicator */}
                          <div className="w-12 h-12 rounded-full bg-blue-50/80 border border-blue-100 flex items-center justify-center mx-auto text-[#0060ad] shadow-xs select-none">
                            <CreditCard className="w-6 h-6" />
                          </div>

                          <div className="space-y-1 select-none animate-fade-in">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                              {lang === 'ko' ? '신분증을 투입해 주세요' : 'Please Insert ID Card'}
                            </h3>
                            <p className="text-sm md:text-base text-[#0060ad] font-black">
                              {lang === 'ko' ? '광학 판독기에서 신분증 인식을 대기하고 있습니다' : 'The scanner peripheral is ready to read'}
                            </p>
                          </div>

                          {/* Optical scanner tray simulation graphic */}
                          <div className="min-h-36 bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative overflow-hidden select-none">
                            {isScanning ? (
                              <div className="absolute inset-0 bg-blue-50/90 flex flex-col items-center justify-center p-3 z-10">
                                <div 
                                  style={{ height: '3px', top: `${scanProgress}%` }}
                                  className="absolute left-0 right-0 bg-[#0060ad] shadow-[0_0_12px_#0060ad] transition-all duration-100"
                                />
                                <div className="text-4xl font-black text-[#0060ad] font-mono tracking-tighter mb-1 select-none">
                                  {scanProgress}%
                                </div>
                                <span className="text-xs font-black text-[#0060ad] animate-pulse flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-[#0060ad] inline-block animate-ping"></span>
                                  {lang === 'ko' ? '성명 및 주민번호 자동 대조 판독 중...' : 'Scanning details...'}
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2 animate-fade-in">
                                <p className="text-sm md:text-base font-black text-slate-850 leading-snug">
                                  {lang === 'ko' ? '주민등록증 또는 운전면허증 투입' : 'Insert National Identification'}
                                </p>
                                <p className="text-sm md:text-base text-[#0060ad] font-extrabold max-w-none mx-auto leading-relaxed whitespace-nowrap">
                                  {lang === 'ko' 
                                    ? '신분증 면을 위로 하여 하단 판독기에 넣어주시기 바랍니다.' 
                                    : 'Please place your ID card face up on the scanner below.'}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Error fallback display message */}
                          {validationError && (
                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800 font-bold leading-relaxed whitespace-pre-line text-left flex items-start gap-2 select-none animate-shake">
                              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                              <span className="font-extrabold">{validationError}</span>
                            </div>
                          )}

                          {/* Guidance disclaimer card */}
                          <div className="bg-[#eefdfa] border border-[#d2f4ee] text-[#00a99d] px-4 py-2.5 rounded-xl text-sm md:text-base font-black leading-relaxed text-left flex items-start gap-1 select-none shadow-3xs">
                            <span className="font-extrabold flex-shrink-0 text-slate-900">
                              [{lang === 'ko' ? '안내' : 'INFO'}]
                            </span>
                            <p className="font-black leading-tight text-slate-700">
                              {lang === 'ko' 
                                ? '모든 신분증 정보는 1회성 판독 직후 즉각 증발하며 영구히 백업되지 않습니다.' 
                                : 'All credentials are wiped safely upon transaction session closed.'}
                            </p>
                          </div>

                        </div>

                        {/* ID card insertion trigger */}
                        <div className="pt-1">
                          <button
                            type="button"
                            id="kiosk_insert_id_demo_btn"
                            disabled={isScanning}
                            onClick={() => {
                              if (!isPrivacyAgreed) {
                                setValidationError(lang === 'ko' ? '개인정보 수집 및 활용 동의에 체크해 주셔야 신분증 인식이 가능합니다.' : 'Please agree to the privacy policy to scan your ID.');
                                playBeep(250, 'sawtooth', 0.25);
                                return;
                              }
                              
                              playBeep(450, 'sine', 0.08);
                              // Select the first demo patient record safely
                              const demoPatient = patients[0] || {
                                id: 'P001',
                                name: lang === 'ko' ? '홍길동' : 'John Doe',
                                residentFirst: '900101',
                                residentLast: '1111111',
                                prescriptions: []
                              };
                              handleInsertIDCard(demoPatient);
                            }}
                            className={`w-full bg-[#0060ad] hover:bg-[#005295] active:scale-98 text-white font-black text-sm md:text-base py-3.5 rounded-xl shadow-sm transition duration-200 text-center select-none cursor-pointer flex items-center justify-center gap-2 ${
                              isScanning ? 'opacity-40 cursor-not-allowed' : ''
                            }`}
                          >
                            {isScanning ? (
                              <>
                                <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
                                <span>{lang === 'ko' ? '본인 정보 조회 및 대조 중...' : 'Comparing details...'}</span>
                              </>
                            ) : (
                              <span>{lang === 'ko' ? '신분증 투입' : 'Insert Identifier Card (Demo)'}</span>
                            )}
                          </button>
                        </div>

                      </div>

                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* -------------------------------------
                STEP 3: PRESCRIPTION SELECTION & COPIES ADJUST
                ------------------------------------- */}
            {step === 'print' && loggedInPatient && (
              <div id="step_print" className="flex-1 flex flex-col justify-between space-y-3">
                
                {/* Navigation Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 select-none">
                  <button
                    onClick={() => navigateTo('auth')}
                    className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 px-4 py-2 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 border border-slate-300 transition shadow-sm cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t.backBtn}
                  </button>
                  <span className="text-xs text-slate-650 font-bold uppercase tracking-wider">
                    [ 3 / 3 단계 ] 처방 내역 조율
                  </span>
                  <button
                    onClick={() => navigateTo('home')}
                    className="bg-rose-100 hover:bg-rose-200 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Home className="w-4 h-4" /> {t.homeBtn}
                  </button>
                </div>

                {/* Title introduction */}
                <div className="space-y-1 mt-0.5 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#10b981] rounded-full animate-ping"></span>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                      {loggedInPatient.name} 환자님의 처방전 리스트
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 font-extrabold max-w-2xl leading-none">
                    {t.printSubtitle}
                  </p>
                </div>

                {/* Prescription lists */}
                <div className="space-y-2 max-w-3xl mx-auto w-full my-auto">
                  
                  {loggedInPatient.prescriptions.length === 0 ? (
                    <div className="p-14 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3 text-slate-600 shadow-sm">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                      <p className="font-black text-lg md:text-xl text-slate-850">출력 가능한 당일 처방 정보가 없습니다.</p>
                      <p className="text-sm text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">진료과에서 처방전 발행이 체결되지 않았거나 발급 오류일 우려가 있사오니 원무과 창구에 확인을 요망합니다.</p>
                    </div>
                  ) : (
                    loggedInPatient.prescriptions.map((rx) => {
                      const isChecked = !rx.printed && !!selectedPrescriptIds[rx.id];
                      return (
                        <div
                          key={rx.id}
                          onClick={() => {
                            if (!rx.printed) {
                              togglePrescriptionSelect(rx.id);
                            } else {
                              playBeep(200, 'sawtooth', 0.15);
                            }
                          }}
                          className={`group p-3 md:p-4 rounded-[16px] border-2 transition-all select-none cursor-pointer flex items-center justify-between ${
                            rx.printed 
                              ? 'bg-slate-100 border-slate-200 text-slate-450 cursor-not-allowed opacity-60' 
                              : isChecked
                                ? 'bg-blue-50/70 border-blue-600 shadow-[0_2px_8px_rgba(59,130,246,0.1)] text-slate-950' 
                                : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/10 shadow-3xs text-slate-800'
                          }`}
                        >
                          {/* Inner Checkbox state */}
                          <div className="flex items-center gap-5">
                            <div className="flex-shrink-0">
                              {rx.printed ? (
                                <span className="bg-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-xs md:text-sm font-black ring-1 ring-slate-300">
                                  {lang === 'ko' ? '인쇄 승인 완료' : 'Done'}
                                </span>
                              ) : isChecked ? (
                                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white border border-blue-400 shadow-sm">
                                  <Check className="w-5.5 h-5.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-white rounded-xl border-2 border-slate-300 hover:border-slate-400 group-hover:bg-slate-50 transition shadow-inner"></div>
                              )}
                            </div>

                            {/* Core details layout */}
                            <div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs md:text-sm font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 font-black">
                                  {rx.id}
                                </span>
                                <span className="font-extrabold text-sm text-blue-600">
                                  {rx.hospitalName || '보행병원'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                <span className="text-lg md:text-xl font-extrabold text-slate-850">
                                  {t.colDept} : <strong className="text-[#0060ad] font-black">{rx.department}</strong>
                                </span>
                                <span className="text-sm text-slate-300">|</span>
                                <span className="text-base text-slate-705 font-bold">
                                  {t.colDoctor} : <strong className="text-slate-900 font-extrabold">{rx.doctor}</strong>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Print status or Badge */}
                          <div className="text-right">
                            <span className="text-xs md:text-sm text-slate-550 block font-bold">
                              {t.colDate} : {rx.date}
                            </span>
                            {rx.printed ? (
                              <span className="text-xs md:text-sm text-amber-600 font-black mt-1 inline-block">
                                ({t.statusPrinted})
                              </span>
                            ) : (
                              <span className="text-xs md:text-sm text-emerald-700 font-black mt-1 inline-block bg-emerald-50 border border-emerald-100 px-3 py-0.5 rounded-full uppercase">
                                {lang === 'ko' ? '출력 대기' : 'Ready'}
                              </span>
                            )}
                          </div>

                        </div>
                      )
                    })
                  )}

                  {/* Guidance Information box instead of Print custom copies selection */}
                  <div className="bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-xl flex flex-row items-center gap-3 mt-3 shadow-3xs">
                    <div className="bg-slate-100 py-2 px-3 rounded-lg border border-slate-250 flex items-center justify-center font-black text-[#0060ad] text-xs md:text-sm min-w-[50px] h-[50px] select-none shadow-3xs flex-shrink-0">
                      {lang === 'ko' ? '안내' : lang === 'en' ? 'INFO' : '提示'}
                    </div>
                    <div className="flex-1 text-left space-y-0.5 select-none text-xs">
                      <p className="text-slate-705 font-extrabold flex items-center gap-1.5 text-xs md:text-sm">
                        <span className="text-blue-600 font-black">•</span>
                        {lang === 'ko' 
                          ? '본 기기는 약국 제출용 처방전 1부만 발행됩니다.' 
                          : lang === 'en' 
                            ? 'This device only issues one copy of the prescription for pharmacy submission.' 
                            : '本自助机仅打印一份提交药店的处方笺。'}
                      </p>
                      <p className="text-slate-705 font-extrabold flex items-center gap-1.5 text-xs md:text-sm">
                        <span className="text-blue-600 font-black">•</span>
                        {lang === 'ko' 
                          ? '환자 보관용 처방전이 필요하시다면 원무과 방문 부탁드립니다.' 
                          : lang === 'en' 
                            ? 'If you need a copy for patient storage, please visit the administration desk.' 
                            : '如需患者留存联，请前往一楼总务科。'}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Trigger start button */}
                <div className="space-y-2 pt-2 select-none">
                  {validationError && (
                    <div className="bg-rose-50 border-2 border-rose-200 p-2 rounded-lg text-center text-xs text-rose-800 font-extrabold max-w-3xl mx-auto flex items-center justify-center gap-1.5 animate-shake">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-600 flex-shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <button
                    id="btn_print_execute"
                    onClick={handlePrintStart}
                    className="w-full max-w-xl mx-auto bg-[#1e40af] hover:bg-[#1d4ed8] text-white py-3.5 rounded-xl font-black text-base md:text-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-5.5 h-5.5 animate-pulse" />
                    <span>{t.btnPrintCommand}</span>
                  </button>
                </div>

              </div>
            )}

            {/* -------------------------------------
                STEP 4: PRINT PROGRESS & SUCCESSFUL DELIVERY
                ------------------------------------- */}
            {step === 'printing-success' && (
              <div id="step_print_success" className="flex-1 flex flex-col justify-between space-y-8 animate-fade-in">
                
                {/* Upper block */}
                <div className="text-center space-y-3 my-auto py-2">
                  <div className="relative w-23 h-20 mx-auto flex items-center justify-center">
                    {/* Ring spinning loading circle (Sized dynamically) */}
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="32" 
                        stroke="#e2e8f0" 
                        strokeWidth="6" 
                        fill="transparent" 
                      />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="32" 
                        stroke="#06b6d4" 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray="201.06" 
                        strokeDashoffset={201.06 - (201.06 * printingProgress) / 100}
                        className="transition-all duration-100 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Icon indicator centered inside circle */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Printer className={`w-9 h-9 text-[#0891b2] ${printingProgress < 100 ? 'animate-bounce' : 'scale-110 transition-transform duration-300'}`} />
                    </div>
                  </div>

                  <div className="space-y-1 max-w-xl mx-auto select-none">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      {printingProgress < 100 ? t.printingTitle : t.printingDone}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-705 font-bold whitespace-pre-line leading-relaxed h-8">
                      {printingProgress < 100 ? printingStatusText : t.printingWait}
                    </p>
                  </div>

                  {/* Large Linear percentage bar */}
                  <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-3.5 border border-slate-300 overflow-hidden relative shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-100 ease-out"
                      style={{ width: `${printingProgress}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center font-black font-mono text-[10px] text-white leading-none">
                      {Math.floor(printingProgress)}%
                    </span>
                  </div>
                </div>

                {/* ==========================================
                    PHYSICAL SIMULATED PRINTER TRAY
                    ========================================== */}
                <div className="bg-white p-3.5 md:p-4.5 rounded-2xl border border-slate-250 space-y-3 max-w-2xl mx-auto w-full select-none shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-1">
                    <span className="text-xs md:text-sm font-black text-[#0060ad] flex items-center gap-1.5">
                      <FileText className="w-4.5 h-4.5 text-[#0060ad]" />
                      {lang === 'ko' ? '처방전 받는 곳 (배출구)' : 'Prescription Tray'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono font-bold tracking-wider">PRESCRIPTION OUTLET</span>
                  </div>

                  {printingProgress < 100 ? (
                    <div className="py-6 text-center text-slate-600 text-xs flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-blue-600 animate-spin"></div>
                      <p className="font-bold text-slate-750 text-slate-650">잠시만 기다리시면 인쇄물이 아래 배출구로 배출됩니다...</p>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in text-center">
                      <p className="text-sm md:text-base text-emerald-800 font-extrabold animate-pulse leading-snug">
                        {lang === 'ko' 
                          ? '처방전 인쇄 발급이 완료되었습니다. 아래 배출구에서 인쇄된 처방전 종이를 수령해 주시기 바랍니다.' 
                          : 'The printed prescription issuance has been completed! Please take the physical paper.'}
                      </p>

                      <div className="space-y-2 max-w-lg mx-auto">
                        {justPrintedPrescriptions.map((rx) => (
                          <div
                            key={rx.id}
                            className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-900 shadow-sm flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-8 h-8 text-cyan-600 flex-shrink-0" />
                              <div className="text-left">
                                <div className="font-black text-sm md:text-base tracking-tight text-slate-800">
                                  {lang === 'ko' ? '약국 제출용 및 환자 보관용 처방전' : 'Prescription Document'}
                                </div>
                                <div className="text-xs md:text-sm text-slate-500 font-extrabold mt-0.5">
                                  {lang === 'ko' 
                                    ? `진료 부서: [${rx.department}] •  의사명: ${rx.doctor} • ${printCopies}부` 
                                    : `Dept: [${rx.department}] • Dr: ${rx.doctor} • ${printCopies} copies`}
                                </div>
                              </div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1.5 rounded-lg border border-emerald-200 uppercase">
                              {lang === 'ko' ? '인쇄수령' : 'Issued'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Final End button reset to dashboard */}
                <div className="text-center pt-2 select-none space-y-2">
                  {printingProgress === 100 && (
                    <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full text-xs text-rose-700 font-bold animate-pulse shadow-3xs">
                      <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping"></span>
                      <span>{lang === 'ko' ? `${autoCloseSeconds}초 후 자동 로그아웃 및 메인 화면으로 이동합니다` : `Auto redirecting to main screen in ${autoCloseSeconds}s`}</span>
                    </div>
                  )}
                  <div>
                    <button
                      onClick={() => navigateTo('home')}
                      className="bg-slate-800 hover:bg-slate-900 border border-slate-700 text-slate-100 font-black text-xs md:text-sm px-6 py-2.5 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition active:scale-95 duration-150"
                    >
                      처음 메인 화면으로 돌아가기 (로그아웃)
                    </button>
                  </div>
                </div>

              </div>
            )}

            {step === 'help' && (
              <div id="step_help" className="flex-1 flex flex-col justify-between space-y-4">
                
                {/* Navigation Breadcrumbs */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 select-none">
                  <button
                    onClick={() => navigateTo('home')}
                    className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 px-4 py-2 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 border border-slate-300 transition shadow-sm cursor-pointer animate-fade-in"
                  >
                    <ChevronLeft className="w-4 h-4" /> {lang === 'ko' ? '이전으로' : lang === 'en' ? 'Go Back' : '返回'}
                  </button>
                  <span className="text-xs text-slate-650 font-bold uppercase tracking-wider animate-fade-in">
                    {lang === 'ko' ? '[ 도움말 ] 기기 이용 방법 안내' : lang === 'en' ? '[ Help Guide ] Kiosk Instructions' : '[ 帮助指南 ] 自助机使用说明'}
                  </span>
                  <button
                    onClick={() => navigateTo('home')}
                    className="bg-rose-100 hover:bg-rose-200 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 transition shadow-sm cursor-pointer animate-fade-in"
                  >
                    <Home className="w-4 h-4" /> {lang === 'ko' ? '처음으로' : lang === 'en' ? 'Return Home' : '返回主页'}
                  </button>
                </div>

                {/* Elderly-friendly big guide content */}
                <div className="flex-1 flex flex-col justify-center py-4 w-full text-center">
                  <div className="max-w-5xl mx-auto w-full space-y-6">
                    <div className="space-y-1.5 select-none animate-fade-in">
                      <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {lang === 'ko' ? '쉽고 간단한 처방전 발급 안내' : lang === 'en' ? 'Easy Step-by-Step Guide' : '轻便的处方单自助打印流程'}
                      </h2>
                      <p className="text-sm md:text-base text-[#0060ad] font-extrabold">
                        {lang === 'ko' 
                          ? '노년층 환자분들도 아래의 4단계 순서대로 하시면 처방전을 간편하게 인쇄하실 수 있습니다.' 
                          : lang === 'en' 
                            ? 'Even senior patients can easily check and print prescriptions by following these 4 steps.'
                            : '跟随以下 4 个简单步骤，即可方便地打印今日的处方单。'}
                      </p>
                    </div>

                    {/* 4 Cards Grid - Large and easy to read */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
                      
                      {/* CARD 1 */}
                      <div className="bg-white border-2 border-slate-200 hover:border-[#0060ad] p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-250 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-blue-50 text-[#0060ad] rounded-full flex items-center justify-center font-black text-2xl border-2 border-blue-100">
                          1
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {lang === 'ko' ? '서비스 선택' : lang === 'en' ? 'Select Service' : '选择业务'}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-650 font-bold leading-relaxed">
                            {lang === 'ko' 
                              ? '첫 화면에서 크고 파란색으로 표시된 [처방전 출력] 카드를 가볍게 터치해 주세요.' 
                              : lang === 'en' 
                                ? 'Tap the large, blue [Print Prescription] action card on the main start screen.' 
                                : '在主页屏幕上轻触蓝色大字按钮 [处方笺打印]。'}
                          </p>
                        </div>
                      </div>

                      {/* CARD 2 */}
                      <div className="bg-white border-2 border-slate-200 hover:border-[#0060ad] p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-250 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-blue-50 text-[#0060ad] rounded-full flex items-center justify-center font-black text-2xl border-2 border-blue-100">
                          2
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {lang === 'ko' ? '신분증 넣기 및 동의' : lang === 'en' ? 'Insert ID' : '验证身份'}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-650 font-bold leading-relaxed">
                            {lang === 'ko' 
                              ? '개인정보 활용 수집 동의에 체크하신 뒤, 주민등록증이나 운전면허증을 판독기에 올려 주시기 바랍니다.' 
                              : lang === 'en' 
                                ? 'Agree to data guidelines, and place your ID Card or driving license on the scanner.' 
                                : '勾选收集同意后，将物理身份证或驾照平稳放于读卡器上。'}
                          </p>
                        </div>
                      </div>

                      {/* CARD 3 */}
                      <div className="bg-white border-2 border-slate-200 hover:border-[#0060ad] p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-250 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-blue-50 text-[#0060ad] rounded-full flex items-center justify-center font-black text-2xl border-2 border-blue-100">
                          3
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {lang === 'ko' ? '처방전 선택' : lang === 'en' ? 'Select Recipient' : '勾选处方'}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-650 font-bold leading-relaxed">
                            {lang === 'ko' 
                              ? '오늘 진료 기록이 조회되면 인쇄할 처방전을 누릅니다. (본 기기에서는 안전을 위해 딱 1부만 깔끔하게 출력됩니다.)' 
                              : lang === 'en' 
                                ? 'Select unprinted items. (This automated kiosk only issues exactly 1 copy of the prescription.)' 
                                : '选中要打印的处方（出于隐私和法律原因，自助打印机仅打印1份原件）。'}
                          </p>
                        </div>
                      </div>

                      {/* CARD 4 */}
                      <div className="bg-white border-2 border-slate-200 hover:border-[#0060ad] p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all duration-250 flex flex-col items-center text-center space-y-4">
                        <div className="w-14 h-14 bg-blue-50 text-[#0060ad] rounded-full flex items-center justify-center font-black text-2xl border-2 border-blue-100">
                          4
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">
                            {lang === 'ko' ? '처방전 받기 완료' : lang === 'en' ? 'Get Documents' : '取出药单'}
                          </h3>
                          <p className="text-xs md:text-sm text-slate-650 font-bold leading-relaxed">
                            {lang === 'ko' 
                              ? '[처방전 인쇄 시작] 버튼을 누르면 인쇄물이 기기 맨 하단 배출 슬롯으로 나옵니다. 종이를 꼭 챙겨가세요!' 
                              : lang === 'en' 
                                ? 'Press the print button and securely collect your paper prescriptions from the base storage slit area.' 
                                : '点击打印按钮，并在机器最低处的流出槽中持取您刚刚打印出的物理药单。'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Assist block */}
                    <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left animate-fade-in shadow-2xs select-none">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-extrabold">
                          ⓘ
                        </div>
                        <div>
                          <h4 className="font-extrabold text-[#0060ad] text-sm">
                            {lang === 'ko' ? '안내 기기에 문제가 발생하셨나요?' : lang === 'en' ? 'Need immediate support?' : '需要现场工作人员的支持吗？'}
                          </h4>
                          <p className="text-xs text-slate-550 font-bold">
                            {lang === 'ko' 
                              ? '스마트 인쇄 대기나 신분증 걸림 등 문의는 기기 옆 비상 호출벨 및 바로 근처 원무과 데스크 창구로 문의해 주세요.' 
                              : lang === 'en' 
                                ? 'For card jam or machine downtime, please click the emergency call bell next to the peripheral.' 
                                : '如果身份证读取受阻或打印机缺纸，请使用右侧呼叫按钮联络大厅服务组人员。'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigateTo('auth')}
                        className="bg-[#0060ad] hover:bg-[#005295] text-white font-black text-xs md:text-sm px-6 py-2.5 rounded-xl shadow-xs transition active:scale-95 duration-100 whitespace-nowrap cursor-pointer"
                      >
                        {lang === 'ko' ? '처방전 바로 발급하기 ▷' : lang === 'en' ? 'Start Printing Now ▷' : '立即开始打印处方 ▷'}
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>

          {showActivePrintedDocument && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col justify-between border-8 border-slate-300">
            
            {/* Header control */}
            <div className="bg-indigo-900 py-4 px-6 text-white flex items-center justify-between">
              <span className="font-extrabold text-sm flex items-center gap-1">
                <Printer className="w-4 h-4 text-emerald-400" />
                환자용 처방전 교부 / 처방 약물 상세 정보
              </span>
              <button
                onClick={() => {
                  playBeep(450, 'sine', 0.05);
                  setShowActivePrintedDocument(null);
                }}
                className="text-indigo-200 hover:text-white p-1 rounded-full hover:bg-indigo-850 cursor-pointer"
                title="닫기"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Simulated Medical prescription print document layout (Realistic White Paper document) */}
            <div className="p-6 md:p-8 bg-[#fafafa] flex-1 text-xs space-y-5 leading-normal font-sans">
              
              {/* Document Identity Title */}
              <div className="text-center border-double border-b-4 border-slate-400 pb-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-widest uppercase">처 방 전</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">PRESCRIPTION DOCUMENT (PATIENT RECEPTACLE)</p>
              </div>

              {/* Prescription identity metrics and dates */}
              <div className="grid grid-cols-2 gap-4 border-b pb-3 text-[11px]">
                <div>
                  <p><strong>발급 기관:</strong> {showActivePrintedDocument.hospitalName || '보행병원'}</p>
                  <p><strong>기관 성격:</strong> 종합 상급 의료기관</p>
                  <p><strong>요양 기관 기호:</strong> 11382942</p>
                </div>
                <div className="text-right">
                  <p><strong>처방 일자:</strong> {showActivePrintedDocument.date}</p>
                  <p><strong>처방 번호:</strong> {showActivePrintedDocument.id}</p>
                  <p><strong>교부 부수:</strong> {printCopies}부 중 제 1부</p>
                </div>
              </div>

              {/* Patient Core metrics Grid */}
              <div className="border rounded border-slate-300 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <tr className="border-b bg-slate-100">
                      <th className="p-2 border-r border-slate-300 font-bold bg-slate-200 w-24">환 자 성 명</th>
                      <td className="p-2 border-r border-slate-300 font-black text-slate-900">{loggedInPatient?.name || '홍길동'}</td>
                      <th className="p-2 border-r border-slate-300 font-bold bg-slate-200 w-24">주민번호</th>
                      <td className="p-2">{loggedInPatient?.residentFirst}-******* (남)</td>
                    </tr>
                    <tr>
                      <th className="p-2 border-r border-slate-300 font-bold bg-slate-200">진 료 과 목</th>
                      <td className="p-2 border-r border-slate-300 text-slate-800">{showActivePrintedDocument.department}</td>
                      <th className="p-2 border-r border-slate-300 font-bold bg-slate-200">주치 의료진</th>
                      <td className="p-2 text-slate-850 font-bold">{showActivePrintedDocument.doctor} (인)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Simulated Pharmaceutical medications table */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>처방 의약품 명칭 및 상세 투약 방법</span>
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">*원외 처방전 단골 약국 제출용</span>
                </div>
                
                <table className="w-full text-left border rounded border-slate-300 text-[11px] overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700">
                      <th className="p-2 font-bold border-r border-slate-300">처방 약품명/성분 규격</th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 w-16">1회량</th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 w-16 font-mono">1일 횟수</th>
                      <th className="p-2 font-bold text-center border-r border-slate-300 w-16">투여일</th>
                      <th className="p-2 font-bold">의사 용법 안내</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="p-2 font-semibold border-r border-slate-300 text-slate-900">아세트아미노펜 서방정 650mg</td>
                      <td className="p-2 border-r border-slate-300 text-center">1정</td>
                      <td className="p-2 border-r border-slate-300 text-center font-mono">3회</td>
                      <td className="p-2 border-r border-slate-300 text-center">3일</td>
                      <td className="p-2 text-slate-650 leading-tight">매 식후 30분, 따뜻한 물과 함께 경구 투약</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-semibold border-r border-slate-300 text-slate-900">레보프로프로피진 시럽 15ml</td>
                      <td className="p-2 border-r border-slate-300 text-center">1포</td>
                      <td className="p-2 border-r border-slate-300 text-center font-mono">3회</td>
                      <td className="p-2 border-r border-slate-300 text-center">3일</td>
                      <td className="p-2 text-slate-650 leading-tight">식전 30분, 기침 갈증 증상 진행 시 요량 증감 복용</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Instructions text footnotes */}
              <div className="bg-indigo-50 border border-indigo-150 p-3 rounded text-xs text-indigo-900 leading-relaxed">
                <strong>[약국제출 안내사항]</strong> <br />
                본 처방전은 국민건강보험법 규정에 따라 발급되었으며, <strong>발행 후 7일 이내</strong>에 인근 모든 지정 약국에 제출하셔야 조제가 시작됩니다. 처방 유효기간 경과 시에는 의료기관 진료과에 재내원하여 신규 승인을 받아야만 인쇄를 조달받으실 수 있습니다.
              </div>

              {/* Barcode & QR Stamp indicators block */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-dashed border-slate-300">
                
                {/* Barcode representation */}
                <div className="text-left select-none">
                  <div className="font-mono text-[14px] text-slate-950 tracking-widest select-none">
                    |||| | |||||| || | |||| |||||| ||
                  </div>
                  <span className="text-xs text-slate-550 font-mono block">MEDSEV-RX-{showActivePrintedDocument.id}</span>
                </div>

                {/* Simulated official hospital red seal stamp */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 border border-dashed border-slate-400 rounded-lg flex items-center justify-center bg-slate-100 font-mono text-xs text-slate-500">
                    QR 마크
                  </div>
                  <div className="w-16 h-16 border-4 border-double border-red-500 rounded-full flex items-center justify-center font-bold text-xs text-red-500 rotate-12 transform shadow-sm select-none">
                    <span className="text-center font-black tracking-tighter text-[10px] leading-tight">
                      보행병원<br />의료원<br />[인의]
                    </span>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer confirmation */}
            <div className="bg-slate-100 py-4 px-6 border-t border-slate-200 flex justify-between items-center select-none">
              <span className="text-slate-500 text-xs font-semibold">
                * 인쇄 출력본 확인용 (EMR 무인 전송 완료)
              </span>
              <button
                onClick={() => {
                  playBeep(1000, 'sine', 0.08);
                  setShowActivePrintedDocument(null);
                }}
                className="bg-indigo-900 hover:bg-slate-900 text-white font-extrabold text-sm px-6 py-2.5 rounded-lg shadow-md transition cursor-pointer"
              >
                닫기 및 출력 확인 완료
              </button>
            </div>

          </div>
        </div>
      )}
      {/* ==========================================
          POPUP MODAL 3: HELP GUIDE INTERSTITIAL
          ========================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 animate-fade-in">
              <span className="font-black text-lg text-slate-900 tracking-tight">
                {lang === 'ko' ? '기기 이용 방법 안내' : lang === 'en' ? 'Kiosk Operating Instructions' : '自助机使用指南'}
              </span>
              <button
                onClick={() => {
                  playBeep(450, 'sine', 0.05);
                  setShowHelpModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-slate-700 text-xs md:text-sm leading-relaxed font-semibold">
              <p className="font-extrabold text-slate-950 text-sm">
                {lang === 'ko' ? '처방전 출력을 위한 단계별 과정:' : lang === 'en' ? 'Step-by-step printing process:' : '打印处方笺的步骤如下:'}
              </p>
              
              <ol className="list-decimal pl-5 space-y-3 font-bold text-slate-600">
                <li>
                  <strong className="text-slate-900">{lang === 'ko' ? '메인 화면에서 [처방전 출력] 선택' : 'Touch [Print Prescription] Card'}</strong>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">
                    {lang === 'ko' ? '파란색 [처방전 출력] 카드를 터치하여 본인 인증 단계로 이동합니다.' : 'Initiate the workflow by selecting the primary action card.'}
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">{lang === 'ko' ? '신분증 인식 및 개인정보 동의' : 'Scan Identification Card'}</strong>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">
                    {lang === 'ko' ? '개인정보 수집 동의 체크 후, 판독기에 주민등록증 혹은 운전면허증을 올려둡니다.' : 'Check privacy consents, then place National identity card onto the optical reader.'}
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">{lang === 'ko' ? '출력 대상 처방전 및 부수 선택' : 'Select items & specify copies'}</strong>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">
                    {lang === 'ko' ? '검색된 미인쇄 처방전 내역을 확인하고, 필요한 인쇄 부수(기본 1부, 최대 2부)를 증감 버튼으로 변경합니다.' : 'Verify unprinted records issued today. Set copies to print (Up to 2 copies).'}
                  </p>
                </li>
                <li>
                  <strong className="text-slate-900">{lang === 'ko' ? '인쇄물 수령' : 'Print Completion & Retrieval'}</strong>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">
                    {lang === 'ko' ? '[인쇄 시작] 단추를 누른 뒤 잠시 대기하여 기기 최하단 배출구에서 처방전을 수령합니다.' : 'Click print, wait brief moment and safely retrieve your prescription from the tray.'}</p>
                </li>
              </ol>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  playBeep(450, 'sine', 0.05);
                  setShowHelpModal(false);
                }}
                className="bg-[#0060ad] hover:bg-[#005295] text-white font-extrabold text-sm px-6 py-2.5 rounded-lg shadow transition cursor-pointer"
              >
                {lang === 'ko' ? '확인 및 안내 닫기' : lang === 'en' ? 'Dismiss' : '关闭'}
              </button>
            </div>

          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
}
