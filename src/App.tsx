import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { Alert, Container, Navbar } from 'react-bootstrap';
import './App.css';
import Plan, { emptyPlan } from './Plan';
import RegistrationStatus from './RegistrationStatus';
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from './Requirements';
import RequirementSelector, { defaultRequirementAndName } from './RequirementSelector';
import RequirementsRootView from './RequirementsRootView';

const COURSES_STATE = "courses-state"

type CoursesState = { [requirementTitle: string]: { code: string, status: RegistrationStatus }[] }

const App = () => {
    const [requirementAndName, setRequirementAndName] = useState(defaultRequirementAndName);
    const [plan, setPlan] = useState(() => loadStoredCoursesState(requirementAndName));

    const handleRequirementChange = (requirementAndName: { name: string, requirement: Requirements }) => {
        setRequirementAndName(requirementAndName);
        setPlan(loadStoredCoursesState(requirementAndName));
    }

    useEffect(() => storeCoursesState(plan), [plan]);

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
                <RequirementSelector onChange={requirementAndName => handleRequirementChange(requirementAndName)} />
                <RequirementsRootView requirement={requirementAndName.requirement} plan={plan} onChange={newPlan => setPlan(newPlan)} />
            </Container>
        </>
    );
}

const storeCoursesState = (plan: Plan) => {
    const coursesState = Array.from(plan.courseToRequirement.entries()).reduce((prev, [course, requirement]) => {
        const status = plan.courseToStatus.get(course)
        if (!status) {
            return prev
        }

        const courseState = {
            code: course.code,
            status
        }
        const values = prev[requirement.name] || []
        values.push(courseState)
        return { ...prev, [requirement.name]: values }
    }, {} as CoursesState)

    localStorage.setItem(COURSES_STATE, JSON.stringify(coursesState))
}

const flattenRequirements = (requirement: Requirements): RequirementWithCourses[] => {
    if (requirement instanceof RequirementWithChildren) {
        return requirement.children.flatMap((child) => flattenRequirements(child))
    } else if (requirement instanceof RequirementWithCourses) {
        return [requirement as RequirementWithCourses]
    } else if (requirement instanceof SelectionRequirement) {
        return requirement.options.map((option) => option.requirement)
            .filter((req) => req instanceof RequirementWithCourses) as RequirementWithCourses[]
    }
    return []
}

const loadStoredCoursesState = ({ requirement: rootRequirement, name }: { requirement: Requirements, name: string }): Plan => {
    const coursesStateJson = localStorage.getItem(COURSES_STATE)
    if (!coursesStateJson) {
        return emptyPlan
    }

    const coursesStateGroupedByRequirementTitle = JSON.parse(coursesStateJson)[name] as CoursesState
    if (!coursesStateGroupedByRequirementTitle) {
        return emptyPlan
    }

    const flattenReqs = flattenRequirements(rootRequirement)

    const courseToRequirement = new Map();
    const courseToStatus = new Map();

    Object.entries(coursesStateGroupedByRequirementTitle).forEach(([requirementTitle, coursesState]) => {
        const requirement = flattenReqs.find((child) => child.name === requirementTitle)
        if (!requirement) {
            return
        }

        coursesState.forEach((courseState) => {
            const course = requirement.courses.find((course) => course.code === courseState.code)
            if (!course) {
                return
            }
            courseToRequirement.set(course, requirement)
            courseToStatus.set(course, courseState.status)
        })
    })

    return {
        courseToRequirement,
        courseToStatus,
        selectionNameToOptionName: new Map(),
        requirementToOthersCount: new Map(),
    }
}

export default App;