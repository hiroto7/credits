import React from 'react';
import { Badge } from 'react-bootstrap';
import Plan, { RegistrationStatus } from '../Plan';
import Requirements, { RequirementWithChildren, RequirementWithCourses } from '../Requirements';

const CreditsCountLabelDelimiter = () => (<span className="text-muted"> / </span>)

const ExceededCreditsCountLabel = ({ creditsCount }: { creditsCount: number }) => (
    <>
        <span className="text-muted">(</span>
        +{creditsCount}
        <span className="text-muted">)</span>
    </>
);

const CreditsCountLabels = ({ requirement, plan }: {
    requirement: Requirements,
    plan: Plan,
}) => {
    const creditsCount = requirement.getRegisteredCreditsCounts(plan, false);
    const exceededCreditsCount = requirement.getRegisteredCreditsCounts(plan, true);
    const requiredCreditsCount = requirement.getRequiredCreditsCount(plan.selectionNameToOptionName);

    return (
        <div>
            <span>
                <span className="text-muted">習得</span>
                <> </>
                <strong className="text-success">{creditsCount.acquired}</strong>
                {exceededCreditsCount.acquired > creditsCount.acquired ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.acquired - creditsCount.acquired} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">履修</span>
                <> </>
                <strong className="text-primary">{creditsCount.registered}</strong>
                {exceededCreditsCount.registered > creditsCount.registered ? (<ExceededCreditsCountLabel creditsCount={exceededCreditsCount.registered - creditsCount.registered} />) : (<></>)}
            </span>
            <CreditsCountLabelDelimiter />
            <span>
                <span className="text-muted">必要</span>
                <> </>
                <strong>
                    {
                        requiredCreditsCount.min === requiredCreditsCount.max ?
                            requiredCreditsCount.min :
                            `${requiredCreditsCount.min}~${requiredCreditsCount.max}`
                    }
                </strong>
            </span>
        </div>
    )
};

export const RequirementSummaryView = ({ requirement, plan }: {
    requirement: RequirementWithChildren | RequirementWithCourses,
    plan: Plan,
}) => {
    const status = requirement.getStatus(plan);
    return (
        <>
            <h5 className="d-flex justify-content-between align-items-center">
                <div>{requirement.name}</div>
                <Badge className="ml-2 flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                    {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                </Badge>
            </h5>
            <div>
                {requirement.description === undefined ? (<></>) : (<div className="text-muted">{requirement.description}</div>)}
                <CreditsCountLabels requirement={requirement} plan={plan} />
            </div>
        </>
    );
}
