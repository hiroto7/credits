import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Alert, Container, Navbar } from 'react-bootstrap';
import './App.css';
import RequirementSelector, { defaultRequirement } from './RequirementSelector';
import RequirementsRootView, { emptyPlan, Plan } from './RequirementsRootView';
import RegistrationStatus from './RegistrationStatus';
import Requirements, { RequirementWithChildren, RequirementWithCourses, SelectionRequirement } from './Requirements';

const COURSES_STATE = "courses-state"

type CoursesState = {[requirementTitle: string]: {code: string, status: RegistrationStatus}[]}

const App = () => {
    const [requirement, setRequirement] = useState(defaultRequirement);
    const [plan, setPlan] = useState(emptyPlan);

    if (plan === emptyPlan) {
        loadStoredCoursesState(requirement, plan)
    }

    useEffect(() => {
        if (plan === emptyPlan) {
            return
        }
        storeCoursesState(plan)
    }, [plan])

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
                <RequirementSelector onChange={requirement => {
                    setRequirement(requirement);
                    setPlan(emptyPlan);
                }} />
                <RequirementsRootView requirement={requirement} plan={plan} onChange={newPlan => setPlan(newPlan)} />
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
        return {...prev, [requirement.name]: values}
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

const loadStoredCoursesState = (rootRequirement: Requirements, plan: Plan) => {
    const coursesStateJson = localStorage.getItem(COURSES_STATE)
    if (!coursesStateJson || !(rootRequirement instanceof RequirementWithChildren)) {
        return
    }

    const coursesStateGroupedByRequirementTitle = JSON.parse(coursesStateJson) as CoursesState

    const flattenReqs = flattenRequirements(rootRequirement)

    Object.entries(coursesStateGroupedByRequirementTitle).forEach(([requirementTitle, coursesState]) => {
        console.log(requirementTitle)
        const requirement = flattenReqs.find((child) => child.name === requirementTitle)
        if (!requirement) {
            return
        }

        coursesState.forEach((courseState) => {
            const course = requirement.courses.find((course) => course.code === courseState.code)
             if (!course) {
                 return
             }
            plan.courseToRequirement.set(course, requirement)
            plan.courseToStatus.set(course, courseState.status)
        })
     })
}

export default App;