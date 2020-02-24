import parse from 'csv-parse/lib/sync';
import { zip } from 'lodash';
import React, { useState } from 'react';
import { Accordion, Badge, Button, ButtonGroup, Card, Form, Modal, OverlayTrigger, Table, Tooltip, useAccordionToggle } from "react-bootstrap";
import Course from './Course';
import getValueFromModal, { useModals } from './getValueFromModal';
import { RegistrationStatus } from './Plan';
import safely from './safely';

const placeholder = `
"学籍番号","学生氏名","科目番号","科目名 ","単位数","春学期","秋学期","総合評価","科目区分","開講年度","開講区分"
"201700000","＊＊ ＊＊","GB10615","コンピュータリテラシ"," 2.0","-","-","A","A","2017","通常"
"201700000","＊＊ ＊＊","GB10664","プログラミング入門A"," 1.0","-","-","A","A","2017","通常"
`.trim();

type RegistrationStatus12 = RegistrationStatus.Registered | RegistrationStatus.Acquired

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
                続けると、<strong>現在の履修 / 修得状態が失われます</strong>。
                よろしいですか？
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>いいえ</Button>
                <Button variant="danger" onClick={() => { setShow(false); onReturn(true); }}>はい</Button>
            </Modal.Footer>
        </Modal>
    );
}

const Table1: React.FC<{
    codeColumnIndex: number,
    titleColumnIndex: number,
    courseAndRecordPairs: {
        course: Course | undefined,
        record: readonly string[],
    }[],
    courseToStatus: ReadonlyMap<Course, RegistrationStatus12>,
    setCourseToStatus: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ codeColumnIndex, titleColumnIndex, courseAndRecordPairs, courseToStatus, setCourseToStatus }) => (
    <Table
        bordered hover responsive
        style={{ whiteSpace: 'nowrap' }}
    >
        <tbody>
            {
                courseAndRecordPairs.map(
                    ({ course, record }, recordIndex) => {
                        const tds = record.map((cell, index) => (
                            <td>
                                {
                                    index === codeColumnIndex ?
                                        (<code>{cell}</code>) :
                                        index === titleColumnIndex ?
                                            cell :
                                            (<span className="text-muted">{cell}</span>)
                                }
                            </td>
                        ));

                        if (course === undefined) {
                            return (
                                <tr>
                                    <th style={{ textAlign: 'center' }}>
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip id={`record${recordIndex}-tooltip`}>この科目は見つかりません。</Tooltip>
                                            }
                                        >
                                            <Badge variant="secondary">?</Badge>
                                        </OverlayTrigger>
                                    </th>
                                    {tds}
                                </tr>
                            )
                        } else {
                            const status = courseToStatus.get(course);
                            const nextStatus = status === RegistrationStatus.Acquired ? RegistrationStatus.Registered : RegistrationStatus.Acquired;
                            const variant = status === RegistrationStatus.Acquired ? 'success' : 'primary';

                            return (
                                <tr
                                    onClick={
                                        () => setCourseToStatus(new Map([
                                            ...courseToStatus,
                                            [course, nextStatus]
                                        ]))
                                    }
                                    style={{ cursor: 'pointer' }}
                                    className={`table-${variant}`}
                                >
                                    <th style={{ textAlign: 'center' }}>
                                        <Badge variant={variant}>
                                            {status === RegistrationStatus.Acquired ? '修得済み' : '履修する'}
                                        </Badge>
                                    </th>
                                    {tds}
                                </tr>
                            )
                        }
                    }
                )
            }
        </tbody>
    </Table>
);

const getColumnIndex = (records: readonly string[][], callbackfn: (value: string, index: number, array: readonly string[]) => boolean) =>
    zip(...records)
        .map(row => row
            .map((value, index, array) => value !== undefined && callbackfn(value, index, array as string[]))
            .map(cell => +cell)
            .reduce((previous, current) => previous + current, 0))
        .reduce((previous, currentValue, currentIndex) => previous.value < currentValue ? {
            index: currentIndex,
            value: currentValue,
        } : previous, {
            index: -1,
            value: -Infinity,
        }).index;

const Table1AndButton: React.FC<{
    codeToCourse: ReadonlyMap<string, Course>,
    records: readonly string[][],
    onSubmit: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ codeToCourse, records, onSubmit }) => {
    const [courseToStatus, setCourseToStatus] = useState<ReadonlyMap<Course, RegistrationStatus12>>(new Map());

    const codeColumnIndex = getColumnIndex(records, cell => codeToCourse.has(cell));
    const titleColumnIndex = getColumnIndex(records, (cell, index) => {
        const course = codeToCourse.get(records[index][codeColumnIndex]);
        return course !== undefined && cell === course.title;
    });

    const courseAndRecordPairs = records.map(record => ({
        record,
        course: codeToCourse.get(record[codeColumnIndex])
    }));

    const handleOKClick = () => {
        onSubmit(new Map(
            courseAndRecordPairs
                .map(({ course }) => course)
                .filter((course): course is NonNullable<typeof course> => course !== undefined)
                .map(course => [course, courseToStatus.get(course) ?? RegistrationStatus.Registered])
        ));
    };

    const setAllCourseStatus = (status: RegistrationStatus12) => {
        setCourseToStatus(new Map(
            courseAndRecordPairs
                .map(({ course }) => course)
                .filter((course): course is NonNullable<typeof course> => course !== undefined)
                .map(course => [course, status])
        ));
    }

    return (
        <>
            <ButtonGroup className="mb-3">
                <Button
                    variant="outline-primary"
                    onClick={() => setAllCourseStatus(RegistrationStatus.Registered)}
                >
                    すべて履修する
                </Button>
                <Button
                    variant="outline-success"
                    onClick={() => setAllCourseStatus(RegistrationStatus.Acquired)}
                >
                    すべて修得済み
                </Button>
            </ButtonGroup>
            <Table1
                codeColumnIndex={codeColumnIndex}
                titleColumnIndex={titleColumnIndex}
                courseAndRecordPairs={courseAndRecordPairs}
                courseToStatus={courseToStatus}
                setCourseToStatus={setCourseToStatus}
            />
            <Button onClick={handleOKClick}>OK</Button>
        </>
    )
}

const CollectivelyCourseSetView: React.FC<{
    eventKey: string,
    codeToCourse: ReadonlyMap<string, Course>,
    onSubmit: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ eventKey, codeToCourse, onSubmit }) => {
    const toggle = useAccordionToggle(eventKey, () => { });
    const { modals, setModalsAndCount } = useModals();
    const [csv, setCSV] = useState("");

    const records: readonly string[][] | undefined = safely(parse, csv);
    const isInvalid = records === undefined;

    const handleSubmit = async (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => {
        if (!await getValueFromModal(CollectivelyCourseSetConfirmationModal, {}, setModalsAndCount)) {
            return;
        }
        onSubmit(courseToStatus);
        toggle();
    }

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
                        <Form.Group className={records === undefined || records.length === 0 ? 'mb-0' : ''}>
                            <Form.Label>科目番号のリストまたはCSV</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder={placeholder}
                                value={csv}
                                className="text-monospace"
                                onChange={
                                    (e: React.ChangeEvent<HTMLTextAreaElement>) => setCSV(e.target.value)
                                }
                                style={{ whiteSpace: 'pre' }}
                                isInvalid={isInvalid}
                            />
                            <Form.Control.Feedback type="invalid">不正な形式です</Form.Control.Feedback>
                        </Form.Group>
                        {
                            records === undefined || records.length === 0 ? <></> : <Table1AndButton
                                codeToCourse={codeToCourse}
                                records={records}
                                onSubmit={handleSubmit}
                            />
                        }
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </>
    )
};

export default CollectivelyCourseSetView;