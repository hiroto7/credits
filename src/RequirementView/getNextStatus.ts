import { RegistrationStatus } from '../Plan';
import RegistrationStatusLockTarget from '../RegistrationStatusLockTarget';

const getNextStatus = ({ currentStatus, lockTarget }: {
    currentStatus: RegistrationStatus,
    lockTarget: RegistrationStatusLockTarget,
}): RegistrationStatus => {
    switch (lockTarget) {
        case RegistrationStatusLockTarget.All:
            return currentStatus;
        case RegistrationStatusLockTarget.Acquired:
        case RegistrationStatusLockTarget.Unregistered:
            const difference = (3 + lockTarget - currentStatus) % 3;
            switch (difference) {
                case 0:
                    return currentStatus;
                case 1:
                    return (currentStatus + 2) % 3;
                default:
                    return (currentStatus + 1) % 3;
            }
        default:
            return (currentStatus + 1) % 3;
    }
}

export default getNextStatus;