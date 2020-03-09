import React, { useState } from 'react';
import { Button, ListGroup, Modal, Badge } from "react-bootstrap";
import Course from './Course';
import Plan, { RegistrationStatus, RegisteredCreditsCounts } from './Plan';
import Requirements, { Range, RequirementWithCourses } from './Requirements';

function* f0(
    requiredCreditsCount: Range,
    unselectedCourses: readonly Course[],
    selectedCourses: readonly Course[],
    selectedCreditsCountSum: number,
    selectedCreditsCountMin: number
): Generator<readonly Course[], void, undefined> {
    if (selectedCreditsCountSum >= requiredCreditsCount.max) {
        if (selectedCreditsCountMin > selectedCreditsCountSum - requiredCreditsCount.max) {
            yield selectedCourses;
        }
    } else if (unselectedCourses.length === 0) {
        if (selectedCreditsCountSum >= requiredCreditsCount.min) {
            yield selectedCourses;
        }
    } else {
        for (const [index, course] of unselectedCourses.entries()) {
            const slicedCourseList = unselectedCourses.slice(index + 1);
            const courseLists = f0(
                requiredCreditsCount,
                slicedCourseList,
                [...selectedCourses, course],
                selectedCreditsCountSum + course.creditsCount,
                Math.min(selectedCreditsCountMin, course.creditsCount),
            );
            yield* courseLists;
        }
    }
}

function* f1(requirements: readonly RequirementWithCourses[], plan: Plan): Generator<Plan, void, undefined> {
    if (requirements.length === 0) {
        yield plan;
        return;
    }

    const t0 = requirements.reduce<{
        requirement: RequirementWithCourses,
        courseLists: readonly (readonly Course[])[],
    } | undefined>((previous, current) => {
        const courses0 = current.courses.filter(course => plan.courseToRequirement.get(course) === undefined && (plan.courseToStatus.get(course) ?? RegistrationStatus.Unregistered) !== RegistrationStatus.Unregistered);
        const courseLists: (readonly Course[])[] = [];
        for (const courses of f0(current.creditsCount, courses0, [], 0, Infinity)) {
            if (previous !== undefined && courseLists.length + 1 >= previous.courseLists.length) {
                return previous;
            }
            courseLists.push(courses);
        }
        return {
            requirement: current,
            courseLists,
        }
    }, undefined);

    if (t0 === undefined) {
        throw new Error();
    }

    for (const courses of t0.courseLists) {
        const plan0: Plan = {
            ...plan,
            courseToRequirement: new Map([
                ...plan.courseToRequirement,
                ...courses.map(course => [course, t0.requirement] as const),
            ])
        };
        const plans = f1(requirements.filter(requirement => requirement !== t0.requirement), plan0)
        yield* plans;
    }
}

function* f2(requirement: Requirements, plan: Plan): Generator<readonly Plan[], void, undefined> {
    const requirements = requirement.f(plan.selectionNameToOptionName);
    const plan0 = { ...plan, courseToRequirement: new Map() };
    let t0: readonly {
        plan: Plan,
        creditsCounts: RegisteredCreditsCounts,
    }[] | undefined = undefined;
    for (const plan1 of f1(requirements, plan0)) {
        const creditsCounts = requirement.getRegisteredCreditsCounts(plan1, false);
        if (t0 === undefined) {
            t0 = [{
                plan: plan1,
                creditsCounts,
            }];
            yield [plan1];
        } else {
            let t1 = false;
            const t2: {
                plan: Plan,
                creditsCounts: RegisteredCreditsCounts,
            }[] = [];
            for (const t3 of t0) {
                if (!t1 && (
                    creditsCounts.acquired > t3.creditsCounts.acquired ||
                    creditsCounts.registered > t3.creditsCounts.registered
                )) {
                    t2.push({
                        plan: plan1,
                        creditsCounts,
                    });
                    t1 = true;
                }
                if ((
                    t3.creditsCounts.acquired > creditsCounts.acquired ||
                    t3.creditsCounts.registered > creditsCounts.registered
                ) && (
                        t3.creditsCounts.acquired === creditsCounts.acquired &&
                        t3.creditsCounts.registered === creditsCounts.registered
                    )) {
                    t2.push(t3);
                }
            }
            if (t1) {
                t0 = t2;
                yield t0.map(({ plan }) => plan);
            }
        }
    }
}

const V0: React.FC<{
    requirement: Requirements,
    plan: Plan,
    onSubmit: (plan: Plan) => void,
}> = ({ requirement, plan, onSubmit }) => {
    const [show, setShow] = useState(false);
    const [plans, setPlans] = useState<readonly Plan[] | undefined>(undefined);

    return (
        <>
            <Button
                variant="secondary"
                onClick={
                    () => {
                        setShow(true);
                        for (const p of f2(requirement, plan)) {
                            setPlans(p);
                        }
                    }
                }
            >
                要件を満たす割り当てを見つける
            </Button>
            <Modal show={show} onHide={() => setShow(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>要件を満たす割り当てを見つける</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {
                        plans === undefined ? '要件を満たす割り当ては見つかりませんでした。' : (
                            <>
                                <p>要件を満たす割り当てが {plans.length} 個見つかりました。適用したいものを選択してください。</p>
                                <ListGroup>
                                    {
                                        plans.map(plan1 => {
                                            const status = requirement.getStatus(plan1);
                                            const creditsCounts = requirement.getRegisteredCreditsCounts(plan1, false);
                                            return (
                                                <ListGroup.Item
                                                    key={`${creditsCounts.acquired}-${creditsCounts.registered}`}
                                                    action
                                                    onClick={() => { setShow(false); onSubmit(plan1); }}
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
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShow(false)}>キャンセル</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default V0;