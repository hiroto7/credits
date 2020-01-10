import { intersection } from 'lodash';
import React, { useState } from 'react';
import { Accordion, Button, Card, Col, Form, Modal, useAccordionToggle, Alert } from "react-bootstrap";
import Course from './Course';
import getValueFromModal, { useModals } from './getValueFromModal';
import RegistrationStatus from './RegistrationStatus';

const placeholder = ['GB10615', 'GB10664'].join('\n');

const CollectivelyCourseSetConfirmationModal = ({ onReturn, onExited }: {
    onReturn: (value: boolean) => void,
    onExited: () => void
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>科目の履修 / 修得状態をまとめて設定</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                続けると、現在の設定状態のうち、<strong>科目の履修 / 修得に関するものが失われます</strong>。
                よろしいですか？
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>いいえ</Button>
                <Button variant="danger" onClick={() => { setShow(false); onReturn(true); }}>はい</Button>
            </Modal.Footer>
        </Modal>
    );
}

const CodesInput = ({ label, codeToCourse, onChange }: {
    label: string,
    codeToCourse: ReadonlyMap<string, Course>,
    onChange: (courses: ReadonlySet<Course>) => void,
}) => {
    const [value, setValue] = useState("");
    const [coursesCount, setCoursesCount] = useState(0);
    const [undefinedCodes, setUndefinedCodes] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const nextValue = e.target.value;
        const codes = nextValue.split('\n').map(line => line.trim()).filter(line => line !== '');
        const courses = new Set(
            codes.map(code => codeToCourse.get(code))
                .filter((course): course is NonNullable<typeof course> => course !== undefined)
        );
        const nextUndefinedCodes = [...new Set(codes.filter(code => !codeToCourse.has(code)))];
        setValue(nextValue);
        setCoursesCount(courses.size);
        setUndefinedCodes(nextUndefinedCodes);
        onChange(courses);
    }

    return (
        <Form.Group as={Col}>
            <Form.Label>{label}</Form.Label>
            <Form.Control
                as="textarea" className="input-monospace" rows={5}
                placeholder={placeholder} value={value} onChange={handleChange}
            />
            <Form.Text>
                {coursesCount}個の科目
            </Form.Text>
            {
                undefinedCodes.length === 0 ? <></> : (
                    <Form.Text>
                        次の科目は見つかりません
                        <> : </>
                        {
                            undefinedCodes
                                .map<React.ReactNode>(code => (<code key={code}>{code}</code>))
                                .reduce((previous, current) => [previous, ', ', current])
                        }
                    </Form.Text>
                )
            }
        </Form.Group>
    );
}

const CollectivelyCourseSetView = ({ eventKey, codeToCourse, onSubmit }: {
    eventKey: string,
    codeToCourse: ReadonlyMap<string, Course>,
    onSubmit: (courseToStatus: ReadonlyMap<Course, RegistrationStatus.Acquired | RegistrationStatus.Registered>) => void,
}) => {
    const [registeredCourses, setRegisteredCourses] = useState<ReadonlySet<Course>>(new Set());
    const [acquiredCourses, setAcquiredCourses] = useState<ReadonlySet<Course>>(new Set<Course>());
    const toggle = useAccordionToggle(eventKey, () => { });
    const { modals, setModalsAndCount } = useModals();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!await getValueFromModal(CollectivelyCourseSetConfirmationModal, {}, setModalsAndCount)) {
            return;
        }
        onSubmit(new Map([
            ...[...registeredCourses].map(course => [course, RegistrationStatus.Registered] as const),
            ...[...acquiredCourses].map(course => [course, RegistrationStatus.Acquired] as const),
        ]));
        toggle();
    }

    const coursesOfIntersection = intersection([...registeredCourses], [...acquiredCourses]);

    return (
        <>
            {modals}
            <Card>
                <Card.Header>
                    <Accordion.Toggle eventKey={eventKey} variant="link" as={Button}>
                        科目の履修 / 修得状態をまとめて設定
                    </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey={eventKey}>
                    <Card.Body>
                        <p>
                            <strong>[科目の履修状態のロック] と組み合わせる</strong>と、
                            実際には履修していない科目を<strong>誤って [履修済み] / [修得済み] にすることを防げます</strong>。
                            なお、 "卒業要件を満たしているかどうか" を自動で判定することはできません。
                        </p>
                        <p>[OK] を押すと、現在の設定状態のうち、<strong>科目の履修 / 修得に関するものが失われます</strong>。</p>
                        <Form onSubmit={handleSubmit}>
                            <Form.Row>
                                <CodesInput label="履修する科目" codeToCourse={codeToCourse} onChange={setRegisteredCourses} />
                                <CodesInput label="修得済みの科目" codeToCourse={codeToCourse} onChange={setAcquiredCourses} />
                            </Form.Row>
                            {
                                coursesOfIntersection.length === 0 ? (<></>) : (
                                    <Alert variant="warning">
                                        <p>
                                            次の科目は [履修する科目] と [修得済みの科目] の両方に入力されています。
                                            このまま [OK] を押すと、<strong>修得済みの科目として設定されます</strong>。
                                        </p>
                                        <ul className="mb-0">
                                            {
                                                coursesOfIntersection.map(course => (
                                                    <li key={course.code}>
                                                        <code>{course.code}</code>
                                                        <> : </>
                                                        {course.title}
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </Alert>
                                )
                            }
                            <Button type="submit">OK</Button>
                        </Form>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </>
    )
};

export default CollectivelyCourseSetView;