import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Alert, Container, Navbar } from 'react-bootstrap';
import { useLocalStorage } from 'react-use';
import './App.css';
import codeToCourse from './courses';
import Plan, { emptyPlan, fromJSON, PlanJSON, toJSON } from './Plan';
import Requirements, { RequirementWithCourses } from './Requirements';
import RequirementSelector, { defaultSelected } from './RequirementSelector';
import RequirementsRootView from './RequirementsRootView';
import Course from './Course';

const COURSES_STATE = "courses-state"

const App = () => {
    const [selected, setSelected] = useState(defaultSelected);
    const [json, setJSON] = useLocalStorage<[string, PlanJSON][]>(COURSES_STATE);
    const planJSONMap = new Map(json);
    const [plan, setPlan] = useState(getPlanFromJSONMap({
        planJSONMap,
        codeToCourse,
        requirementName: selected.name,
        nameToRequirement: selected.dictionary,
    }));

    const setStoredPlan = (newPlan: Plan) => setJSON([...new Map<string, PlanJSON>([
        ...planJSONMap,
        [selected.name, toJSON(newPlan)]
    ])]);

    const handleRequirementChange = (selected: { name: string, requirement: Requirements, dictionary: ReadonlyMap<string, RequirementWithCourses> }) => {
        setSelected(selected);
        setPlan(getPlanFromJSONMap({
            planJSONMap,
            codeToCourse,
            requirementName: selected.name,
            nameToRequirement: selected.dictionary,
        }));
    }

    const handlePlanChange = (newPlan: Plan) => {
        setPlan(newPlan);
        setStoredPlan(newPlan);
    }

    return (
        <>
            <Navbar variant="dark" bg="dark">
                <Navbar.Brand>卒業要件を満たしたい</Navbar.Brand>
            </Navbar>
            <Container>
                <Alert variant="danger" className="mt-3">
                    このツールの結果を利用する場合、必ず履修要覧や支援室などでその結果が正しいことを確認するようにしてください。
                    <strong>科目や要件の定義が誤っていたり、実際には認められない履修の組み合わせがある可能性があります。</strong>
                </Alert>
                <RequirementSelector onChange={selected => handleRequirementChange(selected)} />
                <RequirementsRootView requirement={selected.requirement} plan={plan} onChange={newPlan => handlePlanChange(newPlan)} />
            </Container>
        </>
    );
}

const getPlanFromJSONMap = ({ planJSONMap, requirementName, codeToCourse, nameToRequirement }: {
    planJSONMap: ReadonlyMap<string, PlanJSON>,
    requirementName: string,
    codeToCourse: ReadonlyMap<string, Course>,
    nameToRequirement: ReadonlyMap<string, RequirementWithCourses>,
}) => {
    const planJSON = planJSONMap.get(requirementName);
    if (planJSON === undefined) {
        return emptyPlan;
    } else {
        return fromJSON(planJSON, { codeToCourse, nameToRequirement });
    }
}

export default App;