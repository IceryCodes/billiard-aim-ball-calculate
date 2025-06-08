'use client';

import { ReactNode, useState } from 'react';

import CourtList from './CourtList';
import CourtMapNew from './CourtMapNew';

const CourtListMap = (): ReactNode => {
  const [listMode, setListMode] = useState<boolean>(true);

  const switchMode = () => setListMode(!listMode);

  return <>{listMode ? <CourtList switchMode={switchMode} /> : <CourtMapNew switchMode={switchMode} />}</>;
};

export default CourtListMap;
