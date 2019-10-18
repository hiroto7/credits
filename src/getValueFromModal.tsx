import React from 'react';

const getValueFromModal = async <T, P>(
    ModalType: (props: {
        onReturn: (value: T) => void,
        onExited: () => void,
    } & P) => JSX.Element,
    props: P,
    modals: JSX.Element[],
    setModals: React.Dispatch<React.SetStateAction<JSX.Element[]>>,
): Promise<T> => new Promise((resolve, reject) => {
    try {
        const modal = (
            <ModalType
                {...props}
                onReturn={value => resolve(value)}
                onExited={() => setModals(newModals.filter(value => value !== modal))}
            />
        );
        const newModals = [...modals, modal];
        setModals(newModals);
    } catch (e) {
        reject(e);
    }
});

export default getValueFromModal;