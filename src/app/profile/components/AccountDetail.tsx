import moment from 'moment';

import { GenderType, UserRoleType } from '@/domains/interface';
import { UserProps } from '@/domains/user';
import { ProfileForm } from '@/global-components/forms/ProfileForm';

interface AccountDetailProps {
  user: UserProps;
  token: string;
}

export const AccountDetail = ({ user, token }: AccountDetailProps) => (
  <div className="bg-backgroundLight rounded-lg shadow-md p-6 h-fit">
    <div className="flex justify-between items-center mb-8">
      <h2 className="text-2xl font-semibold">帳號資訊</h2>
      {user && <ProfileForm token={token} user={user} />}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm text-foreground/70 mb-2">姓名</h3>
          <p className="text-lg font-medium">{`${user.lastName} ${user.firstName}`}</p>
        </div>

        <div>
          <h3 className="text-sm text-foreground/70 mb-2">電子郵件</h3>
          <a className="text-lg text-link hover:underline transition-all" href={`mailto:${user.email}`} target="_blank">
            {user.email}
          </a>
        </div>

        <div>
          <h3 className="text-sm text-foreground/70 mb-2">性別</h3>
          <p className="text-lg">{user.gender === GenderType.Male ? '男' : '女'}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm text-foreground/70 mb-2">帳號角色</h3>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
              user.role === UserRoleType.Admin ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {user.role === UserRoleType.Admin ? '管理員' : '一般用戶'}
          </span>
        </div>

        <div>
          <h3 className="text-sm text-foreground/70 mb-2">驗證狀態</h3>
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
              user.isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {user.isVerified ? '已驗證' : '未驗證'}
          </span>
        </div>

        <div>
          <h3 className="text-sm text-foreground/70 mb-2">建立時間</h3>
          <p className="text-lg">{moment(user.createdAt).format('YYYY年MM月DD日 HH:mm')}</p>
        </div>
      </div>
    </div>
  </div>
);
