import type { OperatingHours } from '../../hooks/useBranchForm';

interface OperatingHoursStepProps {
  operatingHours: OperatingHours;
  errors: Record<string, string>;
  onOperatingHoursChange: (day: string, field: 'open' | 'close', value: string) => void;
  onToggleDayClosed: (day: string) => void;
}

export function OperatingHoursStep({
  operatingHours,
  errors,
  onOperatingHoursChange,
  onToggleDayClosed,
}: OperatingHoursStepProps) {
  return (
    <div className="space-y-4">
      {Object.entries(operatingHours).map(([day, hours]) => {
        const isClosed = !!hours.isClosed;

        return (
          <div key={day} className={`p-4 rounded-ios border border-ios-gray5 ${isClosed ? 'bg-ios-gray6 opacity-60' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-3">
              <label className="font-medium capitalize text-ios-label">{day}</label>
              <button
                type="button"
                onClick={() => onToggleDayClosed(day)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  isClosed ? 'bg-ios-gray4' : 'bg-brand'
                }`}
                role="switch"
                aria-checked={!isClosed}
                aria-label={`${day} ${isClosed ? 'closed' : 'open'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    isClosed ? 'translate-x-0' : 'translate-x-5'
                  }`}
                />
              </button>
            </div>

            {isClosed ? (
              <p className="text-sm text-ios-secondary-label">Closed</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-ios-secondary-label">Open Time</label>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => onOperatingHoursChange(day, 'open', e.target.value)}
                    className="w-full px-3 py-2 rounded-ios border border-ios-gray4 bg-white text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
                  />
                  {errors[`hours_${day}`] && <p className="text-ios-red text-xs mt-1">{errors[`hours_${day}`]}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-ios-secondary-label">Close Time</label>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => onOperatingHoursChange(day, 'close', e.target.value)}
                    className="w-full px-3 py-2 rounded-ios border border-ios-gray4 bg-white text-sm text-ios-label focus:outline-none focus:ring-2 focus:ring-brand-hover"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
