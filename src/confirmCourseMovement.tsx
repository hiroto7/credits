import React, { useState } from "react";
import { Button, Card, Modal } from "react-bootstrap";
import Course from "./Course";
import RegistrationStatus from "./RegistrationStatus";
import Requirements, { RegisteredCreditsCounts, RequirementWithCourses, SelectionRequirement } from "./Requirements";
import { RequirementSummaryView } from "./RequirementView";

const CourseMovementConfirmationModal = ({ currentRequirement, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount, onReturn, onExited }: {
    currentRequirement: RequirementWithCourses,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    onReturn: (value: boolean) => void,
    onExited: () => void,
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Body>
                <p>
                    この科目はすでに以下の要件に割り当てられています。
                    <strong>続けると、この要件への割り当ては解除されます。</strong>
                </p>
                <p>各科目に割り当てできる要件は1つまでです。</p>
                <Card body>
                    <RequirementSummaryView
                        requirement={currentRequirement}
                        courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                        selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    />
                </Card>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>キャンセル</Button>
                <Button variant="primary" onClick={() => { setShow(false); onReturn(true); }}>続ける</Button>
            </Modal.Footer>
        </Modal>
    );
};

const confirmCourseMovement = async ({ currentRequirement, courseToStatus, courseToRequirement, selectionToRequirement, requirementToOthersCount, modals, setModals }: {
    currentRequirement: RequirementWithCourses,
    courseToStatus: Map<Course, RegistrationStatus>,
    courseToRequirement: Map<Course, Requirements>,
    selectionToRequirement: Map<SelectionRequirement, Requirements>,
    requirementToOthersCount: Map<RequirementWithCourses, RegisteredCreditsCounts>,
    modals: JSX.Element[],
    setModals: React.Dispatch<React.SetStateAction<JSX.Element[]>>
}): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        try {
            const modal = (
                <CourseMovementConfirmationModal
                    currentRequirement={currentRequirement}
                    courseToStatus={courseToStatus} courseToRequirement={courseToRequirement}
                    selectionToRequirement={selectionToRequirement} requirementToOthersCount={requirementToOthersCount}
                    onReturn={value => resolve(value)}
                    onExited={() => {
                        setModals(newModals.filter(value => value !== modal));
                    }}
                />
            );
            const newModals = [...modals, modal];
            setModals(newModals);
        } catch (e) {
            reject(e);
        }
    });
};

export default confirmCourseMovement;