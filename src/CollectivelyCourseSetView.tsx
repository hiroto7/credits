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
    titleColumnIndex: number | undefined,
    creditsCountColumnIndex: number | undefined,
    courseAndRecordPairs: {
        course: Course | undefined,
        record: readonly string[],
    }[],
    courseToStatus: ReadonlyMap<Course, RegistrationStatus12>,
    setCourseToStatus: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ codeColumnIndex, titleColumnIndex, creditsCountColumnIndex, courseAndRecordPairs, courseToStatus, setCourseToStatus }) => {
    const {
        course: firstCourse,
        record: firstRecord,
    } = courseAndRecordPairs[0];

    const firstRecordIsHeader =
        firstCourse === undefined &&
        firstRecord[codeColumnIndex].trim() === '科目番号' &&
        (titleColumnIndex === undefined || firstRecord[titleColumnIndex].trim() === '科目名') &&
        (creditsCountColumnIndex === undefined || firstRecord[creditsCountColumnIndex].trim() === '単位数');

    return (
        <Table
            bordered hover responsive
            style={{ whiteSpace: 'nowrap' }}
        >
            <thead>
                <th></th>
                <th>科目番号</th>
                <th>科目名</th>
                <th>単位数</th>
                {
                    firstRecord
                        .filter((_, index) => index !== codeColumnIndex && index !== titleColumnIndex && index !== creditsCountColumnIndex)
                        .map(cell => (<th>{firstRecordIsHeader ? cell : (<></>)}</th>))
                }
            </thead>
            <tbody>
                {
                    (firstRecordIsHeader ? courseAndRecordPairs.slice(1) : courseAndRecordPairs).map(
                        ({ course, record }, recordIndex) => {
                            const getTdContent = <T,>(index: number | undefined, f0: (course: Course) => T, f1: (recordData: string) => T) => {
                                const recordData = index === undefined ? undefined : record[index];
                                return (
                                    course === undefined ?
                                        recordData :
                                        recordData === undefined || f0(course) === f1(recordData) ?
                                            f0(course) :
                                            (
                                                <>
                                                    <div><del>{recordData}</del></div>
                                                    <div><ins>{f0(course)}</ins></div>
                                                </>
                                            )
                                );
                            }

                            const tds0 = (
                                <>
                                    <td><code>{record[codeColumnIndex]}</code></td>
                                    <td>{getTdContent(titleColumnIndex, course => course.title, recordTitle => recordTitle.trim())}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {getTdContent(creditsCountColumnIndex, course => course.creditsCount, recordCreditsCount => +recordCreditsCount)}
                                    </td>
                                </>
                            );
                            const tds1 = record
                                .map((cell, index) => (
                                    <td>
                                        {
                                            index === codeColumnIndex ?
                                                (<code>{cell}</code>) :
                                                index === titleColumnIndex ?
                                                    cell :
                                                    (<span className="text-muted">{cell}</span>)
                                        }
                                    </td>
                                ))
                                .filter((_, index) =>
                                    index !== codeColumnIndex &&
                                    index !== titleColumnIndex &&
                                    index !== creditsCountColumnIndex
                                );

                            const tds = (<>{tds0}{tds1}</>);

                            if (course === undefined) {
                                return (
                                    <tr>
                                        <td style={{ textAlign: 'center' }}>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip id={`record${recordIndex}-tooltip`}>この科目は見つかりません。</Tooltip>
                                                }
                                            >
                                                <Badge variant="secondary">?</Badge>
                                            </OverlayTrigger>
                                        </td>
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
                                        <td style={{ textAlign: 'center' }}>
                                            <Badge variant={variant}>
                                                {status === RegistrationStatus.Acquired ? '修得済み' : '履修する'}
                                            </Badge>
                                        </td>
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
}

const getColumnIndex = (records: readonly string[][], callbackfn: (value: string, index: number, array: readonly string[]) => boolean) => {
    const { index, value } = zip(...records)
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
        });
    if (value === 0) {
        return undefined;
    } else {
        return index;
    }
}
const Table1AndButton: React.FC<{
    codeColumnIndex: number,
    codeToCourse: ReadonlyMap<string, Course>,
    records: readonly string[][],
    onSubmit: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ codeColumnIndex, codeToCourse, records, onSubmit }) => {
    const [courseToStatus, setCourseToStatus] = useState<ReadonlyMap<Course, RegistrationStatus12>>(new Map());

    const courseAndRecordPairs = records.map(record => ({
        record,
        course: codeToCourse.get(record[codeColumnIndex].trim())
    }));
    const titleColumnIndex = getColumnIndex(records, (cell, index) => {
        const course = codeToCourse.get(records[index][codeColumnIndex]);
        return course !== undefined && cell.trim() === course.title;
    });
    const creditsCountColumnIndex = getColumnIndex(records, (cell, index) => {
        const course = codeToCourse.get(records[index][codeColumnIndex]);
        return course !== undefined && +cell === course.creditsCount;
    })

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
            <hr />
            <p>
                読み込んだ科目が以下に表示されています。
                それぞれの科目を [履修する] / [修得済み] のいずれかに設定し、 [OK] ボタンを押します。
                <strong>現在の履修 / 修得状態は失われます。</strong>
            </p>
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
                creditsCountColumnIndex={creditsCountColumnIndex}
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
    const [validated, setValidated] = useState(false);

    const records: readonly string[][] | undefined = safely(parse, csv);
    const codeColumnIndex = records && getColumnIndex(records, cell => codeToCourse.has(cell.trim()))!;

    const feedback =
        records === undefined ? '形式が不正です' :
            records.length === 0 ? '入力してください' :
                codeColumnIndex === undefined ? '科目がひとつも見つかりません' :
                    undefined;

    const handleSubmit = async (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => {
        if (!await getValueFromModal(CollectivelyCourseSetConfirmationModal, {}, setModalsAndCount)) {
            return;
        }
        onSubmit(courseToStatus);
        toggle();
    }

    const handleCSVChange = (nextCSV: string) => {
        setCSV(nextCSV);
        setValidated(true);
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
                        <p>
                            履修する科目や修得する科目の番号が含まれるCSVデータを用意します。
                        </p>
                        <ul>
                            <li>[成績照会] 画面から出力したCSVファイルをそのまま使用できます。</li>
                            <li>1行ごとに科目番号のみを記述したデータでも構いません。</li>
                        </ul>
                        <p>
                            用意したデータをテキストボックスに貼り付けるか、ファイルとして読み込みます。
                        </p>
                        <Form.Group>
                            <Form.Label>CSV / 科目番号のリスト</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder={placeholder}
                                value={csv}
                                className="text-monospace"
                                onChange={
                                    (event: React.ChangeEvent<HTMLTextAreaElement>) => handleCSVChange(event.target.value)
                                }
                                style={{ whiteSpace: 'pre' }}
                                isInvalid={validated && feedback !== undefined}
                            />
                            <Form.Control.Feedback type="invalid">{feedback}</Form.Control.Feedback>
                        </Form.Group>
                        <Form.Group className={records === undefined || records.length === 0 ? 'mb-0' : ''}>
                            <Form.Label>CSVファイル / 科目番号のリストが記述されたファイル</Form.Label>
                            <div className="custom-file">
                                <input
                                    type="file"
                                    accept="text/plain"
                                    className="custom-file-input"
                                    id="csv-file-input"
                                    onChange={
                                        (event: React.ChangeEvent<HTMLInputElement>) => {
                                            const file = event.target.files?.item(0);
                                            if (file === null || file === undefined) {
                                                return;
                                            }
                                            const reader = new FileReader();
                                            reader.addEventListener('load', () => {
                                                if (typeof reader.result === 'string') {
                                                    handleCSVChange(reader.result);
                                                }
                                            });
                                            reader.readAsText(file);
                                        }
                                    }
                                />
                                <label className="custom-file-label" htmlFor="csv-file-input">Choose file</label>
                            </div>
                        </Form.Group>
                        {
                            records === undefined || records.length === 0 || codeColumnIndex === undefined ?
                                <></> :
                                <Table1AndButton
                                    codeColumnIndex={codeColumnIndex}
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