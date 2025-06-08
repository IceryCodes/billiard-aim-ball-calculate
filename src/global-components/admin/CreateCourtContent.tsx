'use client';

import { CourtForm, CourtFormMode } from '../forms/CourtForm';

const CreateCourtContent = () => {
  return <CourtForm mode={CourtFormMode.Create} />;
};

export default CreateCourtContent;
