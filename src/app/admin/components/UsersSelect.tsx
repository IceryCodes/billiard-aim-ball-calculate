import { ReactNode, useCallback } from 'react';

import { UserProps } from '@/domains/user';
import { useEnum } from '@/hooks/utils/useEnum';

interface UsersSelectProps {
  users: UserProps[];
  selectedUser: UserProps | null;
  user: UserProps | undefined;
  setSelectedUser: (selectedUser: UserProps) => void;
}

interface InfoRowProps {
  title: string;
  content: string;
}

const UsersSelect = ({ users, selectedUser, user, setSelectedUser }: UsersSelectProps): ReactNode => {
  const { composeRole, composeGender } = useEnum();

  const infoRow = useCallback(
    ({ title, content }: InfoRowProps): ReactNode => (
      <li className="break-words whitespace-normal">
        <span className="inline font-semibold">{`${title}:`}</span>
        <span className="block pl-2">{content}</span>
      </li>
    ),
    []
  );

  return (
    <div className="flex-grow border pt-0 rounded overflow-y-scroll h-[350px]">
      {!selectedUser && users.length === 0 && <div className="space-y-2 p-4">請搜尋並選擇帳號</div>}
      {!selectedUser && !!users.length && (
        <ul className="space-y-2 p-4">
          {users.map((item: UserProps) => (
            <li
              key={item._id.toString()}
              onClick={() => setSelectedUser(item)}
              className="flex flex-col cursor-pointer p-2 rounded border-l-2 border-link"
            >
              <span>{`${item.firstName}${item.lastName}`}</span>
              <span className="text-sm ml-4">{`${item.email}`}</span>
            </li>
          ))}
        </ul>
      )}
      {user && (
        <ul className="space-y-2 p-4">
          {infoRow({ title: '姓氏', content: user.lastName })}
          {infoRow({ title: '名稱', content: user.firstName })}
          {infoRow({ title: '信箱', content: user.email })}
          {infoRow({ title: '性別', content: composeGender(user.gender) })}
          {infoRow({ title: '身份', content: composeRole(user.role) })}
        </ul>
      )}
    </div>
  );
};

export default UsersSelect;
