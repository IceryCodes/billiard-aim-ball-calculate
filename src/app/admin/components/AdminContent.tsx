'use client';

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { CourtProps, GetCourtsDto } from '@/domains/court';
import { GetUsersDto, UserProps } from '@/domains/user';
import { useCourtsQuery } from '@/features/courts/hooks/useCourtsQuery';
import { useUserQuery } from '@/features/user/hooks/useUserQuery';
import { useUsersQuery } from '@/features/user/hooks/useUsersQuery';
import Card from '@/global-components/Card';
import useAdminProtected from '@/hooks/utils/protections/routes/useAdminProtected';

import ItemsSearch from './ItemsSearch';
import ItemsSelect from './ItemsSelect';
import UserRoleAssign from './UserRoleAssign';
import UsersSearch from './UsersSearch';
import UsersSelect from './UsersSelect';

const limit = 50;

const AdminContent = (): ReactNode => {
  useAdminProtected();

  // Separate search params for each manage type
  const initCourtSearchParams = useMemo(
    (): GetCourtsDto => ({
      query: '',
      county: '',
      keywords: [],
      fullDay: false,
      partner: false,
      coaches: [],
    }),
    []
  );

  const [usersSearch, setUsersSearch] = useState<GetUsersDto>({ email: '' });
  const [courtsSearch, setCourtsSearch] = useState<GetCourtsDto>(initCourtSearchParams);
  const [selectedUser, setSelectedUser] = useState<UserProps | null>(null);

  const { data: userData, refetch: refetchUser } = useUserQuery({
    _id: selectedUser?._id,
    enabled: !!selectedUser?._id,
  });
  const [selectedItems, setSelectedItems] = useState<CourtProps[]>(userData?.manage?.courts ?? []);

  // Queries for each type
  const { data: { users = [], total: totalUsers = 0 } = {}, refetch: refetchUsers } = useUsersQuery({
    email: usersSearch.email,
    enabled: !!usersSearch.email,
  });

  const { data: { courts = [], total: totalCourts = 0 } = {}, refetch: refetchCourts } = useCourtsQuery({
    query: courtsSearch.query,
    county: courtsSearch.county,
    coaches: courtsSearch.coaches,
    fullDay: courtsSearch.fullDay,
    partner: courtsSearch.partner,
    keywords: [],
    limit,
  });

  // Handle court searches
  const handleManageSearch = useCallback(
    async (formData: GetCourtsDto) => {
      setCourtsSearch(formData);
      refetchCourts();
    },
    [refetchCourts]
  );

  // Handle user search separately
  const handleUserSearch = useCallback(
    async (formData: GetUsersDto) => {
      if (formData.email) {
        setUsersSearch(formData);
        await refetchUsers();
      } else {
        setUsersSearch({ email: '' });
      }
      setSelectedUser(null);
    },
    [refetchUsers]
  );

  // Combine lists while removing duplicates
  const combinedList = useMemo((): CourtProps[] => {
    return [...selectedItems, ...courts].filter((item, index, self) => index === self.findIndex((t) => t._id === item._id));
  }, [courts, selectedItems]);

  return (
    <div className="p-4 flex flex-col justify-center gap-y-4 w-full">
      <div className="flex gap-x-4">
        <div className="flex flex-col min-w-[350px] gap-y-4">
          <Card>
            <div className="flex flex-col gap-y-2">
              <label>{`符合結果: ${totalUsers.toLocaleString()}筆`}</label>
              <UsersSearch searchUsers={handleUserSearch} />
              <UsersSelect
                users={users}
                selectedUser={selectedUser}
                user={userData?.user}
                setSelectedUser={setSelectedUser}
              />
            </div>
          </Card>
        </div>

        <Card className="flex flex-col w-full">
          {!selectedUser ? (
            <label className="text-red-400">請先選擇帳號</label>
          ) : (
            <>
              <label>{`符合結果: ${totalCourts.toLocaleString()}筆`}</label>
              <ItemsSearch searchItems={(formData) => handleManageSearch(formData)} />
              <ItemsSelect courts={combinedList} selectedItems={selectedItems} setSelectedItems={setSelectedItems} />
            </>
          )}
        </Card>
      </div>

      <UserRoleAssign
        selectedItems={selectedItems}
        userId={selectedUser?._id?.toString()}
        userName={`${selectedUser?.lastName}${selectedUser?.firstName}`}
        refetchUser={refetchUser}
      />
    </div>
  );
};

export default AdminContent;
