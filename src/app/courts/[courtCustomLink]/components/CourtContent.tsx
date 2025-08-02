'use client';
import { ReactNode, useEffect, useState } from 'react';

import Image from 'next/image';
import { notFound, useParams, useRouter } from 'next/navigation';

import SidebarLayout from '@/app/courts/[courtCustomLink]/components/SidebarLayout';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { defaultCourtExcerpt } from '@/domains/metadatas';
import { useCourtQuery } from '@/features/courts/hooks/useCourtQuery';
import { useUpdateCourtViewMutation } from '@/features/courts/hooks/useUpdateCourtViewMutation';
import { useGoogleInfosMutation } from '@/features/google/hooks/useGoogleInfosMutation';
import DeleteCourtContent from '@/global-components/admin/DeleteCourtContent';
import ManageRegisterButton from '@/global-components/admin/ManageRegisterButton';
import Breadcrumb from '@/global-components/Breadcrumb';
import { TournamentFormButton, TournamentFormMode } from '@/global-components/buttons/TournamentFormButton';
import Card from '@/global-components/Card';
import { CourtForm, CourtFormMode } from '@/global-components/forms/CourtForm';
import GoogleMapComponentNew from '@/global-components/google-map/GoogleMapComponentNew';
import GooglePhotoCarousel from '@/global-components/GooglePhotoCarousel';
import GoogleReviews from '@/global-components/GoogleReviews';
import Tab from '@/global-components/tabs/Tab';
import Tag from '@/global-components/tags/Tag';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';
import AdminProtected from '@/hooks/utils/protections/components/useAdminProtected';
import ConvertLink, { LinkType } from '@/utils/links';

import BasicInfos from './BasicInfos';
import GoogleInfos from './GoogleInfos';

const CourtContent = (): ReactNode => {
  const params = useParams();
  const courtCustomLink: string = params?.courtCustomLink as string;
  const router = useRouter();

  const { data: { court, manage } = {}, isLoading, isError, refetch } = useCourtQuery({ customLink: courtCustomLink });
  const { mutateAsync: updateCourtView } = useUpdateCourtViewMutation();

  const { data: googleInfo, mutateAsync: fetchGoogleInfo } = useGoogleInfosMutation();

  const [isAddressChecked, setIsAddressChecked] = useState<boolean>(false);

  useEffect(() => {
    const checkAndFetchGoogleData = async () => {
      if (isLoading || isError || !court) return;

      const googleTitle = court.title;
      const googleAddress = `${court.county}${court.district}${court.address}`;

      if (!isAddressChecked && googleTitle) {
        const { formatted_address } = await fetchGoogleInfo({ query: googleTitle, byTitle: true });

        if (!formatted_address?.includes('號')) await fetchGoogleInfo({ query: googleAddress, byTitle: false });
        setIsAddressChecked(true);
      }
    };

    checkAndFetchGoogleData();
  }, [isLoading, isError, court, isAddressChecked, fetchGoogleInfo]);

  useEffect(() => {
    if (!isLoading && !court && !isError) notFound();
    if (court) updateCourtView({ _id: court._id });
  }, [isLoading, court, isError, router, updateCourtView]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="text-gray-500 text-lg">載入中...</span>
        </div>
      </div>
    );
  }

  if (isError) return <span>搜尋時發生錯誤</span>;
  if (!court) return <span>沒有符合的撞球場地</span>;

  const {
    _id,
    partner,
    orgCode,
    owner,
    gender,
    websiteUrl,
    email,
    phone,
    county,
    district,
    address,
    title,
    excerpt,
    content,
    featuredImg,
    coachs,
    openTime,
    closeTime,
    fullDay,
    status,
    createdAt,
    updatedAt,
    location: { coordinates },
  } = court;

  const {
    business_status,
    formatted_address,
    formatted_phone_number,
    international_phone_number,
    opening_hours,
    website,
    rating,
    user_ratings_total,
    icon,
    icon_background_color,
    name,
    reviews,
    photos,
  } = googleInfo || {};

  const usedExcerpt: string = excerpt ? excerpt : defaultCourtExcerpt(court);
  const hasGoogleInfo: boolean = !!icon && !icon?.includes('geocode-71.png');

  return (
    <div className="container mx-auto p-6">
      <div className="relative w-full">
        <SidebarLayout pageId={_id} county={county}>
          <div className="flex flex-col gap-y-6">
            <Image
              src={
                featuredImg
                  ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_COURT_FEATURED_FOLDER}/${featuredImg}`
                  : process.env.NEXT_PUBLIC_FEATURED_IMAGE
              }
              alt={title}
              width={1080}
              height={607.5}
              className="rounded-xl object-cover w-[1080px] h-[607.5px]"
              placeholder="blur"
              blurDataURL={
                featuredImg
                  ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_COURT_FEATURED_FOLDER}/${featuredImg}`
                  : process.env.NEXT_PUBLIC_FEATURED_IMAGE
              }
            />
            <Breadcrumb pageName={title} />

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <AdminProtected>
                  <DeleteCourtContent
                    _id={_id}
                    title={title}
                    afterDelete={() => router.push(getPageUrlByType(PageType.COURTS))}
                  />
                </AdminProtected>

                <ManagerCourtProtected pageId={_id}>
                  <CourtForm mode={CourtFormMode.Edit} court={court} onSuccess={refetch} />
                  <TournamentFormButton mode={TournamentFormMode.Create} />
                </ManagerCourtProtected>
              </div>
              <div className="flex items-center">
                {
                  <div
                    className="flex items-center justify-center mr-4"
                    style={{ backgroundColor: hasGoogleInfo ? icon_background_color : '' }}
                  >
                    <Image
                      src={hasGoogleInfo && icon ? icon : '/assets/icon.png'}
                      alt={`${name}圖標`}
                      width={hasGoogleInfo && icon ? 40 : 35}
                      height={hasGoogleInfo && icon ? 40 : 35}
                      blurDataURL={hasGoogleInfo && icon ? icon : '/assets/icon.png'}
                    />
                  </div>
                }
                <div>
                  <h1 className="text-4xl font-bold">{title}</h1>
                  {!!hasGoogleInfo && name && (
                    <span className="text-sm">
                      Google資料來源: {ConvertLink({ text: name, type: LinkType.GoogleMapSearch })}
                    </span>
                  )}
                </div>
              </div>
              {partner && <Tag text={`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`} />}
            </div>

            <Card>
              <>
                <blockquote className="border-l-4 border-link pl-4 italic">{usedExcerpt}</blockquote>

                <AdminProtected>
                  <>
                    {!manage && _id && title && (
                      <span>
                        點擊圖示申請管理權限
                        <ManageRegisterButton _id={_id.toString()} title={title} />
                      </span>
                    )}
                  </>
                </AdminProtected>
              </>
            </Card>

            <Tab
              tabs={[
                {
                  title: '小幫手檔案',
                  content: (
                    <BasicInfos
                      title={title}
                      owner={owner}
                      gender={gender}
                      orgCode={orgCode}
                      fullAddress={`${county}${district}${address}`}
                      websiteUrl={websiteUrl}
                      email={email}
                      phone={phone}
                      openTime={openTime}
                      closeTime={closeTime}
                      fullDay={fullDay}
                      status={status}
                      createdAt={createdAt}
                      updatedAt={updatedAt}
                    />
                  ),
                },
                hasGoogleInfo
                  ? {
                      title: 'Google資料',
                      content: (
                        <GoogleInfos
                          title={title}
                          rating={rating}
                          user_ratings_total={user_ratings_total}
                          business_status={business_status}
                          formatted_address={formatted_address}
                          website={website}
                          international_phone_number={international_phone_number}
                          formatted_phone_number={formatted_phone_number}
                          opening_hours={opening_hours}
                        />
                      ),
                    }
                  : undefined,
              ]}
              otherButton={[
                {
                  title: PageType.TOURNAMENTS,
                  onClick: () =>
                    router.push(
                      `${getPageUrlByType(PageType.COURTS)}/${courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}`
                    ),
                },
              ]}
            />

            <Card>
              <>
                <h2 className="text-xl font-bold">關於{title}</h2>
                <p>
                  {content
                    ? content.split('\n').map((line, index, array) => (
                        <span key={index}>
                          {line}
                          {index < array.length - 1 && <br />}
                        </span>
                      ))
                    : `尚無關於${title}的相關資訊，歡迎撞球場地提供補充!`}
                </p>
              </>
            </Card>

            {!!coachs.length && (
              <Card>
                <>
                  <section>
                    <h2 className="text-2xl font-bold mb-4">駐場教練</h2>
                    <div className="flex flex-wrap gap-3">
                      {coachs.map((coach, index) => (
                        <span key={index} className="px-4 py-2 bg-pink-50 text-pink-700 rounded-full">
                          {coach}
                        </span>
                      ))}
                    </div>
                  </section>
                </>
              </Card>
            )}

            <Card>
              <GoogleMapComponentNew
                key={court._id.toString()}
                locationData={[court]}
                lat={coordinates[1]}
                lng={coordinates[0]}
              />
            </Card>

            {hasGoogleInfo && photos?.length && <GooglePhotoCarousel title={title} photos={photos} />}

            {hasGoogleInfo && reviews && <GoogleReviews reviews={reviews} />}
          </div>
        </SidebarLayout>
      </div>
    </div>
  );
};

export default CourtContent;
