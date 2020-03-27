import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Accordion, Alert, Container, Dropdown, Form, Navbar } from 'react-bootstrap';
import { HashRouter, Link, Redirect, Route, Switch, useParams } from 'react-router-dom';
import { useLocalStorage } from 'react-use';
import './App.css';
import AssignmentSearchView from './AssignmentSearchView';
import CollectivelyCourseSetView from './CollectivelyCourseSetView';
import codeToCourse from './courses';
import ExportView from './ExportView';
import FilterType from './FilterType';
import ImportView from './ImportView';
import Plan, { emptyPlan, fromJSON, PlanJSON, toJSON } from './Plan';
import RegistrationStatusLockTarget from './RegistrationStatusLockTarget';
import requirementAndDictionaryPairs from './requirementInstances';
import Requirements, { RequirementWithCourses } from './Requirements';
import RequirementView from './RequirementView';

const RequirementWithConfiguration: React.FC<{
    requirement: Requirements,
    nameToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    plan: Plan,
    setPlan: (nextPlan: Plan) => void,
}> = ({ requirement, nameToRequirement, plan, setPlan }) => {
    const [filterType, setFilterType] = useState(FilterType.None);
    const { lockTarget, setLockTarget } = useLockTarget(filterType);

    return (
        <>
            <Accordion className="mb-3">
                <ExportView eventKey="0" plan={plan} />
                <ImportView
                    eventKey="1"
                    onSubmit={setPlan}
                    codeToCourse={codeToCourse}
                    nameToRequirement={nameToRequirement}
                />
            </Accordion>
            <div className="mb-3">
                <CollectivelyCourseSetView
                    codeToCourse={codeToCourse}
                    onSubmit={courseToStatus => setPlan({ ...plan, courseToStatus })}
                />
            </div>
            <div className="mb-3">
                <AssignmentSearchView
                    requirement={requirement}
                    nameToRequirement={nameToRequirement}
                    codeToCourse={codeToCourse}
                    plan={plan}
                    onSubmit={setPlan}
                />
            </div>
            <Form.Group>
                <Form.Label>履修状態のロック</Form.Label>
                {
                    [
                        {
                            label: "ロックしない",
                            lockTarget: RegistrationStatusLockTarget.None,
                            disabled: filterType !== FilterType.None,
                        },
                        {
                            label: "[履修する] と [修得済み] の間の変更のみ許可",
                            lockTarget: RegistrationStatusLockTarget.Unregistered,
                        },
                        {
                            label: "[履修しない] と [履修する] の間の変更のみ許可",
                            lockTarget: RegistrationStatusLockTarget.Acquired,
                            disabled: filterType !== FilterType.None,
                        },
                        {
                            label: "すべてロックする",
                            lockTarget: RegistrationStatusLockTarget.All,
                        },
                    ].map(({ label, disabled, lockTarget: lockTarget1 }) => (
                        <Form.Check
                            custom type="radio"
                            id={`lockTargetCheck${lockTarget1}`}
                            label={label} key={lockTarget1}
                            disabled={disabled}
                            checked={lockTarget === lockTarget1}
                            onChange={() => setLockTarget(lockTarget1)}
                        />
                    ))
                }
            </Form.Group>
            <Form.Group>
                <Form.Check
                    custom
                    id="filterTypeCheck0"
                    label="履修する科目のみ表示する"
                    checked={filterType !== FilterType.None}
                    onChange={
                        () => {
                            if (filterType === FilterType.None) {
                                setFilterType(FilterType.Registered);
                            } else {
                                setFilterType(FilterType.None);
                            }
                        }
                    }
                />
                <Form.Check
                    custom
                    id="filterTypeCheck1"
                    label="単位数の計算に含まれる科目のみ表示する"
                    checked={filterType === FilterType.Valid}
                    onChange={
                        () => {
                            if (filterType === FilterType.Valid) {
                                setFilterType(FilterType.Registered);
                            } else {
                                setFilterType(FilterType.Valid);
                            }
                        }
                    }
                />
            </Form.Group>
            <hr />
            <div className="mb-3">
                <RequirementView
                    requirement={requirement}
                    lockTarget={lockTarget} filterType={filterType}
                    plan={plan} onChange={setPlan}
                />
            </div>
        </>
    );
}

const InnerMain: React.FC<{ selectedId: string }> = ({ selectedId }) => {
    const { plan, setPlan } = usePlan(selectedId);

    const {
        requirement,
        nameToRequirement,
        name: selectedName,
    } = requirementAndDictionaryPairs.get(selectedId) ?? {};
    if (requirement === undefined || nameToRequirement === undefined || selectedName === undefined) {
        return (<Redirect to="/" />);
    }

    return (
        <>
            <Alert variant="danger" className="my-3">
                このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                <strong>科目や要件の定義が誤っていることや、実際には認められない履修の組み合わせが存在することがあります。</strong>
            </Alert>
            <Dropdown className="mb-3">
                <Dropdown.Toggle id="department-dropdown" variant="secondary">
                    <span
                        style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        学類
                    <> : </>
                        <strong>{selectedName}</strong>
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {
                        [...requirementAndDictionaryPairs.values()].map(
                            ({ id, name }) => (
                                <Dropdown.Item as={Link} to={`/${id}`} active={id === selectedId} key={id}>
                                    {name}
                                </Dropdown.Item>
                            )
                        )
                    }
                </Dropdown.Menu>
            </Dropdown>
            <RequirementWithConfiguration requirement={requirement} nameToRequirement={nameToRequirement} plan={plan} setPlan={setPlan} />
        </>
    );
}

const Main: React.FC = () => {
    const { requirementId } = useParams();
    if (requirementId === undefined) {
        return (<Redirect to="/" />);
    } else {
        return (<InnerMain selectedId={requirementId} />);
    }
}

const App: React.FC = () => (
    <HashRouter>
        <Navbar variant="dark" bg="dark">
            <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
        </Navbar>
        <Container>
            <Switch>
                <Route path="/:requirementId">
                    <Main />
                </Route>
                <Route path="/">
                    <Redirect to="/coins17" />
                </Route>
            </Switch>
        </Container>
    </HashRouter>
);

const useLockTarget = (filterType: FilterType) => {
    const [lockTarget, setLockTarget] = useState(RegistrationStatusLockTarget.None);

    if (filterType === FilterType.None) {
        return { lockTarget, setLockTarget };
    } else if (lockTarget === RegistrationStatusLockTarget.None) {
        return {
            lockTarget: RegistrationStatusLockTarget.Unregistered,
            setLockTarget,
        };
    } else if (lockTarget === RegistrationStatusLockTarget.Acquired) {
        return {
            lockTarget: RegistrationStatusLockTarget.All,
            setLockTarget,
        };
    } else {
        return { lockTarget, setLockTarget };
    }
}

const COURSES_STATE = "courses-state"

const usePlanMap = () => {
    const [storedJSON, setStoredJSON] = useLocalStorage<readonly (readonly [string, PlanJSON])[]>(COURSES_STATE);
    const [planMap0, setPlanMap0] = useState(() => {
        try {
            const storedPlanEntries = storedJSON.map(([requirementName, planJSON]) => {
                const nameToRequirement = requirementAndDictionaryPairs.get(requirementName)?.nameToRequirement;
                if (nameToRequirement === undefined) {
                    return undefined;
                } else {
                    try {
                        return [requirementName, fromJSON(planJSON, { codeToCourse, nameToRequirement })] as const;
                    } catch {
                        return undefined;
                    }
                }
            }).filter((value): value is NonNullable<typeof value> => value !== undefined);
            const storedPlanMap: ReadonlyMap<string, Plan> = new Map(storedPlanEntries);
            return storedPlanMap;
        } catch {
            const storedPlanMap: ReadonlyMap<string, Plan> = new Map();
            return storedPlanMap;
        }
    });
    const setPlanMap = (newPlanMap: ReadonlyMap<string, Plan>) => {
        const planJSONEntries = [...newPlanMap].map(([requirementName, plan]) => [requirementName, toJSON(plan)] as const);
        setPlanMap0(newPlanMap);
        setStoredJSON(planJSONEntries);
    };
    return {
        planMap: planMap0,
        setPlanMap,
    };
}

const usePlan = (requirementName: string) => {
    const { planMap, setPlanMap } = usePlanMap();

    const plan = planMap.get(requirementName) || emptyPlan;
    const setPlan = (newPlan: Plan) => {
        const newPlanMap = new Map([
            ...planMap,
            [requirementName, newPlan]
        ]);
        setPlanMap(newPlanMap);
    };

    return { plan, setPlan };
}

export default App;