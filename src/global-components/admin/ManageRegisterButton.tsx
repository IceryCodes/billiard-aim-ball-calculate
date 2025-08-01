'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useDeleteCourtMutation } from '@/features/courts/hooks/useDeleteCourtMutation';
import { Button } from '@/global-components/buttons/Button';

import Popup from '../Popup';
import { ToastStyleType } from '../Toast';

interface ManageRegisterButtonProps {
  _id: string;
  title: string;
}

const ManageRegisterButton = ({ title }: ManageRegisterButtonProps) => {
  const { isAuthenticated } = useAuth();
  const { isLoading } = useDeleteCourtMutation();
  const { showToast } = useToast();

  const [display, setDisplay] = useState<boolean>(false);

  const onSubmit = useCallback(async () => {
    const contactConfirm = window.confirm('拍謝還沒做這個功能，要不你直接跟我聯絡我開權限給你XD?');
    if (!contactConfirm) return;
    window.open('https://www.instagram.com/icery.tw', '_blank');
    showToast({ message: '尚未開放此功能', toastStyle: ToastStyleType.Warning });

    setDisplay(false);
  }, [showToast]);

  const form = useMemo(
    (): ReactNode => (
      <Popup title={`申請管理權限`} display={display} onClose={() => setDisplay(false)}>
        {!isAuthenticated ? (
          <label>請先登入以便進行申請!</label>
        ) : (
          <div className="flex flex-col min-w-[500px]">
            {isLoading && <label>送出中...</label>}

            <div className="flex flex-col justify-center items-center mx-auto">
              <label>{`確定要申請${title}的管理權限嗎?`}</label>
              <Button text="確定" onClick={onSubmit} />
            </div>
          </div>
        )}
      </Popup>
    ),
    [display, isAuthenticated, isLoading, onSubmit, title]
  );

  return (
    <>
      <label onClick={() => setDisplay(true)} className="cursor-pointer">
        📝
      </label>
      {form}
    </>
  );
};

export default ManageRegisterButton;
