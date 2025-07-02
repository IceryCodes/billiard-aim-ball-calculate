import moment from 'moment';
import Link from 'next/link';

import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';

interface CourtDetailProps {
  courts: CourtProps[];
}

export const CourtDetail = ({ courts }: CourtDetailProps) => {
  return (
    <div className="bg-backgroundLight rounded-lg shadow-md p-6 max-h-[600px] overflow-y-scroll">
      <h2 className="text-2xl font-semibold mb-8">
        {PageType.COURTS} ({courts.length})
      </h2>

      {!courts.length && (
        <div className="text-center">
          <label>目前沒有管理任何{PageType.COURTS}</label>
        </div>
      )}
      {!!courts.length && (
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-foreground/10">
              <thead>
                <tr>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">名稱</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">地址</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">更新時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {!!courts.length &&
                  courts.map((court) => (
                    <tr key={court._id.toString()} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`${getPageUrlByType(PageType.COURTS)}/${court.customLink}`}>
                          <span className="border rounded hover:scale-105 hover:text-link transition duration-300 font-medium px-2">
                            {court.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/90 max-w-[250px] overflow-x-auto">
                        {`${court.county}${court.district}${court.address}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/90">
                        {moment(court.updatedAt).format('YYYY年MM月DD日 HH:mm')}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
