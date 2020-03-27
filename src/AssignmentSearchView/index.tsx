import React, { useEffect, useState } from 'react';
import { Badge, Button, ListGroup, Modal, Spinner } from "react-bootstrap";
// eslint-disable-next-line import/no-webpack-loader-syntax
import AssignmentSearchWorker from 'worker-loader!./searchAssignment.worker';
import Course from '../Course';
import Plan, { fromJSON, PlanJSON, RegistrationStatus, toJSON } from '../Plan';
import Requirements, { RequirementWithCourses } from '../Requirements';

const AssignmentSearchView: React.FC<{
    requirement: Requirements,
    nameToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    codeToCourse: ReadonlyMap<string, Course>,
    plan: Plan,
    onSubmit: (plan: Plan) => void,
}> = ({ requirement, nameToRequirement, codeToCourse, plan, onSubmit }) => {
    const [worker, setWorker] = useState<Worker | undefined>(undefined);
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [plans, setPlans] = useState<readonly Plan[] | undefined>(undefined);

    const onMessage = (event: MessageEvent) => {
        if (event.data === 'done') {
            setIsLoading(false);
        } else {
            const planJSONList: readonly PlanJSON[] = event.data;
            const plans: readonly Plan[] = planJSONList.map(planJSON => fromJSON(planJSON, { codeToCourse, nameToRequirement }));
            setPlans(plans);
        }
    }

    const handleHide = () => {
        setShow(false);
        setWorker(undefined);
    }

    useEffect(() => () => {
        worker?.terminate();
    }, [worker]);

    return (
        <>
            <Button
                variant="secondary"
                onClick={
                    () => {
                        setShow(true);
                        setIsLoading(true);
                        setPlans(undefined);
                        const worker = new AssignmentSearchWorker();
                        setWorker(worker);
                        worker.addEventListener('message', onMessage);
                        worker.postMessage({
                            codeToCourse,
                            planJSON: toJSON(plan),
                            requirementJSON: requirement.toJSON(),
                        });
                    }
                }
            >
                要件を満たす割り当てを見つける
            </Button>
            <Modal show={show} onHide={handleHide}>
                <Modal.Header closeButton>
                    <Modal.Title>要件を満たす割り当てを見つける</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        全体として修得単位数や履修単位数が最大となるような割り当てを見つけます。
                        先に<b>履修状態の設定</b>、<b>主専攻の選択</b>、<b>単位数の入力</b>を行っておいてください。
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
                                                const creditsCounts = requirement.getRegisteredCreditsCounts(plan1, false);
                                                return (
                                                    <ListGroup.Item
                                                        key={`${creditsCounts.acquired}-${creditsCounts.registered}`}
                                                        action
                                                        onClick={() => { handleHide(); onSubmit(plan1); }}
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
                                    {plans === undefined ? '' : '単位数がより大きくなるような'}割り当てを探しています。
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
                    <Button variant="secondary" onClick={handleHide}>キャンセル</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default AssignmentSearchView;