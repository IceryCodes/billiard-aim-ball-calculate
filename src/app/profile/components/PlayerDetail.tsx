import { useCallback } from 'react';

import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { PlayerProps } from '@/domains/player';
import { useDeletePlayerMutation } from '@/features/players/hooks/useDeletePlayerMutation';
import { useGetMeMutation } from '@/features/user/hooks/useGetMeMutation';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import { PlayerForm, PlayerFormMode } from '@/global-components/forms/PlayerForm';
import { ToastStyleType } from '@/global-components/Toast';

interface PlayerDetailProps {
  players: PlayerProps[];
  refetch: () => void;
}

export const PlayerDetail = ({ players, refetch }: PlayerDetailProps) => {
  const { showToast } = useToast();
  const { user, login, logout } = useAuth();
  const { mutateAsync: getMe } = useGetMeMutation();
  const { mutateAsync: deletePlayer } = useDeletePlayerMutation({
    onSuccess: async () => {
      refetch();
      showToast({ message: '刪除完成', toastStyle: ToastStyleType.Normal });
      if (!user) return logout();

      const { token } = await getMe({ _id: user._id });
      if (token) login({ token });
    },
  });

  const onSubmit = useCallback(
    async (player: PlayerProps) => {
      const confirmed = window.confirm(`確定要放棄${player.title}的管理權限嗎?\n若${PageType.PLAYERS}無人管理將會被刪除!`);
      if (!confirmed) return;

      deletePlayer({ _id: player._id });
    },
    [deletePlayer]
  );

  return (
    <div className="bg-backgroundLight rounded-lg shadow-md p-6 max-h-[600px] overflow-y-scroll">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">
          {PageType.PLAYERS} ({players.length})
        </h2>
        <PlayerForm mode={PlayerFormMode.Create} onSuccess={refetch} />
      </div>

      {!players.length && (
        <div className="text-center">
          <label>目前沒有管理任何{PageType.PLAYERS}</label>
        </div>
      )}
      {!!players.length && (
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-foreground/10">
              <thead>
                <tr>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">名稱</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">簡述</th>
                  <th className="px-6 py-4 min-w-[80px] text-left text-sm font-medium text-foreground/70">管理</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/10">
                {!!players.length &&
                  players.map((player) => (
                    <tr key={player._id.toString()} className="hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`${getPageUrlByType(PageType.PLAYERS)}/${player.customLink}`}>
                          <span className="border rounded hover:scale-105 hover:text-link transition duration-300 font-medium px-2">
                            {player.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/90 max-w-[250px] overflow-x-auto">
                        {player.excerpt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/90">
                        <Button text="刪除" onClick={() => onSubmit(player)} buttonStyle={ButtonStyleType.Warning} />
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
