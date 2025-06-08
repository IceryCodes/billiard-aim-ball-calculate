import { ReactNode } from 'react';

import { GoogleOpeningHours } from '@/domains/google';

interface GoogleOpeningProps {
  opening_hours: GoogleOpeningHours;
}

const GoogleOpening = ({ opening_hours }: GoogleOpeningProps): ReactNode => (
  <div className="p-6 bg-backgroundLight rounded-lg shadow-md max-w-md my-4">
    <h3 className="text-xl font-semibold mb-4">營業時間</h3>
    <ul className="space-y-2">
      {opening_hours.weekday_text.map((day: string, index: number) => (
        <li key={index} className="flex justify-between items-center border-b py-2 text-lg font-medium">
          <span>{day}</span>
          <span className={`${day.includes('休息') ? 'text-gray-400' : 'text-foreground'}`}>
            {day.includes('休息') ? '休息' : '營業'}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default GoogleOpening;
