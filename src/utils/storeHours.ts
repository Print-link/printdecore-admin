const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type OperatingHours = Record<string, { open: string; close: string }>;

const formatClock = (time: string): string => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${period}` : `${h12} ${period}`;
};

export interface StoreOpenStatus {
  isOpen: boolean | null; // null = unknown (no hours configured)
  label: string;
  todayHours?: { open: string; close: string };
}

/** Live open/closed status for a branch, based on its weekly operating hours and the current time. */
export const getStoreOpenStatus = (hours?: OperatingHours): StoreOpenStatus => {
  if (!hours || Object.keys(hours).length === 0) {
    return { isOpen: null, label: 'Hours not set' };
  }

  const now = new Date();
  const today = hours[DAYS[now.getDay()]];
  if (!today) {
    return { isOpen: false, label: 'Closed today' };
  }

  const [oh, om] = today.open.split(':').map(Number);
  const [ch, cm] = today.close.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const isOpen = nowMins >= oh * 60 + om && nowMins < ch * 60 + cm;

  return {
    isOpen,
    label: isOpen ? `Open · closes ${formatClock(today.close)}` : `Closed · opens ${formatClock(today.open)}`,
    todayHours: today,
  };
};

export const WEEKDAY_LABELS: Record<(typeof DAYS)[number], string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

export const orderedDays = () => [...DAYS];
export const currentDayKey = () => DAYS[new Date().getDay()];
export const formatHourRange = (h: { open: string; close: string }) => `${formatClock(h.open)} – ${formatClock(h.close)}`;
