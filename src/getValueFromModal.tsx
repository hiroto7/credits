import { useState } from "react";

const getValueFromModal = async <T, P>(
  ModalType: React.ComponentType<
    {
      onReturn: (value: T) => void;
      onExited: () => void;
    } & P
  >,
  props: P,
  setModalsAndCount: React.Dispatch<React.SetStateAction<ModalsAndCount>>
): Promise<T> =>
  new Promise((resolve, reject) => {
    try {
      setModalsAndCount(({ modals, count }) => {
        const modal = (
          <ModalType
            {...props}
            onReturn={(value) => resolve(value)}
            onExited={() =>
              setModalsAndCount(({ modals, count }) => ({
                modals: modals.filter((value) => value !== modal),
                count,
              }))
            }
            key={count}
          />
        );
        return {
          modals: [...modals, modal],
          count: count + 1,
        };
      });
    } catch (e) {
      reject(e);
    }
  });

export interface ModalsAndCount {
  readonly modals: readonly JSX.Element[];
  readonly count: number;
}

const initialModalsAndCount: ModalsAndCount = {
  modals: [],
  count: 0,
};

export const useModals = () => {
  const [modalsAndCount, setModalsAndCount] = useState(initialModalsAndCount);
  return {
    modals: modalsAndCount.modals,
    setModalsAndCount,
  };
};

export default getValueFromModal;
