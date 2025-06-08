'use client';

import { ReactNode, useCallback } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { CourtProps } from '@/domains/court';
import { useUpdateManagesMutation } from '@/features/manages/hooks/useUpdateManagesMutation';
import { Button } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import { ToastStyleType } from '@/global-components/Toast';

interface UserRoleAssignProps {
  selectedItems: CourtProps[];
  userId?: string;
  userName?: string;
  refetchUser: () => void;
}

const UserRoleAssign = ({ selectedItems, userId, userName, refetchUser }: UserRoleAssignProps): ReactNode => {
  const { showToast } = useToast();

  const { isLoading, mutateAsync } = useUpdateManagesMutation();

  const handleUpdate = useCallback(async () => {
    if (!userId) return;
    const confirmed = window.confirm(`您確定要更新${userName}的機構管理權限嗎?`);
    if (!confirmed) return;

    try {
      const result = await mutateAsync({
        userId,
        itemIds: selectedItems.map(({ _id }) => _id),
      });

      const { message } = result;
      refetchUser();
      showToast({ message });
    } catch (error) {
      console.error('Update error:', error);
      showToast({ message: '更新錯誤!', toastStyle: ToastStyleType.Warning });
    }
  }, [mutateAsync, refetchUser, selectedItems, showToast, userId, userName]);

  return (
    <>
      {userId && (
        <div className="flex gap-x-4">
          <Card className="flex flex-col min-w-[350px]">
            <>
              <label>{`${userName} 將擁有以下機構之管理權限:`}</label>
              <Button text="確定" onClick={handleUpdate} disabled={!userId || isLoading} />
            </>
          </Card>

          <Card className="flex flex-col w-full">
            <>
              {!selectedItems.length && <label>無任何機構</label>}
              <ul className="flex flex-wrap gap-2">
                {selectedItems.map(({ _id, title }) => (
                  <li key={_id.toString()} className="flex flex-col cursor-pointer p-2 rounded border-2 border-link">
                    {title}
                  </li>
                ))}
              </ul>
            </>
          </Card>
        </div>
      )}
    </>
  );
};

export default UserRoleAssign;
