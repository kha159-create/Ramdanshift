/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Clock,
  Calendar,
  Download,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// --- Types ---

interface Shift {
  start: string; // e.g., "11:30 am"
  end: string;   // e.g., "4:30 pm"
}

interface Employee {
  id?: string;
  name: string;
  phone?: string;
  shifts: Shift[];
}

interface OpeningShift {
  name: string;
  time: string;
  color: string;
}

interface QuickShiftTemplate {
  id: string;
  label: string;
  start: string;
  end: string;
  color: string;
}

interface Branch {
  id: string;
  name: string;
  openingShifts: OpeningShift[];
  employees: Employee[];
}

// --- Constants & Data ---

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DEFAULT_OPENING_SHIFTS: OpeningShift[] = [
  { name: 'شفت الظهر', time: '11:30 am - 5:30 pm', color: '#92D050' },
  { name: 'شفت الليل', time: '8:30 pm - 2:30 am', color: '#FFC000' },
  { name: 'شفت الفجر', time: '3:00 am - 6:00 am', color: '#00B0F0' },
];

const DEFAULT_QUICK_SHIFTS: QuickShiftTemplate[] = [
  { id: '1', label: 'صباحي (١)', start: '11:30 am', end: '5:30 pm', color: '#92D050' },
  { id: '2', label: 'مسائي (١)', start: '8:30 pm', end: '2:30 am', color: '#FFC000' },
  { id: '3', label: 'صباحي (٢)', start: '12:30 pm', end: '5:30 pm', color: '#00B0F0' },
  { id: '4', label: 'مسائي (٢)', start: '9:30 pm', end: '2:30 am', color: '#FF8C00' },
  { id: '5', label: 'كامل (١٠س)', start: '11:30 am', end: '11:30 pm', color: '#7030A0' },
  { id: '6', label: 'فجر', start: '6:00 am', end: '11:00 am', color: '#0070C0' },
];

const INITIAL_BRANCHES_DATA: Branch[] = [
  {
    id: 'alia',
    name: 'العالية مول',
    openingShifts: [...DEFAULT_OPENING_SHIFTS],
    employees: [
      { name: 'سيرين', shifts: [{ start: '1:30 pm', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
      { name: 'هناء', shifts: [{ start: '11:30 am', end: '4:30 pm' }, { start: '9:30 pm', end: '2:30 am' }] },
      { name: 'في', shifts: [{ start: '12:30 pm', end: '5:30 pm' }, { start: '8:30 pm', end: '1:30 am' }] },
      { name: 'نذير', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
      { name: 'ارشد', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
      { name: 'بدرية', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'العنود', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'شوق', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'شهد', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'مودة', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'خلود', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
    ]
  },
  {
    id: 'noor',
    name: 'النور مول',
    openingShifts: [...DEFAULT_OPENING_SHIFTS],
    employees: [
      { name: 'رويدة', shifts: [{ start: '12:30 pm', end: '5:30 pm' }, { start: '9:30 pm', end: '2:30 am' }] },
      { name: 'بسمة', shifts: [{ start: '6:00 am', end: '11:00 am' }, { start: '8:30 pm', end: '1:30 am' }] },
      { name: 'وضحة', shifts: [{ start: '6:30 am', end: '11:30 am' }, { start: '9:30 pm', end: '2:30 am' }] },
      { name: 'رهف', shifts: [{ start: '12:30 pm', end: '5:30 pm' }, { start: '9:30 pm', end: '2:30 am' }] },
      { name: 'مريم', shifts: [{ start: '11:30 am', end: '4:30 pm' }, { start: '8:30 pm', end: '1:30 am' }] },
      { name: 'ريم', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'ريماس', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
    ]
  },
  {
    id: 'yanbu',
    name: 'ينبع',
    openingShifts: [...DEFAULT_OPENING_SHIFTS],
    employees: [
      { name: 'رنيم', shifts: [{ start: '11:30 am', end: '4:30 pm' }, { start: '9:30 pm', end: '2:30 am' }] },
      { name: 'رندا', shifts: [{ start: '12:30 pm', end: '5:30 pm' }, { start: '8:30 pm', end: '1:30 am' }] },
      { name: 'وسن', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'هاجر', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'شفيق', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
    ]
  },
  {
    id: 'tabuk',
    name: 'تبوك',
    openingShifts: [...DEFAULT_OPENING_SHIFTS],
    employees: [
      { name: 'تركي', shifts: [{ start: '1:30 pm', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
      { name: 'هنادي', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '9:30 pm', end: '1:30 am' }] },
      { name: 'تاج', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
      { name: 'سيف', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
      { name: 'نورة', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'رهف', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
      { name: 'رغد', shifts: [{ start: '8:30 pm', end: '2:30 am' }] },
    ]
  },
  {
    id: 'arar',
    name: 'عرعر',
    openingShifts: [...DEFAULT_OPENING_SHIFTS],
    employees: [
      { name: 'مريم', shifts: [{ start: '11:30 am', end: '4:30 pm' }, { start: '9:30 pm', end: '2:30 am' }] },
      { name: 'امل', shifts: [{ start: '12:30 pm', end: '5:30 pm' }, { start: '8:30 pm', end: '1:30 am' }] },
      { name: 'انس', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
    ]
  },
  {
    id: 'jouf',
    name: 'الجوف',
    openingShifts: [...DEFAULT_OPENING_SHIFTS],
    employees: [
      { name: 'فهد', shifts: [{ start: '11:30 am', end: '5:30 pm' }, { start: '8:30 pm', end: '2:30 am' }] },
    ]
  }
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const period = h < 12 ? 'am' : 'pm';
    const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
    const minuteStr = m === 0 ? '00' : m.toString();
    TIME_OPTIONS.push(`${displayHour}:${minuteStr} ${period}`);
  }
}

// --- Helper Functions ---

const parseTimeToHour = (timeStr: string): number => {
  if (!timeStr) return 0;
  try {
    const parts = timeStr.toLowerCase().trim().split(/\s+/);
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    const timeParts = time.split(':');
    let hours = parseInt(timeParts[0], 10) || 0;
    const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;

    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;
    return hours + minutes / 60;
  } catch (e) {
    console.error('Error parsing time:', timeStr, e);
    return 0;
  }
};

const isHourInShift = (hour: number, shift: Shift): boolean => {
  const start = parseTimeToHour(shift.start);
  let end = parseTimeToHour(shift.end);

  // Handle shifts crossing midnight
  if (end < start) {
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
};

const getCoverageForHour = (branch: Branch, hour: number): number => {
  return branch.employees.reduce((count, emp) => {
    const isWorking = emp.shifts.some(shift => isHourInShift(hour, shift));
    return count + (isWorking ? 1 : 0);
  }, 0);
};

// --- Components ---

// --- Components ---

const getShiftColor = (shift: Shift, branch: Branch, quickShifts: QuickShiftTemplate[]) => {
  const start = shift.start.toLowerCase().trim();
  const end = shift.end.toLowerCase().trim();
  const fullTime = `${start} - ${end}`;

  // Try to match by time string in branch opening shifts
  const openingMatch = branch.openingShifts.find(s => s.time.toLowerCase().includes(start) || s.time.toLowerCase().includes(fullTime));
  if (openingMatch) return openingMatch.color;

  // Try to match by time string in quick shift templates
  const templateMatch = quickShifts.find(s =>
    (s.start.toLowerCase().trim() === start && s.end.toLowerCase().trim() === end) ||
    s.label.toLowerCase().includes(start)
  );
  if (templateMatch) return templateMatch.color;

  // Fallback to defaults
  if (start.includes('11:30 am')) return '#92D050'; // Green
  if (start.includes('12:30 pm')) return '#00B0F0'; // Blue
  if (start.includes('1:30 pm')) return '#7030A0'; // Purple
  if (start.includes('8:30 pm')) return '#FFC000'; // Yellow/Orange
  if (start.includes('9:30 pm')) return '#FF8C00'; // Dark Orange
  if (start.includes('6:00 am') || start.includes('6:30 am')) return '#0070C0'; // Dark Blue
  return '#D9D9D9'; // Gray default
};

const EmployeeSchedule = ({ branch, quickShifts, onEdit }: { branch: Branch, quickShifts: QuickShiftTemplate[], onEdit: (emp: Employee, idx: number) => void }) => {
  const tableRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full text-right border-collapse min-w-[600px]" dir="rtl">
          <thead>
            <tr className="bg-[#333333] text-white text-[11px] uppercase tracking-wider">
              <th className="px-4 py-4 border-b border-gray-600 font-bold text-center">الفرع</th>
              <th className="px-4 py-4 border-b border-gray-600 font-bold text-center">الموظف</th>
              <th className="px-4 py-4 border-b border-gray-600 font-bold text-center">الشفت الأول</th>
              <th className="px-4 py-4 border-b border-gray-600 font-bold text-center">الشفت الثاني</th>
              <th className="px-4 py-4 border-b border-gray-600 font-bold text-center">إجمالي الساعات</th>
              <th className="px-4 py-4 border-b border-gray-600 font-bold text-center print:hidden">تعديل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {branch.employees.map((emp, idx) => {
              const totalHours = emp.shifts.reduce((acc, shift) => {
                const start = parseTimeToHour(shift.start);
                let end = parseTimeToHour(shift.end);
                if (end < start) end += 24;
                return acc + (end - start);
              }, 0);

              return (
                <tr key={emp.name + idx} className="hover:bg-gray-50/50 transition-colors text-xs">
                  <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-500 text-center">{branch.name}</td>
                  <td className="px-4 py-3 border-b border-gray-100 font-bold text-gray-900 text-center">{emp.name}</td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    {emp.shifts[0] ? (
                      <div
                        className="px-3 py-1.5 rounded-full text-black font-bold text-[10px] text-center shadow-sm border border-black/5 flex items-center justify-center gap-1"
                        style={{ backgroundColor: getShiftColor(emp.shifts[0], branch, quickShifts) }}
                      >
                        <Clock size={10} className="opacity-50" />
                        {emp.shifts[0].start} - {emp.shifts[0].end}
                      </div>
                    ) : (
                      <div className="text-gray-300 text-center italic">لا يوجد</div>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    {emp.shifts[1] ? (
                      <div
                        className="px-3 py-1.5 rounded-full text-black font-bold text-[10px] text-center shadow-sm border border-black/5 flex items-center justify-center gap-1"
                        style={{ backgroundColor: getShiftColor(emp.shifts[1], branch, quickShifts) }}
                      >
                        <Clock size={10} className="opacity-50" />
                        {emp.shifts[1].start} - {emp.shifts[1].end}
                      </div>
                    ) : (
                      <div className="text-gray-300 text-center italic">لا يوجد</div>
                    )}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-center">
                    <span className="bg-gray-100 px-2 py-1 rounded-lg font-bold text-gray-700">{totalHours} س</span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-center print:hidden">
                    <button
                      onClick={() => onEdit(emp, idx)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ShiftSummary = ({ branch, quickShifts }: { branch: Branch, quickShifts: QuickShiftTemplate[] }) => {
  const counts: Record<string, number> = {};
  branch.openingShifts.forEach(os => counts[os.name] = 0);
  let otherCount = 0;

  branch.employees.forEach(emp => {
    emp.shifts.forEach(shift => {
      if (!shift.start || !shift.end) return;
      const start = shift.start.toLowerCase().trim();
      const end = shift.end.toLowerCase().trim();
      const fullTime = `${start} - ${end}`;
      const openingMatch = branch.openingShifts.find(s => s.time.toLowerCase().includes(start) || s.time.toLowerCase().includes(fullTime));

      if (openingMatch) {
        counts[openingMatch.name] = (counts[openingMatch.name] || 0) + 1;
      } else {
        const templateMatch = quickShifts.find(s =>
          (s.start.toLowerCase().trim() === start && s.end.toLowerCase().trim() === end) ||
          s.label.toLowerCase().includes(start)
        );
        if (templateMatch) {
          counts[templateMatch.label] = (counts[templateMatch.label] || 0) + 1;
        } else {
          otherCount++;
        }
      }
    });
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm" dir="rtl">
      <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
        <Zap size={16} className="text-indigo-500" />
        ملخص إحصائيات الشفتات
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {Object.entries(counts).map(([name, count]) => (
          count > 0 ? (
            <div key={name} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
              <div className="text-gray-500 text-[11px] font-bold mb-1 text-center">{name}</div>
              <div className="text-xl font-black text-indigo-600">{count}</div>
            </div>
          ) : null
        ))}
        {otherCount > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-gray-500 text-[11px] font-bold mb-1 text-center">أخرى</div>
            <div className="text-xl font-black text-gray-400">{otherCount}</div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditModalProps {
  employee: Employee;
  quickShifts: QuickShiftTemplate[];
  onSave: (updated: Employee) => void;
  onClose: () => void;
}

const EditModal = ({ employee, quickShifts, onSave, onClose }: EditModalProps) => {
  const [edited, setEdited] = useState<Employee>({ ...employee });

  const addShift = () => {
    if (edited.shifts.length < 2) {
      setEdited({ ...edited, shifts: [...edited.shifts, { start: '8:30 pm', end: '2:30 am' }] });
    }
  };

  const removeShift = (idx: number) => {
    const newShifts = edited.shifts.filter((_, i) => i !== idx);
    setEdited({ ...edited, shifts: newShifts });
  };

  const updateShift = (idx: number, field: keyof Shift, value: string) => {
    const newShifts = [...edited.shifts];
    newShifts[idx] = { ...newShifts[idx], [field]: value };
    setEdited({ ...edited, shifts: newShifts });
  };

  const applyQuickShift = (idx: number, quick: QuickShiftTemplate) => {
    const newShifts = [...edited.shifts];
    newShifts[idx] = { start: quick.start, end: quick.end };
    setEdited({ ...edited, shifts: newShifts });
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center" dir="rtl">
          <h3 className="text-xl font-bold text-gray-900">تعديل بيانات الموظف</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4 text-right overflow-y-auto max-h-[70vh]" dir="rtl">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">اسم الموظف</label>
            <input
              type="text"
              value={edited.name}
              onChange={e => setEdited({ ...edited, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">رقم الموظف / الهوية</label>
            <input
              type="text"
              value={edited.id || ''}
              onChange={e => setEdited({ ...edited, id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <button
                onClick={addShift}
                disabled={edited.shifts.length >= 2}
                className="text-indigo-600 text-xs font-bold flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <Plus size={14} /> إضافة شفت
              </button>
              <label className="text-sm font-bold text-gray-700">الشفتات</label>
            </div>
            {edited.shifts.map((shift, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <button onClick={() => removeShift(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  <span className="text-xs font-bold text-gray-500">شفت {idx + 1}</span>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {quickShifts.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => applyQuickShift(idx, q)}
                      className="text-[10px] px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center gap-1"
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: q.color }}></div>
                      {q.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">إلى</label>
                    <select
                      value={shift.end}
                      onChange={e => updateShift(idx, 'end', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white"
                    >
                      <option value="">اختر الوقت</option>
                      {TIME_OPTIONS.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">من</label>
                    <select
                      value={shift.start}
                      onChange={e => updateShift(idx, 'start', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none bg-white"
                    >
                      <option value="">اختر الوقت</option>
                      {TIME_OPTIONS.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={() => onSave(edited)}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <Save size={18} /> حفظ التغييرات
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES_DATA);
  const [quickShifts, setQuickShifts] = useState<QuickShiftTemplate[]>(DEFAULT_QUICK_SHIFTS);
  const [selectedBranchId, setSelectedBranchId] = useState(INITIAL_BRANCHES_DATA[0].id);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<{ emp: Employee, idx: number } | null>(null);
  const [editingOpeningShifts, setEditingOpeningShifts] = useState<OpeningShift[] | null>(null);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const dateObj = useMemo(() => new Date(selectedDate), [selectedDate]);

  const selectedBranch = useMemo(() =>
    branches.find(b => b.id === selectedBranchId) || branches[0]
    , [selectedBranchId, branches]);

  const handleExportPDF = async () => {
    const element = document.getElementById('export-container');
    if (!element || isExporting) return;

    try {
      setIsExporting(true);
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('export-container');
          if (el) {
            // Force LTR for the capture to avoid RTL scrambling in html2canvas
            // but we need to keep the visual order.
            el.style.direction = 'rtl';
            el.style.padding = '40px';
            el.style.width = '1200px';

            const allElements = el.querySelectorAll('*');
            allElements.forEach((node) => {
              const htmlNode = node as HTMLElement;
              const style = window.getComputedStyle(htmlNode);

              // Ensure fonts are loaded
              htmlNode.style.fontFamily = '"Noto Sans Arabic", sans-serif';

              if (style.backgroundColor.includes('okl') || style.backgroundColor.includes('color-mix')) {
                const inlineBg = htmlNode.style.backgroundColor;
                if (inlineBg) {
                  htmlNode.style.backgroundColor = inlineBg;
                } else if (htmlNode.classList.contains('bg-[#333333]')) {
                  htmlNode.style.backgroundColor = '#333333';
                } else {
                  htmlNode.style.backgroundColor = '#ffffff';
                }
              }
              if (style.color.includes('okl') || style.color.includes('color-mix')) {
                htmlNode.style.color = htmlNode.tagName === 'TH' ? '#ffffff' : '#000000';
              }
              htmlNode.style.boxShadow = 'none';
              htmlNode.style.textShadow = 'none';
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 10) / imgWidth, (pdfHeight - 10) / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;

      pdf.addImage(imgData, 'PNG', (pdfWidth - finalWidth) / 2, 5, finalWidth, finalHeight);
      pdf.save(`جدول_دوام_${selectedBranch.name}_${selectedDate}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('حدث خطأ أثناء تصدير الملف.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveEmployee = (updated: Employee) => {
    const updatedBranches = branches.map(b => {
      if (b.id === selectedBranchId) {
        const newEmployees = [...b.employees];
        newEmployees[editingEmployee!.idx] = updated;
        return { ...b, employees: newEmployees };
      }
      return b;
    });
    setBranches(updatedBranches);
    setEditingEmployee(null);
  };

  const handleSaveOpeningShifts = () => {
    if (editingOpeningShifts !== null) {
      const updatedBranches = branches.map(b => {
        if (b.id === selectedBranchId) {
          return { ...b, openingShifts: editingOpeningShifts };
        }
        return b;
      });
      setBranches(updatedBranches);
      setEditingOpeningShifts(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-gray-900 font-sans selection:bg-indigo-100">

      {isManagingTemplates && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 space-y-4 text-right overflow-hidden flex flex-col max-h-[90vh]"
            dir="rtl"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-xl font-bold text-gray-900">إدارة قوالب الشفتات الجاهزة</h3>
              <button onClick={() => setIsManagingTemplates(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-1">
              {quickShifts.map((template, idx) => (
                <div key={template.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">اسم القالب</label>
                    <input
                      type="text"
                      value={template.label}
                      onChange={(e) => {
                        const newTemplates = [...quickShifts];
                        newTemplates[idx] = { ...template, label: e.target.value };
                        setQuickShifts(newTemplates);
                      }}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">وقت البدء</label>
                    <select
                      value={template.start}
                      onChange={(e) => {
                        const newTemplates = [...quickShifts];
                        newTemplates[idx] = { ...template, start: e.target.value };
                        setQuickShifts(newTemplates);
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg outline-none text-xs"
                    >
                      <option value="">اختر الوقت</option>
                      {TIME_OPTIONS.map(t => <option key={`qs-start-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">وقت الانتهاء</label>
                    <select
                      value={template.end}
                      onChange={(e) => {
                        const newTemplates = [...quickShifts];
                        newTemplates[idx] = { ...template, end: e.target.value };
                        setQuickShifts(newTemplates);
                      }}
                      className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg outline-none text-xs"
                    >
                      <option value="">اختر الوقت</option>
                      {TIME_OPTIONS.map(t => <option key={`qs-end-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">اللون</label>
                      <input
                        type="color"
                        value={template.color}
                        onChange={(e) => {
                          const newTemplates = [...quickShifts];
                          newTemplates[idx] = { ...template, color: e.target.value };
                          setQuickShifts(newTemplates);
                        }}
                        className="w-full h-9 rounded-lg border-none cursor-pointer"
                      />
                    </div>
                    <button
                      onClick={() => setQuickShifts(quickShifts.filter(t => t.id !== template.id))}
                      className="p-2 text-red-400 hover:text-red-600 transition-colors mt-5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  const newTemplate: QuickShiftTemplate = {
                    id: Date.now().toString(),
                    label: 'قالب جديد',
                    start: '11:30 am',
                    end: '5:30 pm',
                    color: '#D9D9D9'
                  };
                  setQuickShifts([...quickShifts, newTemplate]);
                }}
                className="flex-1 bg-indigo-50 text-indigo-600 py-3 rounded-2xl font-bold hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> إضافة قالب جديد
              </button>
              <button
                onClick={() => setIsManagingTemplates(false)}
                className="flex-1 bg-[#333333] text-white py-3 rounded-2xl font-bold hover:bg-black transition-all"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {editingOpeningShifts !== null && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-right"
            dir="rtl"
          >
            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">تعديل أوقات العمل (الشفتات)</h3>
            <div className="space-y-4">
              {editingOpeningShifts.map((shift, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={shift.name}
                      onChange={(e) => {
                        const newShifts = [...editingOpeningShifts];
                        newShifts[idx] = { ...shift, name: e.target.value };
                        setEditingOpeningShifts(newShifts);
                      }}
                      className="bg-transparent font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-200 rounded px-1"
                    />
                    <input
                      type="color"
                      value={shift.color}
                      onChange={(e) => {
                        const newShifts = [...editingOpeningShifts];
                        newShifts[idx] = { ...shift, color: e.target.value };
                        setEditingOpeningShifts(newShifts);
                      }}
                      className="w-8 h-8 rounded-full border-none cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={shift.time.split(' - ')[0] || ''}
                      onChange={(e) => {
                        const end = shift.time.split(' - ')[1] || '';
                        const newShifts = [...editingOpeningShifts];
                        newShifts[idx] = { ...shift, time: `${e.target.value} - ${end}` };
                        setEditingOpeningShifts(newShifts);
                      }}
                      className="w-1/2 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                    >
                      <option value="">وقت البدء</option>
                      {TIME_OPTIONS.map(t => <option key={`os-start-${t}`} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={shift.time.split(' - ')[1] || ''}
                      onChange={(e) => {
                        const start = shift.time.split(' - ')[0] || '';
                        const newShifts = [...editingOpeningShifts];
                        newShifts[idx] = { ...shift, time: `${start} - ${e.target.value}` };
                        setEditingOpeningShifts(newShifts);
                      }}
                      className="w-1/2 px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                    >
                      <option value="">وقت الانتهاء</option>
                      {TIME_OPTIONS.map(t => <option key={`os-end-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveOpeningShifts}
                className="flex-1 bg-[#333333] text-white py-3 rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} /> حفظ التغييرات
              </button>
              <button
                onClick={() => setEditingOpeningShifts(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {editingEmployee && (
        <EditModal
          employee={editingEmployee.emp}
          quickShifts={quickShifts}
          onSave={handleSaveEmployee}
          onClose={() => setEditingEmployee(null)}
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-[#333333] rounded flex items-center justify-center text-white shrink-0">
              <Calendar size={18} />
            </div>
            <h1 className="text-sm sm:text-lg font-bold truncate max-w-[150px] sm:max-w-none">نظام دوام الموظفين</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-end gap-0 text-right" dir="rtl">
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (dateInputRef.current) {
                      if ('showPicker' in dateInputRef.current) {
                        (dateInputRef.current as any).showPicker();
                      } else {
                        dateInputRef.current.click();
                      }
                    }
                  }}
                  className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-bold text-gray-700 bg-gray-100 px-2 sm:px-3 py-1 rounded border border-gray-200 relative z-30"
                >
                  <Clock size={12} />
                  <span>{dateObj.toLocaleDateString('ar-SA')}</span>
                </button>
              </div>
              <span className="text-[8px] sm:text-[10px] text-gray-500 font-medium hidden xs:block">
                {new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 sm:p-6 space-y-6">

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between" dir="rtl">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {branches.map(branch => (
              <button
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all border shrink-0 ${selectedBranchId === branch.id
                    ? 'bg-[#333333] text-white border-[#333333] shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {branch.name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsManagingTemplates(true)}
              className="flex-1 sm:flex-none px-3 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"
            >
              <Zap size={14} />
              <span className="hidden xs:inline">إدارة القوالب</span>
              <span className="xs:hidden">القوالب</span>
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-3 py-2 bg-[#333333] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:bg-black transition-all"
            >
              <Download size={14} />
              <span>{isExporting ? 'جاري...' : 'تصدير PDF'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4" id="export-container">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-right flex justify-between items-center" dir="rtl">
            <div>
              <h2 className="text-xl font-bold text-gray-900">جدول دوام: {selectedBranch.name}</h2>
              <p className="text-gray-500 text-sm">التاريخ: {selectedDate} م | {new Intl.DateTimeFormat('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' }).format(dateObj)} هـ</p>
            </div>
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center justify-between w-full mb-1">
                <button
                  onClick={() => setEditingOpeningShifts([...selectedBranch.openingShifts])}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-all print:hidden"
                  title="تعديل أوقات العمل"
                >
                  <Edit2 size={10} />
                  <span>تعديل الأوقات</span>
                </button>
                <span className="text-xs font-bold text-gray-400 uppercase">أوقات العمل</span>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {selectedBranch.openingShifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1 rounded border border-gray-200 text-[10px] font-bold text-gray-700 shadow-sm">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.color }}></div>
                    <span>{shift.name}: {shift.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <ShiftSummary branch={selectedBranch} quickShifts={quickShifts} />

          <EmployeeSchedule
            branch={selectedBranch}
            quickShifts={quickShifts}
            onEdit={(emp, idx) => setEditingEmployee({ emp, idx })}
          />
        </div>
      </main>

      {/* Footer Info */}
      <footer className="max-w-[1600px] mx-auto p-6 text-center text-gray-400 text-xs border-t border-gray-100 mt-12">
        <p>© ٢٠٢٦ نظام إدارة الشفتات الموحد - جميع الحقوق محفوظة</p>
        <p className="mt-1">تم التحديث التلقائي بناءً على بيانات فروع المنطقة (ينبع، تبوك، عرعر، الجوف، المدينة المنورة)</p>
      </footer>
    </div>
  );
}
