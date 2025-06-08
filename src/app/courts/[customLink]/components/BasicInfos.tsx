import { ReactNode } from 'react';

import moment from 'moment';

import { GenderType } from '@/domains/interface';
import { useEnum } from '@/hooks/utils/useEnum';
import ConvertLink, { LinkType } from '@/utils/links';

interface BasicInfosProps {
  title: string;
  owner: string;
  gender: GenderType;
  orgCode: string;
  fullAddress: string;
  websiteUrl: string;
  email: string;
  phone: string;
  openTime: string;
  closeTime: string;
  fullDay: boolean;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BasicInfos = ({
  title,
  owner,
  gender,
  orgCode,
  fullAddress,
  websiteUrl,
  email,
  phone,
  openTime,
  closeTime,
  fullDay,
  status,
  createdAt,
  updatedAt,
}: BasicInfosProps): ReactNode => {
  const { composeGender } = useEnum();

  return (
    <div className="p-6 bg-backgroundLight rounded-lg shadow-md mx-auto">
      <h2 className="text-xl font-semibold mb-6">{`${title}基本資料`}</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <li className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <span className="text-sm">開業狀態</span>
            <span className={`font-medium ${status ? 'text-green-600' : 'text-red-600'}`}>
              {status ? '開業中' : '歇業中'}
            </span>
          </div>
        </li>

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">營業時間</span>
              {fullDay || (openTime && closeTime) ? (
                <span className="font-medium">{fullDay ? '24小時營業' : `${openTime} - ${closeTime}`}</span>
              ) : (
                <span className="font-medium">--</span>
              )}
            </div>
          </li>
        }

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">負責人</span>
              <span className="font-medium">
                {!owner ? '--' : `${owner}${gender === GenderType.None ? '' : composeGender(gender)}`}
              </span>
            </div>
          </li>
        }

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">機構代碼</span>
              <span className="font-medium">{!orgCode ? '--' : orgCode}</span>
            </div>
          </li>
        }

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">撞球場地地址</span>
              <span className={`break-all ${fullAddress ? 'text-link hover:underline' : ''}`}>
                {ConvertLink({ text: fullAddress, type: LinkType.Address })}
              </span>
            </div>
          </li>
        }

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">撞球場地網站</span>
              <span className={`break-all ${websiteUrl ? 'text-link hover:underline' : ''}`}>
                {!websiteUrl ? '--' : ConvertLink({ text: websiteUrl, type: LinkType.Website })}
              </span>
            </div>
          </li>
        }

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">聯絡信箱</span>
              <span className={`break-all ${email ? 'text-link hover:underline' : ''}`}>
                {!email ? '--' : ConvertLink({ text: email, type: LinkType.Email })}
              </span>
            </div>
          </li>
        }

        {
          <li className="bg-background p-4 rounded-lg shadow-sm">
            <div className="flex flex-col">
              <span className="text-sm">聯絡電話</span>
              <span className={`break-all ${phone ? 'text-link hover:underline' : ''}`}>
                {!phone ? '--' : ConvertLink({ text: phone, type: LinkType.Phone })}
              </span>
            </div>
          </li>
        }

        <li className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <span className="text-sm">新增時間</span>
            <span className="font-medium">{moment(createdAt).format('YYYY年MM月DD日 HH:mm')}</span>
          </div>
        </li>

        <li className="bg-background p-4 rounded-lg shadow-sm">
          <div className="flex flex-col">
            <span className="text-sm">更新時間</span>
            <span className="font-medium">{moment(updatedAt).format('YYYY年MM月DD日 HH:mm')}</span>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default BasicInfos;
