import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Button, ListGroup, Modal, Spinner } from "react-bootstrap";
// eslint-disable-next-line import/no-webpack-loader-syntax
import AssignmentsFindWorker from 'worker-loader!./findAssignments.worker';
import Course from '../Course';
import Plan, { fromJSON, PlanJSON, RegistrationStatus, toJSON } from '../Plan';
import Requirements, { RequirementWithCourses } from '../Requirements';

const AssignmentsFindView: React.FC<{
    show: boolean,
    requirement: Requirements,
    idToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    codeToCourse: ReadonlyMap<string, Course>,
    plan: Plan,
    onHide: () => void,
    onSubmit: (plan: Plan) => void,
}> = ({ show, requirement, idToRequirement, codeToCourse, plan, onHide, onSubmit }) => {
    const [worker, setWorker] = useState<Worker | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [plans, setPlans] = useState<readonly Plan[] | undefined>(undefined);

    const onMessage = useCallback((event: MessageEvent) => {
        if (event.data === 'done') {
            setIsLoading(false);
        } else {
            const planJSONList: readonly PlanJSON[] = event.data;
            const plans: readonly Plan[] = planJSONList.map(planJSON => fromJSON(planJSON, { codeToCourse, idToRequirement }));
            setPlans(plans);
        }
    }, [codeToCourse, idToRequirement])

    useEffect(() => {
        if (show) {
            setIsLoading(true);
            setPlans(undefined);
            const worker = new AssignmentsFindWorker();
            setWorker(worker);
            worker.addEventListener('message', onMessage);
            worker.postMessage({
                codeToCourse,
                planJSON: toJSON(plan),
                requirementJSON: requirement.toJSON(),
            });

            return () => setWorker(undefined);
        }
    }, [codeToCourse, onMessage, plan, requirement, show]);

    useEffect(() => () => {
        if (worker !== undefined) {
            worker.terminate();
            worker.removeEventListener('message', onMessage);
        }
    }, [onMessage, worker]);

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>最適な割り当ての自動探索</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    全体として修得単位数や履修単位数が最大となるような割り当てを見つけます。
                        先に<b>履修状態の設定</b>と<b>単位数の入力</b>を行っておいてください。
                    </p>
                {
                    plans === undefined ?
                        isLoading ? (<></>) : (<strong className="text-danger">要件を満たす割り当ては見つかりませんでした。</strong>) :
                        (
                            <>
                                <p>見つかった割り当てが以下に表示されています。適用するものを選択します。</p>
                                <ListGroup className={isLoading ? 'mb-3' : undefined}>
                                    {
                                        plans.map(plan1 => {
                                            const status = requirement.getStatus(plan1);
                                            const creditsCounts = requirement.getRegisteredCreditCounts(plan1, false);
                                            return (
                                                <ListGroup.Item
                                                    key={`${creditsCounts.acquired}-${creditsCounts.registered}`}
                                                    action
                                                    onClick={() => { onHide(); onSubmit(plan1); }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            修得
                                                                <> </>
                                                            <strong className="text-success">{creditsCounts.acquired}</strong>
                                                            <> / </>
                                                                履修
                                                                <> </>
                                                            <strong className="text-primary">{creditsCounts.registered}</strong>
                                                        </div>
                                                        <Badge className="ml-2 flex-shrink-0" variant={status === RegistrationStatus.Acquired ? 'success' : status === RegistrationStatus.Registered ? 'primary' : 'secondary'}>
                                                            {status === RegistrationStatus.Acquired ? '修得OK' : status === RegistrationStatus.Registered ? '履修OK' : '不足'}
                                                        </Badge>
                                                    </div>
                                                    {
                                                        [...plan1.selectionNameToOptionName].map(([selectionName, optionName]) => (
                                                            <div key={selectionName}>
                                                                {selectionName}
                                                                <> : </>
                                                                <strong>{optionName}</strong>
                                                            </div>
                                                        ))
                                                    }
                                                </ListGroup.Item>
                                            )
                                        })
                                    }
                                </ListGroup>
                            </>
                        )
                }
                {
                    isLoading ? (
                        <>
                            <p>
                                {plans === undefined ? '' : 'そのほかの'}割り当てを探しています。
                                    この処理は短時間で終了しない場合があります。
                                </p>
                            <div className="text-center">
                                <Spinner animation="border" variant="primary" />
                            </div>
                        </>
                    ) : (<></>)
                }
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>キャンセル</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AssignmentsFindView;

export const AssignmentsFindButton: React.FC<{
    requirement: Requirements,
    idToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    codeToCourse: ReadonlyMap<string, Course>,
    plan: Plan,
    onSubmit: (plan: Plan) => void,
}> = ({ requirement, idToRequirement, codeToCourse, plan, onSubmit }) => {
    const [show, setShow] = useState(false);

    return (
        <>
            <Button variant="secondary" onClick={() => setShow(true)}>
                最適な割り当ての自動探索
            </Button>
            <AssignmentsFindView
                show={show}
                onHide={() => setShow(false)}
                requirement={requirement}
                idToRequirement={idToRequirement}
                codeToCourse={codeToCourse}
                plan={plan}
                onSubmit={onSubmit}
            />
        </>
    )
}