import React, { ReactNode } from 'react';
import { PlantsPageProvider } from './PlantsPageContext';
import { StonesPageProvider } from './StonesPageContext';
import { ZoneMapProvider } from './ZoneMapContext';

export const ViewStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <PlantsPageProvider>
      <StonesPageProvider>
        <ZoneMapProvider>
          {children}
        </ZoneMapProvider>
      </StonesPageProvider>
    </PlantsPageProvider>
  );
};
