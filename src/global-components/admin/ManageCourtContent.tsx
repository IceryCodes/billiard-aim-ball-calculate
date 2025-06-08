'use client';

import { CourtProps } from '@/domains/court';

import { CourtForm, CourtFormMode } from '../forms/CourtForm';

interface ManageCourtContentProps {
  court: CourtProps;
  refetch: () => void;
}

const ManageCourtContent = ({ court, refetch }: ManageCourtContentProps) => {
  return <CourtForm mode={CourtFormMode.Edit} court={court} onSuccess={refetch} />;
};

export default ManageCourtContent;
