'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { useDeleteCourtMutation } from '@/features/courts/hooks/useDeleteCourtMutation';
import { Button } from '@/global-components/buttons/Button';

import Popup from '../Popup';

interface DeleteCourtContentProps {
  _id: string;
  title: string;
  afterDelete: () => void;
}

const DeleteCourtContent = ({ _id, title, afterDelete }: DeleteCourtContentProps) => {
  const { isLoading, mutateAsync } = useDeleteCourtMutation();
  const { showToast } = useToast();

  const [display, setDisplay] = useState<boolean>(false);

  const onSubmit = useCallback(async () => {
    const confirmed = window.confirm(`您確定要刪除${title}嗎?`);
    if (!confirmed) return;

    try {
      const result = await mutateAsync({ _id });
      if (typeof result === 'string') throw new Error(result);

      const { message } = result;
      if (message) showToast({ message });

      setDisplay(false);
      afterDelete();
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, [_id, afterDelete, mutateAsync, showToast, title]);

  const form = useMemo(
    (): ReactNode => (
      <Popup title="刪除撞球場地" display={display} onClose={() => setDisplay(false)}>
        <div className="flex flex-col w-[500px]">
          {isLoading && <label>刪除中...</label>}

          <div className="flex justify-center items-center gap-x-4">
            <label>{`確定要刪除${title}嗎?`}</label>
            <Button text="確定" onClick={onSubmit} />
          </div>
        </div>
      </Popup>
    ),
    [display, isLoading, onSubmit, title]
  );

  const onClick = () => setDisplay(true);

  return (
    <>
      <svg
        onClick={onClick}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-6 h-6 cursor-pointer hover:text-link transition"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      {form}
    </>
  );
};

export default DeleteCourtContent;
